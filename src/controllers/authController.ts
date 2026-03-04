import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// @route  POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'El email ya está registrado' });
      return;
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token: generateToken(user._id.toString()),
      user: {
        id:           user._id,
        name:         user.name,
        email:        user.email,
        profile:      user.profile,
        weeklyBudget: user.weeklyBudget,
      },
    });
  } catch (error) {
    console.error('ERROR REGISTER:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    res.status(200).json({
      message: 'Login exitoso',
      token: generateToken(user._id.toString()),
      user: {
        id:           user._id,
        name:         user.name,
        email:        user.email,
        profile:      user.profile,
        weeklyBudget: user.weeklyBudget,
      },
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('ERROR GET ME:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  PUT /api/auth/me  — actualiza perfil nutricional completo
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      weeklyBudget,
      profile,
    } = req.body;

    // Construir objeto de actualización solo con los campos enviados
    const updateData: Record<string, any> = {};
    if (name         !== undefined) updateData.name         = name;
    if (weeklyBudget !== undefined) updateData.weeklyBudget = weeklyBudget;

    // Actualizar campos individuales del perfil sin pisar los demás
    if (profile) {
      if (profile.age           !== undefined) updateData['profile.age']           = profile.age;
      if (profile.weight        !== undefined) updateData['profile.weight']        = profile.weight;
      if (profile.height        !== undefined) updateData['profile.height']        = profile.height;
      if (profile.activityLevel !== undefined) updateData['profile.activityLevel'] = profile.activityLevel;
      if (profile.goal          !== undefined) updateData['profile.goal']          = profile.goal;
      if (profile.dietType      !== undefined) updateData['profile.dietType']      = profile.dietType;
      if (profile.allergies     !== undefined) updateData['profile.allergies']     = profile.allergies;
      if (profile.dailyCalories !== undefined) updateData['profile.dailyCalories'] = profile.dailyCalories;
      if (profile.macros        !== undefined) updateData['profile.macros']        = profile.macros;
    }

    const user = await User.findByIdAndUpdate(
      (req as any).userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ message: 'Perfil actualizado', user });
  } catch (error) {
    console.error('ERROR UPDATE ME:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  PUT /api/auth/me/profile  — configura el perfil nutricional inicial (asistente)
export const setupProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { age, weight, height, activityLevel, goal, dietType, allergies, weeklyBudget } = req.body;

    // Calcular calorías diarias con fórmula Harris-Benedict
    const user = await User.findById((req as any).userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    let bmr = 0;
    if (weight && height && age) {
      // Fórmula general (sin género por ahora)
      bmr = 10 * weight + 6.25 * height - 5 * age;
    }

    const activityMultiplier: Record<string, number> = {
      low: 1.2, medium: 1.55, high: 1.9,
    };
    const multiplier     = activityMultiplier[activityLevel ?? 'medium'] ?? 1.55;
    const goalAdjustment: Record<string, number> = {
      lose: -300, maintain: 0, gain: 300,
    };
    const dailyCalories = bmr > 0
      ? Math.round(bmr * multiplier + (goalAdjustment[goal ?? 'maintain'] ?? 0))
      : 2000;

    // Distribución de macros estándar
    const macros = {
      protein: Math.round((dailyCalories * 0.25) / 4),  // 25% proteína
      carbs:   Math.round((dailyCalories * 0.50) / 4),  // 50% carbos
      fat:     Math.round((dailyCalories * 0.25) / 9),  // 25% grasa
    };

    const updated = await User.findByIdAndUpdate(
      (req as any).userId,
      {
        $set: {
          weeklyBudget: weeklyBudget ?? user.weeklyBudget,
          'profile.age':           age,
          'profile.weight':        weight,
          'profile.height':        height,
          'profile.activityLevel': activityLevel,
          'profile.goal':          goal,
          'profile.dietType':      dietType,
          'profile.allergies':     allergies ?? [],
          'profile.dailyCalories': dailyCalories,
          'profile.macros':        macros,
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: 'Perfil nutricional configurado',
      user: updated,
      calculated: { dailyCalories, macros },
    });
  } catch (error) {
    console.error('ERROR SETUP PROFILE:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : error,
    });
  }
};