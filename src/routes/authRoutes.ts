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

// ─── Protected routes ─────────────────────────────────────────────────────────

router.get('/me',         protect, getMe);
router.put('/me',         protect, updateMe);
router.put('/me/profile', protect, setupProfile);

export default router;