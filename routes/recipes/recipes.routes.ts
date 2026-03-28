import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { RecipesController } from '../../controllers/recipes/recipes.controller';

const router = Router();

router.get('/user', protect, RecipesController.getUserRecipes);
router.get('/:id', protect, RecipesController.getRecipeById);
router.delete('/:id', protect, RecipesController.deleteRecipe);

export default router;