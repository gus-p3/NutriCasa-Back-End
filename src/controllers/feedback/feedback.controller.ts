import { Request, Response } from 'express';
import { FeedbackService }   from '../../services/feedback/feedback.service';

export class FeedbackController {

  static async submitFeedback(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { recipeId, rating, ingredientsUsed, mealTime, nota } = req.body;

      // Validaciones básicas
      if (!recipeId || !rating || !ingredientsUsed || !mealTime) {
        return res.status(400).json({
          success: false,
          message: 'recipeId, rating, ingredientsUsed y mealTime son requeridos',
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'El rating debe ser entre 1 y 5',
        });
      }

      const result = await FeedbackService.submitFeedback(userId, {
        recipeId,
        rating,
        ingredientsUsed,
        mealTime,
        nota,
      });

      res.status(200).json({
        success: true,
        message: '¡Retroalimentación registrada exitosamente!',
        data: result,
      });
    } catch (error: any) {
      console.error('ERROR FEEDBACK:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al registrar retroalimentación',
      });
    }
  }
}