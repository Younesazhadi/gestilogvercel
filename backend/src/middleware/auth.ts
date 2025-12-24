import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  magasinId?: number;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    req.magasinId = decoded.magasinId || undefined;

    next();
  } catch (error: any) {
    console.error('Erreur authentification:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole('super_admin');
export const requireAdmin = requireRole('super_admin', 'admin');
export const requireUser = requireRole('super_admin', 'admin', 'user');

