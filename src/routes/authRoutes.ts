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
import { strictAuthLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────

router.post('/register',
  strictAuthLimiter,
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido').escape(),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres'),
  ],
  validate,
  register
);

router.post('/login',
  strictAuthLimiter,
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
  strictAuthLimiter,
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('El código debe ser de 6 dígitos').escape(),
  ],
  validate,
  verifyEmail
);

router.post('/verify-2fa',
  strictAuthLimiter,
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('El código debe ser de 6 dígitos').escape(),
  ],
  validate,
  verify2FA
);

router.post('/resend-code',
  strictAuthLimiter,
  [body('email').isEmail().withMessage('Email inválido').normalizeEmail()],
  validate,
  resendCode
);

router.post('/forgot-password',
  strictAuthLimiter,
  [body('email').isEmail().withMessage('Email inválido').normalizeEmail()],
  validate,
  forgotPassword
);

router.post('/reset-password',
  strictAuthLimiter,
  [
    body('token').notEmpty().withMessage('Token requerido').escape(),
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