import { Router } from 'express';
import { protect } from '../../middlewares/authMiddleware';
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
            this.controller.generateRecipes
        );

        // Guardar receta generada (Requiere Auth)
        this.router.post(
            '/save-recipe',
            protect,
            this.controller.saveRecipe
        );

        // Chatbot Assistant (Requiere Auth)
        this.router.post(
            '/chat',
            protect,
            this.controller.chat
        );
    }
}

const recipeIaRoutes = new RecipeIaRoutes();
export default recipeIaRoutes.router;
