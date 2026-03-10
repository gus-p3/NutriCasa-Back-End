import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { RecipesController } from '../../controllers/recipes/recipes.controller';

class RecipesRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  config(): void {
    // ==================== RUTAS PÚBLICAS (requieren token) ====================
    
    // GET /api/recipes/suggested - Recomendaciones personalizadas
    this.router.get(
      '/suggested',
      protect,
      RecipesController.getSuggestedRecipes
    );

    // GET /api/recipes/search - Búsqueda de recetas
    this.router.get(
      '/search',
      protect,
      RecipesController.searchRecipes
    );

    // GET /api/recipes/:id - Obtener receta por ID (básico)
    this.router.get(
      '/:id',
      protect,
      RecipesController.getRecipeById
    );

    // GET /api/recipes/:id/with-inventory - Detalle con inventario
    this.router.get(
      '/:id/with-inventory',
      protect,
      RecipesController.getRecipeWithInventory
    );

    // GET /api/recipes/:id/cook - Modo cocina
    this.router.get(
      '/:id/cook',
      protect,
      RecipesController.getRecipeForCooking
    );

    // POST /api/recipes/:id/complete - Completar receta
    this.router.post(
      '/:id/complete',
      protect,
      RecipesController.completeRecipe
    );

    // GET /api/recipes/:id/check-availability - Verificar ingredientes
    this.router.get(
      '/:id/check-availability',
      protect,
      RecipesController.checkIngredientsAvailability
    );
  }
}

const recipesRoutes = new RecipesRoutes();
export default recipesRoutes.router;