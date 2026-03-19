import { Router }            from 'express';
import { protect }           from '../../middlewares/authMiddleware';
import { FeedbackController } from '../../controllers/feedback/feedback.controller';

class FeedbackRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  config(): void {
    // POST /api/feedback
    this.router.post('/', protect, FeedbackController.submitFeedback);
  }
}

const feedbackRoutes = new FeedbackRoutes();
export default feedbackRoutes.router;