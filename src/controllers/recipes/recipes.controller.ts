import { Request, Response } from 'express';
import { RecipesService } from '../../services/recipes/recipes.service';


export class RecipesController {
  static async getSuggestedRecipes(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const limit = Number(req.query.limit) || 20;

      const result = await RecipesService.getSuggestedRecipes(userId, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener recetas sugeridas'
      });
    }
  }

  static async searchRecipes(req: Request, res: Response) {
    try {
      const filters = req.query;
      const pagina = Number(filters.pagina) || 1;
      const limite = Number(filters.limite) || 20;
      const ordenarPor = filters.ordenarPor as string;
      const orden = (filters.orden as 'asc' | 'desc') || 'asc';

      // Extraer parámetros de paginación para no mezclarlos con filtros
      const { pagina: _, limite: __, ordenarPor: ___, orden: ____, ...filtrosLimpios } = filters;

      const result = await RecipesService.searchRecipes(
        filtrosLimpios as any,
        { pagina, limite, ordenarPor, orden }
      );

      res.json({
        success: true,
        data: result.data,
        paginacion: result.paginacion
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar recetas'
      });
    }
  }
}