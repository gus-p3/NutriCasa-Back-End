import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { RecipesController } from '../../controllers/recipes/recipes.controller';

class RecipesRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  config(): void {
    // GET /api/recipes/suggested - Recomendaciones personalizadas (requiere token)
    this.router.get(
      '/suggested',
      protect,
      RecipesController.getSuggestedRecipes
    );

    // GET /api/recipes/search - Búsqueda de recetas (requiere token)
    this.router.get(
      '/search',
      protect,
      RecipesController.searchRecipes
    );
  }
}

const recipesRoutes = new RecipesRoutes();
export default recipesRoutes.router;