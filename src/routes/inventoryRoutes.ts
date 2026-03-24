import { Router } from 'express';
import { getInventory, addInventoryItem } from '../controllers/inventoryController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/',      protect, getInventory);
router.post('/items', protect, addInventoryItem);

export default router;