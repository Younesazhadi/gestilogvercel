import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import pool from '../config/database';

// Middleware pour isoler les données par magasin
export const enforceTenantIsolation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Super admin peut voir tous les magasins
  if (req.user?.role === 'super_admin') {
    return next();
  }

  // Admin et user doivent avoir un magasin_id
  if (!req.user?.magasinId) {
    return res.status(403).json({ message: 'Magasin non associé' });
  }

  // Vérifier que le magasin existe et est actif
  try {
    const result = await pool.query(
      'SELECT statut FROM magasins WHERE id = $1',
      [req.user.magasinId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    const magasin = result.rows[0];
    if (magasin.statut !== 'actif') {
      return res.status(403).json({ 
        message: 'Votre abonnement a expiré ou votre compte est suspendu' 
      });
    }

    // Vérifier la date d'expiration
    const expirationResult = await pool.query(
      'SELECT date_expiration_abonnement FROM magasins WHERE id = $1',
      [req.user.magasinId]
    );

    if (expirationResult.rows[0]?.date_expiration_abonnement) {
      const expiration = new Date(expirationResult.rows[0].date_expiration_abonnement);
      if (expiration < new Date()) {
        return res.status(403).json({ 
          message: 'Votre abonnement a expiré. Veuillez renouveler.' 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Erreur vérification tenant:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Helper pour ajouter automatiquement magasin_id aux requêtes
export const addTenantFilter = (req: AuthRequest, query: string, params: any[] = []): { query: string; params: any[] } => {
  // Super admin peut voir tout
  if (req.user?.role === 'super_admin') {
    return { query, params };
  }

  // Pour les autres, ajouter le filtre magasin_id
  const hasWhere = query.toLowerCase().includes('where');
  const filter = hasWhere ? ' AND magasin_id = $' : ' WHERE magasin_id = $';
  const paramIndex = params.length + 1;

  return {
    query: query + filter + paramIndex,
    params: [...params, req.user?.magasinId],
  };
};

