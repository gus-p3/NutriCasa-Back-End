import { Router }              from 'express';
import { protect }             from '../middlewares/authMiddleware';
import { DashboardController } from '../controllers/dashboardController';

class DashboardRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  config(): void {
    // GET /api/dashboard
    this.router.get('/', protect, DashboardController.getDashboard);
  }
}

const dashboardRoutes = new DashboardRoutes();
export default dashboardRoutes.router;