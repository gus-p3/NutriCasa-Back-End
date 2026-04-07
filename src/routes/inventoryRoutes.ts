import { Router } from 'express';
import { body } from 'express-validator';
import { getInventory, addInventoryItem, updateItem, deleteItem } from '../controllers/inventoryController';
import { protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/',      protect, getInventory);
router.post('/', 
  protect, 
  [
    body('name').notEmpty().withMessage('El nombre es requerido').trim().escape(),
    body('quantity').isNumeric().withMessage('La cantidad debe ser un número').isFloat({ min: 0 }).withMessage('La cantidad mínima es 0'),
    body('unit').optional().isString().trim().escape()
  ],
  validate,
  addInventoryItem
);

router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

export default router;