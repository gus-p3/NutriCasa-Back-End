import { Router } from 'express';
import { createComment, getCommentsByRecipe } from '../../controllers/comments/comment.controller';
import { protect } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/', protect, createComment);      // esto requiere token
router.get('/:recipeId', getCommentsByRecipe); // esto es público

export default router;