import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

// ─── protect ─────────────────────────────────────────────────────────────────
// Verifies the short-lived access token from the Authorization header.
// Attaches userId and role to the request for downstream middleware/controllers.

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No autorizado: token requerido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
    req.userId = decoded.id;
    req.role   = decoded.role;
    next();
  } catch (err) {
    // Distinguish between expired and invalid so the frontend can handle them differently
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ message: 'Token inválido' });
    }
  }
};

// ─── requireRole ──────────────────────────────────────────────────────────────
// Role-based access guard. Use AFTER protect middleware.
// Example usage:  router.delete('/admin/users/:id', protect, requireRole('admin'), handler)

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({
        message: `Acceso denegado. Se requiere uno de los roles: ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
