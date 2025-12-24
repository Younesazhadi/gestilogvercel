import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthRequest } from './auth';

/**
 * Middleware pour vérifier si une fonctionnalité du plan est activée
 * @param featureKey - La clé de la fonctionnalité à vérifier (ex: 'ventes_consulter', 'rapports_avances')
 * @param alternativeKeys - Clés alternatives acceptées (ex: ['rapports_basiques', 'rapports_avances'])
 */
export const checkPlanFeature = (
  featureKey: string,
  alternativeKeys: string[] = []
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Super admin a accès à tout
    if (req.user?.role === 'super_admin') {
      return next();
    }

    // Si pas de magasin, refuser
    if (!req.user?.magasinId) {
      return res.status(403).json({ message: 'Magasin non associé' });
    }

    try {
      // Récupérer les fonctionnalités du plan du magasin
      const result = await pool.query(
        `SELECT p.fonctionnalites 
         FROM magasins m 
         JOIN plans p ON m.plan_id = p.id 
         WHERE m.id = $1`,
        [req.user.magasinId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Plan introuvable pour ce magasin' });
      }

      // S'assurer que les fonctionnalités sont un objet
      let planFeatures: any = result.rows[0].fonctionnalites || {};
      
      // Si c'est une chaîne JSON, la parser
      if (typeof planFeatures === 'string') {
        try {
          planFeatures = JSON.parse(planFeatures);
        } catch (e) {
          console.error('Erreur parsing fonctionnalités:', e);
          planFeatures = {};
        }
      }

      // Si les fonctionnalités sont null ou undefined, utiliser un objet vide
      if (!planFeatures || typeof planFeatures !== 'object') {
        planFeatures = {};
      }

      // Si "tout_inclus" est activé, autoriser
      if (planFeatures.tout_inclus === true) {
        return next();
      }

      // Vérifier la fonctionnalité principale
      if (planFeatures[featureKey] === true) {
        return next();
      }

      // Vérifier les alternatives
      for (const altKey of alternativeKeys) {
        if (planFeatures[altKey] === true) {
          return next();
        }
      }

      // Fonctionnalité non disponible dans le plan
      return res.status(403).json({ 
        message: `Cette fonctionnalité n'est pas disponible dans votre plan d'abonnement. Veuillez passer à un plan supérieur.` 
      });
    } catch (error) {
      console.error('Erreur vérification fonctionnalité plan:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };
};

// Helpers pour les fonctionnalités courantes
export const requireVentesFeature = checkPlanFeature('ventes_consulter');
export const requirePOSFeature = checkPlanFeature('ventes_pos');
export const requireProduitsFeature = checkPlanFeature('produits_consulter');
export const requireStockFeature = checkPlanFeature('stock_consulter');
export const requireClientsFeature = checkPlanFeature('clients_consulter');
export const requireFournisseursFeature = checkPlanFeature('fournisseurs_consulter');
export const requireRapportsFeature = checkPlanFeature('rapports_basiques', ['rapports_avances']);
export const requireDocumentsFeature = checkPlanFeature('documents_factures', ['documents_devis', 'documents_bons_livraison']);


