import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateMe, setupProfile } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';

const router = Router();

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

router.get('/me',         protect, getMe);
router.put('/me',         protect, updateMe);
router.put('/me/profile', protect, setupProfile);

export default router;