import { Router }            from 'express';
import { param }             from 'express-validator';
import { protect }           from '../../middlewares/authMiddleware';
import { validate }          from '../../middlewares/validate';
import { HistoryController } from '../../controllers/history/history.controller';

class HistoryRoutes {
    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        // GET /api/history/stats  ← antes de /:id para que no lo confunda
        this.router.get('/stats', protect, HistoryController.getUserStats);

        // GET /api/history
        this.router.get('/', protect, HistoryController.getUserHistory);

        // GET /api/history/:id
        this.router.get(
            '/:id', 
            protect, 
            [
                param('id').isMongoId().withMessage('id inválido')
            ],
            validate,
            HistoryController.getHistoryById
        );
    }
}

const historyRoutes = new HistoryRoutes();
export default historyRoutes.router;