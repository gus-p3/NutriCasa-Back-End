import { Response } from 'express';
import Comment from '../../models/Comment.model';
import { AuthRequest } from '../../middlewares/authMiddleware';

// POST /api/comments
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipeId, rating, comment } = req.body;
    const userId = req.userId; // inyectado por `protect`

    if (!recipeId || rating === undefined || !comment) {
      res.status(400).json({ message: 'recipeId, rating y comment son obligatorios.' });
      return;
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'El rating debe ser un número entre 1 y 5.' });
      return;
    }
    if (comment.trim().length === 0) {
      res.status(400).json({ message: 'El comentario no puede estar vacío.' });
      return;
    }

    const newComment = await Comment.create({
      recipeId,
      userId,
      rating,
      comment: comment.trim(),
    });

    res.status(201).json({ message: 'Comentario creado.', data: newComment });
  } catch (error) {
    console.error('Error en createComment:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// GET /api/comments/:recipeId
export const getCommentsByRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;

    const comments = await Comment.find({ recipeId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: comments });
  } catch (error) {
    console.error('Error en getCommentsByRecipe:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};