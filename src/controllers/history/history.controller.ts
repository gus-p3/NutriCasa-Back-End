import { Request, Response } from 'express';
import { HistoryService }    from '../../services/history/history.service';

export class HistoryController {

    /**
     * GET /api/history
     * Devuelve todo el historial del usuario
     */
    static async getUserHistory(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const result = await HistoryService.getUserHistory(userId);

            res.json({
                success: true,
                data:    result,
            });
        } catch (error: any) {
            console.error('ERROR HISTORY:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el historial',
            });
        }
    }

    /**
     * GET /api/history/stats
     * Devuelve estadísticas del historial del usuario
     */
    static async getUserStats(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const result = await HistoryService.getUserStats(userId);

            res.json({
                success: true,
                data:    result,
            });
        } catch (error: any) {
            console.error('ERROR HISTORY STATS:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener estadísticas',
            });
        }
    }

    /**
     * GET /api/history/:id
     * Devuelve el detalle de una entrada específica
     */
    static async getHistoryById(req: Request, res: Response) {
        try {
            const userId    = (req as any).userId;

            const historyId = Array.isArray(req.params.id)
                ? req.params.id[0]
                : req.params.id;

            const result = await HistoryService.getHistoryById(historyId, userId);

            res.json({
                success: true,
                data:    result,
            });
        } catch (error: any) {
            console.error('ERROR HISTORY BY ID:', error);
            if (error.message === 'Entrada del historial no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el detalle',
            });
        }
    }
}