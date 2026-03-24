import { Request, Response } from 'express';
import { HistoryService } from '../../services/history/history.service';

export class HistoryController {
  static async getUserHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado - Usuario no identificado'
        });
      }

      const history = await HistoryService.getUserHistory(userId);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el historial'
      });
    }
  }
}