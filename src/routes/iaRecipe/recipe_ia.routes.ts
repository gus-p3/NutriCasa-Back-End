import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../../middlewares/authMiddleware';
import { validate } from '../../middlewares/validate';
import { RecipeIaController } from '../../controllers/iaRecipe/recipe_ia.controller';

class RecipeIaRoutes {
    public router: Router = Router();
    private controller = new RecipeIaController();

    constructor() {
        this.config();
    }

    config(): void {
        // Generar recetas (Requiere Auth)
        this.router.post(
            '/generate-recipes',
            protect,
            [
                body('prompt').optional().isString().trim().escape(),
                body('count').optional().isNumeric()
            ],
            validate,
            this.controller.generateRecipes
        );

        // Guardar receta generada (Requiere Auth)
        this.router.post(
            '/save-recipe',
            protect,
            [
                body('recipe').isObject().withMessage('recipe debe ser un objeto'),
                body('recipe.title').notEmpty().withMessage('recipe.title es requerido').trim().escape()
            ],
            validate,
            this.controller.saveRecipe
        );

        // Chatbot Assistant (Requiere Auth)
        this.router.post(
            '/chat',
            protect,
            [
                body('message').notEmpty().withMessage('El mensaje es requerido').trim().escape(),
                body('history').optional().isArray()
            ],
            validate,
            this.controller.chat
        );
    }
}

const recipeIaRoutes = new RecipeIaRoutes();
export default recipeIaRoutes.router;
