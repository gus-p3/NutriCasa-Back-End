import { Request, Response } from 'express';
import User from '../models/User.model';

export class UsersController {
  
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { name, email, profile } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      // Validar si el email ha sido cambiado y si ya está en uso
      if (email && email !== user.email) {
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          res.status(400).json({ message: 'El correo electrónico ya está en uso por otra cuenta.' });
          return;
        }
        user.email = email;
      }

      if (name) user.name = name;

      if (profile) {
        // Actualizar campos individuales para evitar sobreescribir subdocumentos enteros (como macros)
        if (profile.age !== undefined) user.profile.age = Number(profile.age);
        if (profile.weight !== undefined) user.profile.weight = Number(profile.weight);
        if (profile.height !== undefined) user.profile.height = Number(profile.height);
        if (profile.activityLevel !== undefined) user.profile.activityLevel = profile.activityLevel;
        if (profile.goal !== undefined) user.profile.goal = profile.goal;
        if (profile.dietType !== undefined) user.profile.dietType = profile.dietType;
        if (profile.allergies !== undefined) user.profile.allergies = profile.allergies;

        // Recalcular Daily Calories (Harris-Benedict)
        const { weight, height, age, activityLevel, goal } = user.profile;
        if (weight && height && age) {
          // Fórmula estándar para metabolismo basal
          const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
          const actMult: Record<string, number> = { low: 1.2, medium: 1.55, high: 1.9 };
          const goalAdj: Record<string, number> = { lose: -300, maintain: 0, gain: 300 };

          const dailyCalories = Math.round(bmr * (actMult[activityLevel ?? 'medium'] ?? 1.55) + (goalAdj[goal ?? 'maintain'] ?? 0));
          user.profile.dailyCalories = dailyCalories > 0 ? dailyCalories : 2000;

          // Macros basados en la caloría, asegurando que no sean undefined
          user.profile.macros = {
            protein: Math.round((user.profile.dailyCalories * 0.25) / 4) || 0,
            carbs:   Math.round((user.profile.dailyCalories * 0.50) / 4) || 0,
            fat:     Math.round((user.profile.dailyCalories * 0.25) / 9) || 0,
          };
        }
      }

      await user.save();

      // Devolver usuario actualizado (sin password)
      const updatedUser = await User.findById(userId).select('-password');

      res.status(200).json({
        message: 'Perfil actualizado exitosamente',
        user: updatedUser
      });
      
    } catch (error: any) {
      console.error('ERROR UPDATE PROFILE:', error);
      res.status(500).json({ message: 'Error en el servidor al actualizar perfil', error: error.message });
    }
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      // Validar contraseña actual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        return;
      }

      // Asignar nueva contraseña (User.model.ts ya hace el bcrypt rehashing en el hook pre-save)
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
      
    } catch (error: any) {
      console.error('ERROR CHANGE PASSWORD:', error);
      res.status(500).json({ message: 'Error en el servidor al actualizar contraseña', error: error.message });
    }
  }
}
