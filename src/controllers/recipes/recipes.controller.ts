import { Request, Response } from 'express';
import Recipe from '../../models/Recipe.model';
import User from '../../models/User.model';
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
    static async getUserRecipes(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }
            const recipes = await Recipe.find({ 'createdBy.userId': userId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: recipes, count: recipes.length });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || 'Error al obtener recetas' });
        }
    }

    static async createRecipe(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }

            const userData = await User.findById(userId);
            const recipeData = req.body;

            // Asegurar que el creador sea el usuario actual
            recipeData.createdBy = {
                userId: userId,
                name: userData?.name || 'Usuario'
            };

            // Validaciones básicas manuales (Mongoose también validará)
            if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan campos requeridos (título, ingredientes, pasos)' 
                });
            }

            const newRecipe = new Recipe(recipeData);
            await newRecipe.save();

            res.status(201).json({
                success: true,
                message: 'Receta creada exitosamente',
                data: newRecipe
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear la receta'
            });
        }
    }

    static async updateRecipe(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).userId;
            
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }

            const recipe = await Recipe.findById(id);

            if (!recipe) {
                return res.status(404).json({ success: false, message: 'Receta no encontrada' });
            }

            // Verificar propiedad
            if (!recipe.createdBy?.userId || recipe.createdBy.userId.toString() !== userId.toString()) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes permiso para editar esta receta' 
                });
            }

            // Actualizar campos
            const updateData = req.body;
            // No permitir cambiar el creador por seguridad
            delete updateData.createdBy;

            const updatedRecipe = await Recipe.findByIdAndUpdate(
                id,
                { $set: updateData },
                { returnDocument: 'after', runValidators: true }
            );

            res.json({
                success: true,
                message: 'Receta actualizada exitosamente',
                data: updatedRecipe
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar la receta'
            });
        }
    }

    static async deleteRecipe(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }
            const recipe = await Recipe.findById(req.params.id);
            if (!recipe) {
                return res.status(404).json({ success: false, message: 'Receta no encontrada' });
            }
            if (!recipe.createdBy?.userId || recipe.createdBy.userId.toString() !== userId.toString()) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta receta' });
            }
            await recipe.deleteOne();
            res.status(200).json({ success: true, message: 'Receta eliminada', data: { id: recipe._id, title: recipe.title } });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || 'Error al eliminar' });
        }
    }
}