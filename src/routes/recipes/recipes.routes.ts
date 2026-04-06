//recipes.routes.ts
import { Router } from 'express';
import { param, body, query } from 'express-validator';
import { protect } from '../../middlewares/authMiddleware';
import { validate } from '../../middlewares/validate';
import { RecipesController } from '../../controllers/recipes/recipes.controller';

class RecipesRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  config(): void {
    // GET /api/recipes/suggested
    this.router.get(
      '/suggested',
      protect,
      [query('limit').optional().isNumeric().withMessage('limit debe ser un número')],
      validate,
      RecipesController.getSuggestedRecipes
    );

    // GET /api/recipes/search
    this.router.get(
      '/search',
      protect,
      [
        query('q').optional().isString().trim().escape(),
        query('pagina').optional().isNumeric(),
        query('limite').optional().isNumeric(),
      ],
      validate,
      RecipesController.searchRecipes
    );

    // GET /api/recipes/user
    this.router.get(
      '/user',
      protect,
      RecipesController.getUserRecipes
    );

    // GET /api/recipes/:id/alternatives
    this.router.get(
      '/:id/alternatives',
      protect,
      [
        param('id').isMongoId().withMessage('id inválido'),
        query('ingredientName').notEmpty().withMessage('ingredientName es requerido').trim().escape()
      ],
      validate,
      RecipesController.getIngredientAlternatives
    );

    // GET /api/recipes/:id
    this.router.get(
      '/:id',
      protect,
      [param('id').isMongoId().withMessage('id inválido')],
      validate,
      RecipesController.getRecipeById
    );

    // GET /api/recipes/:id/with-inventory
    this.router.get(
      '/:id/with-inventory',
      protect,
      [param('id').isMongoId().withMessage('id inválido')],
      validate,
      RecipesController.getRecipeWithInventory
    );

    // GET /api/recipes/:id/cook
    this.router.get(
      '/:id/cook',
      protect,
      [param('id').isMongoId().withMessage('id inválido')],
      validate,
      RecipesController.getRecipeForCooking
    );

    // POST /api/recipes/:id/complete
    this.router.post(
      '/:id/complete',
      protect,
      [param('id').isMongoId().withMessage('id inválido')],
      validate,
      RecipesController.completeRecipe
    );

    // GET /api/recipes/:id/check-availability
    this.router.get(
      '/:id/check-availability',
      protect,
      [param('id').isMongoId().withMessage('id inválido')],
      validate,
      RecipesController.checkIngredientsAvailability
    );

    // POST /api/recipes
    this.router.post(
      '/',
      protect,
      [
        body('title').notEmpty().withMessage('Título es requerido').trim().escape(),
        body('ingredients').isArray().withMessage('Ingredientes debe ser un arreglo'),
        body('steps').isArray().withMessage('Pasos debe ser un arreglo')
      ],
      validate,
      RecipesController.createRecipe
    );

    // PUT /api/recipes/:id
    this.router.put(
      '/:id',
      protect,
      [
        param('id').isMongoId().withMessage('id inválido'),
        body('title').optional().isString().trim().escape(),
        body('ingredients').optional().isArray(),
        body('steps').optional().isArray()
      ],
      validate,
      RecipesController.updateRecipe
    );

    // DELETE /api/recipes/:id
    this.router.delete(
      '/:id',
      protect,
      [param('id').isMongoId().withMessage('id inválido')],
      validate,
      RecipesController.deleteRecipe
    );
  }
}

const recipesRoutes = new RecipesRoutes();
export default recipesRoutes.router;