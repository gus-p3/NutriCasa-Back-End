import { Request, Response } from 'express';
import { RecipeIaServices } from '../../services/iaRecipe/recipe_ia.services';

export class RecipeIaController {
    
    // Instanciar el servicio
    private aiService = new RecipeIaServices();

    public generateRecipes = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).userId;
            const { prompt: userPrompt, count = 1 } = req.body;
            
            if (!userId) {
                res.status(401).json({ message: 'Usuario no autenticado.' });
                return;
            }

            const recipes = await this.aiService.generateRecipes(userId, userPrompt, count);

            res.status(200).json({
                message: 'Recetas generadas exitosamente.',
                recipes
            });

        } catch (error: any) {
            console.error('Error en generateRecipes:', error);
            res.status(500).json({ 
                message: error.message || 'Error interno del servidor al interactuar con IA.', 
                error: String(error) 
            });
        }
    };

    public saveRecipe = async (req: Request, res: Response): Promise<void> => {
        try {
            const { recipe } = req.body;
            
            if (!recipe || !recipe.title) {
                res.status(400).json({ message: 'Receta inválida.' });
                return;
            }

            const result = await this.aiService.saveRecipe(recipe);

            if (!result.isNew) {
                res.status(200).json({
                    message: 'La receta ya existe en la base de datos.',
                    recipe: result.recipe
                });
                return;
            }

            res.status(201).json({
                message: 'Receta guardada exitosamente.',
                recipe: result.recipe
            });

        } catch (error: any) {
            console.error('Error en saveRecipe:', error);
            res.status(500).json({ 
                message: error.message || 'Error al guardar la receta.', 
                error: String(error) 
            });
        }
    };
}
