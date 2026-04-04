import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateMe,
  setupProfile,
  refreshToken,
  logoutServer,
  logoutAll,
  verifyEmail,
  resendCode,
  forgotPassword,
  resetPassword,
  verify2FA,
  toggle2FA,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres'),
  ],
  validate,
  register
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  login
);

// Refresh access token using the httpOnly refresh cookie
router.post('/refresh', refreshToken);

// Clear refresh cookie + delete token from DB (single device)
router.post('/logout', logoutServer);

// Revoke ALL refresh tokens for this user (all devices)
router.post('/logout-all', protect, logoutAll);

// ─── Verification & Recovery ──────────────────────────────────────────────────

router.post('/verify',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('El código debe ser de 6 dígitos'),
  ],
  validate,
  verifyEmail
);

router.post('/verify-2fa',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('El código debe ser de 6 dígitos'),
  ],
  validate,
  verify2FA
);

router.post('/resend-code',
  [body('email').isEmail().withMessage('Email inválido')],
  validate,
  resendCode
);

router.post('/forgot-password',
  [body('email').isEmail().withMessage('Email inválido')],
  validate,
  forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token requerido'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  ],
  validate,
  resetPassword
);

// ─── Protected routes ─────────────────────────────────────────────────────────

router.get('/me',         protect, getMe);
router.put('/me',         protect, updateMe);
router.put('/me/profile', protect, setupProfile);
router.put('/me/2fa',     protect, toggle2FA);

export default router;