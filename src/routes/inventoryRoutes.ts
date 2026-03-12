import { Router } from 'express';
import {
  getInventory,
  addItem,
  updateItem,
  deleteItem,
} from '../controllers/inventoryController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// JWT protect en todas las rutas
router.get('/',    protect, getInventory);
router.post('/',   protect, addItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

export default router;