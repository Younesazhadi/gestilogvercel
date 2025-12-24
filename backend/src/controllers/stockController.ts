import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';

// Entrée de stock
export const createEntreeStock = async (req: AuthRequest, res: Response) => {
  try {
    const { produit_id, quantite, prix_unitaire, fournisseur_id, reference_doc, motif } = req.body;

    // Vérifier que le produit existe et appartient au magasin
    const produitCheck = await pool.query(
      'SELECT stock_actuel, prix_achat FROM produits WHERE id = $1 AND magasin_id = $2',
      [produit_id, req.user?.magasinId]
    );

    if (produitCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const produit = produitCheck.rows[0];
    const stockActuel = parseFloat(produit.stock_actuel) || 0;
    const prixAchatActuel = produit.prix_achat ? parseFloat(produit.prix_achat) : null;
    
    // Si le prix d'entrée n'est pas donné, utiliser le prix d'achat actuel
    const prixEntree = prix_unitaire || prixAchatActuel || 0;

    // Calculer le nouveau prix d'achat avec la formule du coût moyen pondéré
    // Nouveau prix = (Valeur totale actuelle + Valeur de l'entrée) / (Stock total après entrée)
    let nouveauPrixAchat = prixEntree; // Par défaut, utiliser le prix d'entrée
    
    if (stockActuel > 0 && prixAchatActuel !== null) {
      // Il y a déjà du stock avec un prix d'achat
      const valeurTotaleActuelle = stockActuel * prixAchatActuel;
      const valeurEntree = quantite * prixEntree;
      const nouveauStockTotal = stockActuel + quantite;
      nouveauPrixAchat = (valeurTotaleActuelle + valeurEntree) / nouveauStockTotal;
    } else if (stockActuel === 0 || prixAchatActuel === null) {
      // Pas de stock ou pas de prix d'achat actuel : utiliser directement le prix d'entrée
      nouveauPrixAchat = prixEntree;
    }

    // Créer le mouvement
    const mouvementResult = await pool.query(
      `INSERT INTO mouvements_stock 
       (magasin_id, produit_id, type, quantite, prix_unitaire, fournisseur_id, reference_doc, user_id, motif)
       VALUES ($1, $2, 'entree', $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user?.magasinId, produit_id, quantite, prixEntree, fournisseur_id, reference_doc, req.user?.userId, motif]
    );

    // Mettre à jour le stock et le prix d'achat
    await pool.query(
      'UPDATE produits SET stock_actuel = stock_actuel + $1, prix_achat = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [quantite, nouveauPrixAchat, produit_id]
    );

    await logActivity(req, 'entree_stock', 'mouvement_stock', mouvementResult.rows[0].id, {
      produit_id,
      quantite,
      prix_unitaire: prixEntree,
      nouveau_prix_achat: nouveauPrixAchat,
    });

    res.status(201).json({ mouvement: mouvementResult.rows[0] });
  } catch (error) {
    console.error('Erreur createEntreeStock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Sortie de stock
export const createSortieStock = async (req: AuthRequest, res: Response) => {
  try {
    const { produit_id, quantite, motif } = req.body;

    if (!motif) {
      return res.status(400).json({ message: 'Le motif est obligatoire pour une sortie' });
    }

    // Vérifier le stock disponible
    const produitCheck = await pool.query(
      'SELECT stock_actuel FROM produits WHERE id = $1 AND magasin_id = $2',
      [produit_id, req.user?.magasinId]
    );

    if (produitCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const stockActuel = parseFloat(produitCheck.rows[0].stock_actuel);
    if (stockActuel < quantite) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }

    // Créer le mouvement
    const mouvementResult = await pool.query(
      `INSERT INTO mouvements_stock 
       (magasin_id, produit_id, type, quantite, user_id, motif)
       VALUES ($1, $2, 'sortie', $3, $4, $5)
       RETURNING *`,
      [req.user?.magasinId, produit_id, quantite, req.user?.userId, motif]
    );

    // Mettre à jour le stock
    await pool.query(
      'UPDATE produits SET stock_actuel = stock_actuel - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantite, produit_id]
    );

    await logActivity(req, 'sortie_stock', 'mouvement_stock', mouvementResult.rows[0].id, {
      produit_id,
      quantite,
      motif,
    });

    res.status(201).json({ mouvement: mouvementResult.rows[0] });
  } catch (error) {
    console.error('Erreur createSortieStock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ajustement de stock
export const createAjustementStock = async (req: AuthRequest, res: Response) => {
  try {
    const { produit_id, nouveau_stock, motif } = req.body;

    if (!motif) {
      return res.status(400).json({ message: 'Le motif est obligatoire pour un ajustement' });
    }

    // Récupérer le stock actuel
    const produitCheck = await pool.query(
      'SELECT stock_actuel FROM produits WHERE id = $1 AND magasin_id = $2',
      [produit_id, req.user?.magasinId]
    );

    if (produitCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const stockActuel = parseFloat(produitCheck.rows[0].stock_actuel);
    const difference = nouveau_stock - stockActuel;

    // Créer le mouvement
    const mouvementResult = await pool.query(
      `INSERT INTO mouvements_stock 
       (magasin_id, produit_id, type, quantite, user_id, motif)
       VALUES ($1, $2, 'ajustement', $3, $4, $5)
       RETURNING *`,
      [req.user?.magasinId, produit_id, difference, req.user?.userId, motif]
    );

    // Mettre à jour le stock
    await pool.query(
      'UPDATE produits SET stock_actuel = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [nouveau_stock, produit_id]
    );

    await logActivity(req, 'ajustement_stock', 'mouvement_stock', mouvementResult.rows[0].id, {
      produit_id,
      ancien_stock: stockActuel,
      nouveau_stock,
      difference,
    });

    res.status(201).json({ mouvement: mouvementResult.rows[0] });
  } catch (error) {
    console.error('Erreur createAjustementStock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Historique des mouvements
export const getMouvements = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, produit_id, type, date_debut, date_fin } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT m.*, p.nom as produit_nom, u.nom as user_nom, u.prenom as user_prenom
      FROM mouvements_stock m
      LEFT JOIN produits p ON m.produit_id = p.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.magasin_id = $1
    `;
    const params: any[] = [req.user?.magasinId];
    let paramIndex = 2;

    if (produit_id) {
      query += ` AND m.produit_id = $${paramIndex}`;
      params.push(produit_id);
      paramIndex++;
    }

    if (type) {
      query += ` AND m.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (date_debut) {
      query += ` AND DATE(m.date_mouvement) >= $${paramIndex}::date`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND DATE(m.date_mouvement) < $${paramIndex}::date`;
      params.push(date_fin);
      paramIndex++;
    }

    // Compter le total avant pagination (même conditions WHERE mais sans JOINs)
    let countQuery = `SELECT COUNT(*) as total FROM mouvements_stock m WHERE m.magasin_id = $1`;
    const countParams: any[] = [req.user?.magasinId];
    let countParamIndex = 2;

    if (produit_id) {
      countQuery += ` AND m.produit_id = $${countParamIndex}`;
      countParams.push(produit_id);
      countParamIndex++;
    }

    if (type) {
      countQuery += ` AND m.type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (date_debut) {
      countQuery += ` AND DATE(m.date_mouvement) >= $${countParamIndex}::date`;
      countParams.push(date_debut);
      countParamIndex++;
    }

    if (date_fin) {
      countQuery += ` AND DATE(m.date_mouvement) < $${countParamIndex}::date`;
      countParams.push(date_fin);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY m.date_mouvement DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      mouvements: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur getMouvements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

