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
      'SELECT * FROM produits WHERE id = $1 AND magasin_id = $2',
      [produit_id, req.user?.magasinId]
    );

    if (produitCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Créer le mouvement
    const mouvementResult = await pool.query(
      `INSERT INTO mouvements_stock 
       (magasin_id, produit_id, type, quantite, prix_unitaire, fournisseur_id, reference_doc, user_id, motif)
       VALUES ($1, $2, 'entree', $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user?.magasinId, produit_id, quantite, prix_unitaire, fournisseur_id, reference_doc, req.user?.userId, motif]
    );

    // Mettre à jour le stock
    await pool.query(
      'UPDATE produits SET stock_actuel = stock_actuel + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantite, produit_id]
    );

    await logActivity(req, 'entree_stock', 'mouvement_stock', mouvementResult.rows[0].id, {
      produit_id,
      quantite,
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
      query += ` AND m.date_mouvement >= $${paramIndex}`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND m.date_mouvement <= $${paramIndex}`;
      params.push(date_fin);
      paramIndex++;
    }

    query += ` ORDER BY m.date_mouvement DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      mouvements: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Erreur getMouvements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

