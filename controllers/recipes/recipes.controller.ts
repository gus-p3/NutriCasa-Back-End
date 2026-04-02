import { Request, Response } from 'express';
import Recipe from '../../models/Recipe.model';

export class RecipesController {

  static async getUserRecipes(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      const userName = (req as any).user?.name;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      console.log(`Buscando recetas del usuario: ${userName || userId}`);

      const recipes = await Recipe.find({ 'createdBy.userId': userId }).sort({ createdAt: -1 });

      console.log(`Encontradas ${recipes.length} recetas`);

      res.status(200).json({ success: true, data: recipes, count: recipes.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener recetas' });
    }
  }

  static async getRecipeById(req: Request, res: Response) {
    try {
      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) {
        return res.status(404).json({ success: false, message: 'Receta no encontrada' });
      }

      res.status(200).json({ success: true, data: recipe });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener receta' });
    }
  }

  static async deleteRecipe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const recipe = await Recipe.findById(req.params.id);

      if (!recipe) {
        return res.status(404).json({ success: false, message: 'Receta no encontrada' });
      }

      if (!recipe.createdBy || recipe.createdBy.userId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta receta' });
      }

      await recipe.deleteOne();

      console.log(`Receta eliminada: ${recipe.title} por usuario ${userId}`);

      res.status(200).json({ success: true, message: 'Receta eliminada', data: { id: recipe._id, title: recipe.title } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al eliminar' });
    }
  }

}