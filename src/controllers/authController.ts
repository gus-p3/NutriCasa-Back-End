import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model';
import RefreshToken from '../models/RefreshToken.model';
import { EmailService } from '../services/emailService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY  = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: '/',
};

const hash = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (id: string, role: string): string =>
  jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: ACCESS_TOKEN_EXPIRY });

const generateRefreshToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: REFRESH_TOKEN_EXPIRY });

/** Save a refresh token to the DB (hashed) and set it in an httpOnly cookie. */
const issueRefreshToken = async (res: Response, userId: string): Promise<void> => {
  const rawToken = generateRefreshToken(userId);
  const tokenHash = hash(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await RefreshToken.create({ userId, tokenHash, expiresAt });
  res.cookie('refreshToken', rawToken, REFRESH_COOKIE_OPTIONS);
};

const formatUser = (user: any) => ({
  id:           user._id,
  name:         user.name,
  email:        user.email,
  role:         user.role,
  profile:      user.profile,
  weeklyBudget: user.weeklyBudget,
  twoFactorEnabled: user.twoFactorEnabled,
});

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'El email ya está registrado' });
      return;
    }

    // Generar código de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const user = await User.create({
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      isVerified: false
    });

    // Enviar correo en segundo plano para no bloquear la respuesta
    EmailService.sendVerificationCode(email, verificationCode).catch(err => {
      console.error('BACKGROUND ERROR REGISTER EMAIL:', err);
    });

    res.status(201).json({
      message: 'Usuario registrado. Por favor verifica tu correo.',
      email: user.email
    });
  } catch (error) {
    console.error('ERROR REGISTER:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        message: 'Tu cuenta no ha sido verificada. Por favor revisa tu correo.',
        notVerified: true,
        email: user.email
      });
      return;
    }

    // --- Lógica de 2FA ---
    if (user.twoFactorEnabled) {
      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorCode = twoFactorCode;
      user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      await user.save();

      // Enviar código en segundo plano
      EmailService.send2FACode(user.email, twoFactorCode).catch(err => {
        console.error('BACKGROUND ERROR 2FA LOGIN EMAIL:', err);
      });

      res.status(200).json({ 
        message: 'Se requiere verificación adicional. Revisa tu correo.', 
        require2FA: true, 
        email: user.email 
      });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    await issueRefreshToken(res, user._id.toString());

    res.status(200).json({ message: 'Login exitoso', token: accessToken, user: formatUser(user) });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (!rawToken) {
      res.status(401).json({ message: 'No hay refresh token' });
      return;
    }

    // 1. Verify JWT signature first (cheap check)
    let decoded: { id: string };
    try {
      decoded = jwt.verify(rawToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    } catch {
      res.status(401).json({ message: 'Refresh token inválido o expirado' });
      return;
    }

    // 2. Look up hashed token in DB
    const tokenHash = hash(rawToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      // Token not in DB — possible reuse attack. Revoke ALL tokens for this user.
      console.warn(`⚠️  Possible refresh token reuse for userId: ${decoded.id}`);
      await RefreshToken.deleteMany({ userId: decoded.id });
      res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
      res.status(401).json({ message: 'Token inválido. Por seguridad, inicia sesión de nuevo.' });
      return;
    }

    // 3. Load user
    const user = await User.findById(decoded.id);
    if (!user) {
      await RefreshToken.deleteMany({ userId: decoded.id });
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    // 4. Rotate: delete old token, issue new pair
    await RefreshToken.deleteOne({ _id: storedToken._id });

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    await issueRefreshToken(res, user._id.toString());

    res.status(200).json({ token: newAccessToken, user: formatUser(user) });
  } catch (error) {
    console.error('ERROR REFRESH:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// ─── Logout (single device) ───────────────────────────────────────────────────

export const logoutServer = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      await RefreshToken.deleteOne({ tokenHash: hash(rawToken) });
    }
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ message: 'Sesión cerrada' });
  } catch (error) {
    console.error('ERROR LOGOUT:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ─── Logout all devices ───────────────────────────────────────────────────────

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    await RefreshToken.deleteMany({ userId });
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ message: 'Todas las sesiones cerradas' });
  } catch (error) {
    console.error('ERROR LOGOUT ALL:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ─── Verification & Recovery ──────────────────────────────────────────────────

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ message: 'Código inválido o expirado' });
      return;
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    await issueRefreshToken(res, user._id.toString());

    res.status(200).json({
      message: 'Cuenta verificada exitosamente',
      token: accessToken,
      user: formatUser(user)
    });
  } catch (error) {
    console.error('ERROR VERIFY:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const resendCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'La cuenta ya está verificada' });
      return;
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Enviar código en segundo plano
    EmailService.sendVerificationCode(email, verificationCode).catch(err => {
      console.error('BACKGROUND ERROR RESEND EMAIL:', err);
    });
    res.status(200).json({ message: 'Código reenviado' });
  } catch (error) {
    console.error('ERROR RESEND:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace pronto.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hash(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    // Enviar enlace de recuperación en segundo plano
    EmailService.sendResetPasswordLink(email, resetToken).catch(err => {
      console.error('BACKGROUND ERROR FORGOT PASSWORD EMAIL:', err);
    });
    res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace pronto.' });
  } catch (error) {
    console.error('ERROR FORGOT:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hash(token);

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ message: 'Token inválido o expirado' });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('ERROR RESET:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      twoFactorCode: code,
      twoFactorExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ message: 'Código de seguridad inválido o expirado' });
      return;
    }

    // Limpiar código usado
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    await issueRefreshToken(res, user._id.toString());

    res.status(200).json({
      message: 'Verificación exitosa',
      token: accessToken,
      user: formatUser(user)
    });
  } catch (error) {
    console.error('ERROR VERIFY 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const toggle2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { enabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    user.twoFactorEnabled = !!enabled;
    await user.save();

    res.status(200).json({ 
      message: enabled ? 'Autenticación de dos factores activada' : 'Autenticación de dos factores desactivada',
      twoFactorEnabled: user.twoFactorEnabled 
    });
  } catch (error) {
    console.error('ERROR TOGGLE 2FA:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ─── /me routes (unchanged) ───────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).userId).select('-password');
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, weeklyBudget, profile } = req.body;
    const updateData: Record<string, any> = {};
    if (name         !== undefined) updateData.name         = name;
    if (weeklyBudget !== undefined) updateData.weeklyBudget = weeklyBudget;
    if (profile) {
      ['age','weight','height','activityLevel','goal','dietType','allergies','dailyCalories','macros']
        .forEach(f => { if (profile[f] !== undefined) updateData[`profile.${f}`] = profile[f]; });
    }
    const user = await User.findByIdAndUpdate(
      (req as any).userId, { $set: updateData }, { returnDocument: 'after', runValidators: true }
    ).select('-password');
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }
    res.status(200).json({ message: 'Perfil actualizado', user });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

export const setupProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { age, weight, height, activityLevel, goal, dietType, allergies, weeklyBudget } = req.body;
    const user = await User.findById((req as any).userId);
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }

    let bmr = 0;
    if (weight && height && age) bmr = 10 * weight + 6.25 * height - 5 * age;

    const actMult: Record<string, number> = { low: 1.2, medium: 1.55, high: 1.9 };
    const goalAdj: Record<string, number> = { lose: -300, maintain: 0, gain: 300 };
    const dailyCalories = bmr > 0
      ? Math.round(bmr * (actMult[activityLevel ?? 'medium'] ?? 1.55) + (goalAdj[goal ?? 'maintain'] ?? 0))
      : 2000;
    const macros = {
      protein: Math.round((dailyCalories * 0.25) / 4),
      carbs:   Math.round((dailyCalories * 0.50) / 4),
      fat:     Math.round((dailyCalories * 0.25) / 9),
    };

    const updated = await User.findByIdAndUpdate(
      (req as any).userId,
      { $set: {
        weeklyBudget: weeklyBudget ?? user.weeklyBudget,
        'profile.age': age, 'profile.weight': weight, 'profile.height': height,
        'profile.activityLevel': activityLevel, 'profile.goal': goal,
        'profile.dietType': dietType, 'profile.allergies': allergies ?? [],
        'profile.dailyCalories': dailyCalories, 'profile.macros': macros,
      }},
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    res.status(200).json({ message: 'Perfil nutricional configurado', user: updated, calculated: { dailyCalories, macros } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};