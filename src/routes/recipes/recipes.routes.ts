//recipes.routes.ts
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

    // GET /api/recipes/user - Recetas del usuario autenticado
    this.router.get(
      '/user',
      protect,
      RecipesController.getUserRecipes
    );

    // GET /api/recipes/:id/alternatives?ingredientName=... - Sustitución de ingredientes
    this.router.get(
      '/:id/alternatives',
      protect,
      RecipesController.getIngredientAlternatives
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
    // POST /api/recipes - Crear receta propia
    this.router.post(
      '/',
      protect,
      RecipesController.createRecipe
    );

    // PUT /api/recipes/:id - Editar receta propia
    this.router.put(
      '/:id',
      protect,
      RecipesController.updateRecipe
    );

    // DELETE /api/recipes/:id - Eliminar receta propia
    this.router.delete(
      '/:id',
      protect,
      RecipesController.deleteRecipe
      
    );
  }
}

const recipesRoutes = new RecipesRoutes();
export default recipesRoutes.router;