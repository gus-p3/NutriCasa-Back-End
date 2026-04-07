import { Router } from 'express';
import { body }   from 'express-validator';
import {
  getInventory,
  addItem,
  updateItem,
  deleteItem,
} from '../controllers/inventoryController';
import { protect }  from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';

const router = Router();

const itemValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido').trim().escape(),
  body('quantity')
    .isNumeric().withMessage('La cantidad debe ser un número')
    .isFloat({ min: 0 }).withMessage('La cantidad mínima es 0'),
  body('unit').optional().isString().trim().escape(),
  body('category').optional().isString().trim(),
];

// GET  /api/inventory
router.get('/', protect, getInventory);

// POST /api/inventory  ← el frontend llama aquí
router.post('/', protect, itemValidation, validate, addItem);

// PUT  /api/inventory/:id
router.put('/:id', protect, itemValidation, validate, updateItem);

// DELETE /api/inventory/:id
router.delete('/:id', protect, deleteItem);

export default router;