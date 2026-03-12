import { Router } from 'express';
import {
  getRecipes,
  getSuggestedRecipes,
  getRecipeById,
  getIngredientAlternatives,
  createRecipe,
} from '../controllers/recipeController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// El orden importa: 
// rutas estáticas ANTES de las dinámicas (:id)
router.get('/suggested',        protect, getSuggestedRecipes);
router.get('/:id/alternatives', protect, getIngredientAlternatives);
router.get('/:id',              protect, getRecipeById);
router.get('/',                 protect, getRecipes);
router.post('/',                protect, createRecipe);

export default router;