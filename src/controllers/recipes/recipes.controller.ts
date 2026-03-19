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
            const userId = (req as any).userId;
            const filters = req.query;
            const pagina = Number(filters.pagina) || 1;
            const limite = Number(filters.limite) || 20;
            const ordenarPor = filters.ordenarPor as string;
            const orden = (filters.orden as 'asc' | 'desc') || 'asc';

            // Extraer parámetros de paginación para no mezclarlos con filtros
            const { pagina: _, limite: __, ordenarPor: ___, orden: ____, ...filtrosLimpios } = filters;

            const result = await RecipesService.searchRecipes(
                userId,
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

    // ==================== NUEVOS MÉTODOS ====================

    static async getRecipeById(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const userId = (req as any).userId;

            const recipe = await RecipesService.getRecipeById(id);

            if (!recipe) {
                return res.status(404).json({
                    success: false,
                    message: 'Receta no encontrada'
                });
            }

            res.json({
                success: true,
                data: recipe
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener la receta'
            });
        }
    }

    static async getRecipeWithInventory(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const userId = (req as any).userId;

            const recipe = await RecipesService.getRecipeWithInventory(id, userId);

            res.json({
                success: true,
                data: recipe
            });
        } catch (error: any) {
            console.error(error);
            if (error.message === 'Receta no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el detalle de la receta'
            });
        }
    }

    static async getRecipeForCooking(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const userId = (req as any).userId;

            const recipe = await RecipesService.getRecipeForCooking(id, userId);

            res.json({
                success: true,
                data: recipe
            });
        } catch (error: any) {
            console.error(error);
            if (error.message === 'Receta no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al preparar el modo cocina'
            });
        }
    }

    static async completeRecipe(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const userId = (req as any).userId;

            const result = await RecipesService.completeRecipe(id, userId);

            res.json({
                success: true,
                message: '¡Felicidades! Has completado la receta',
                data: result
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al completar la receta'
            });
        }
    }

    static async checkIngredientsAvailability(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const userId = (req as any).userId;

            const result = await RecipesService.checkIngredientsAvailability(id, userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al verificar disponibilidad'
            });
        }
    }

    static async getIngredientAlternatives(req: Request, res: Response) {
        try {
            const id             = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const userId         = (req as any).userId;
            const ingredientName = req.query.ingredientName as string;

            if (!ingredientName) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro ingredientName es requerido',
                });
            }

            const result = await RecipesService.getIngredientAlternatives(id, userId, ingredientName);

            res.json({
                success: true,
                data:    result,
            });
        } catch (error: any) {
            console.error(error);
            if (error.message === 'Receta no encontrada' || error.message?.includes('no encontrado')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener alternativas',
            });
        }
    }
}