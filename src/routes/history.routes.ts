import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { HistoryController } from '../controllers/history/history.controller';

const router = Router();

router.get('/', protect, HistoryController.getUserHistory);

export default router;