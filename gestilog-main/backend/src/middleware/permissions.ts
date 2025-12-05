import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthRequest } from './auth';

interface Permission {
  module: string;
  action: string;
}

// Middleware pour charger les permissions de l'utilisateur
export const loadUserPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Super admin et admin ont tous les droits, pas besoin de charger les permissions
  if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
    return next();
  }

  // Pour les users, charger les permissions depuis la base de données
  if (req.user?.role === 'user' && req.user?.userId) {
    try {
      const result = await pool.query(
        'SELECT permissions FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (result.rows.length > 0) {
        let permissions = result.rows[0].permissions || {};
        // S'assurer que les permissions sont un objet (parser si c'est une chaîne)
        if (typeof permissions === 'string') {
          try {
            permissions = JSON.parse(permissions);
          } catch (e) {
            console.error('Erreur parsing permissions dans middleware:', e);
            permissions = {};
          }
        }
        (req as any).userPermissions = permissions;
      } else {
        (req as any).userPermissions = {};
      }
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
      (req as any).userPermissions = {};
    }
  }

  next();
};

export const checkPermission = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Super admin et admin ont tous les droits
    if (req.user?.role === 'super_admin' || req.user?.role === 'admin') {
      return next();
    }

    // Pour les users, vérifier les permissions
    if (req.user?.role === 'user') {
      const permissions = (req as any).userPermissions || {};

      const permissionKey = `${module}.${action}`;
      const hasPermission = permissions[permissionKey] === true;

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Permission requise: ${module}.${action}` 
        });
      }
    }

    next();
  };
};

// Helpers pour les permissions courantes
export const canViewVentes = checkPermission('ventes', 'consulter');
export const canCreateVentes = checkPermission('ventes', 'creer');
export const canModifyVentes = checkPermission('ventes', 'modifier');
export const canDeleteVentes = checkPermission('ventes', 'supprimer');
export const canApplyRemise = checkPermission('ventes', 'remises');

export const canViewProduits = checkPermission('produits', 'consulter');
export const canCreateProduits = checkPermission('produits', 'creer');
export const canModifyProduits = checkPermission('produits', 'modifier');
export const canDeleteProduits = checkPermission('produits', 'supprimer');
export const canModifyPrix = checkPermission('produits', 'modifier_prix');

export const canViewStock = checkPermission('stock', 'consulter');
export const canCreateEntrees = checkPermission('stock', 'entrees');
export const canCreateSorties = checkPermission('stock', 'sorties');
export const canCreateAjustements = checkPermission('stock', 'ajustements');
export const canCreateInventaire = checkPermission('stock', 'inventaire');

