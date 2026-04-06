import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { strictAuthLimiter } from '../middlewares/rateLimitMiddleware';
import { UsersController } from '../controllers/users.controller';

const router = Router();

router.put(
  '/profile',
  protect,
  [
    body('name').optional().isString().trim().escape(),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('profile.age').optional().isNumeric().withMessage('Edad debe ser numérica'),
    body('profile.weight').optional().isNumeric(),
    body('profile.height').optional().isNumeric(),
    body('profile.activityLevel').optional().isIn(['low', 'medium', 'high']).withMessage('Nivel de actividad inválido'),
    body('profile.goal').optional().isIn(['lose', 'maintain', 'gain']).withMessage('Meta inválida'),
    body('profile.dietType').optional().isIn(['normal', 'vegetarian', 'vegan', 'custom']),
    body('profile.allergies').optional().isArray()
  ],
  validate,
  UsersController.updateProfile
);

router.put(
  '/change-password',
  protect,
  strictAuthLimiter,
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener mínimo 6 caracteres')
  ],
  validate,
  UsersController.changePassword
);

export default router;
