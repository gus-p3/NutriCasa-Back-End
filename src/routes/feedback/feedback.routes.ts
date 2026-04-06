import { Router }            from 'express';
import { body }              from 'express-validator';
import { protect }           from '../../middlewares/authMiddleware';
import { validate }          from '../../middlewares/validate';
import { FeedbackController } from '../../controllers/feedback/feedback.controller';

class FeedbackRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  config(): void {
    // POST /api/feedback
    this.router.post(
      '/', 
      protect,
      [
        body('recipeId').isMongoId().withMessage('recipeId inv\xe1lido'),
        body('rating').isFloat({ min: 1, max: 5 }).withMessage('El rating debe ser entre 1 y 5'),
        body('ingredientsUsed').isArray().withMessage('ingredientsUsed debe ser un arreglo'),
        body('mealTime').notEmpty().withMessage('mealTime es requerido').trim().escape(),
        body('nota').optional().isString().trim().escape()
      ],
      validate,
      FeedbackController.submitFeedback
    );
  }
}

const feedbackRoutes = new FeedbackRoutes();
export default feedbackRoutes.router;