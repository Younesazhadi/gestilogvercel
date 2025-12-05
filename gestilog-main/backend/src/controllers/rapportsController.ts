import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { addTenantFilter } from '../middleware/multiTenant';

// Rapports de ventes
export const getRapportVentes = async (req: AuthRequest, res: Response) => {
  try {
    const { date_debut, date_fin, group_by = 'jour' } = req.query;
    const magasinId = req.user?.magasinId;

    let dateFilter = '';
    const params: any[] = [magasinId];

    if (date_debut && date_fin) {
      dateFilter = `AND v.date_vente BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(date_debut, date_fin);
    } else if (date_debut) {
      dateFilter = `AND v.date_vente >= $${params.length + 1}`;
      params.push(date_debut);
    } else if (date_fin) {
      dateFilter = `AND v.date_vente <= $${params.length + 1}`;
      params.push(date_fin);
    }

    let groupByClause = '';
    if (group_by === 'jour') {
      groupByClause = 'DATE(v.date_vente)';
    } else if (group_by === 'semaine') {
      groupByClause = 'DATE_TRUNC(\'week\', v.date_vente)';
    } else if (group_by === 'mois') {
      groupByClause = 'DATE_TRUNC(\'month\', v.date_vente)';
    }

    const query = `
      SELECT 
        ${groupByClause} as periode,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(v.montant_ht), 0) as total_ht,
        COALESCE(SUM(v.montant_tva), 0) as total_tva,
        COALESCE(SUM(v.montant_ttc), 0) as total_ttc
      FROM ventes v
      WHERE v.magasin_id = $1
      AND v.statut = 'valide'
      ${dateFilter}
      GROUP BY ${groupByClause}
      ORDER BY periode ASC
    `;

    const result = await pool.query(query, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erreur getRapportVentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ventes par catégorie
export const getVentesParCategorie = async (req: AuthRequest, res: Response) => {
  try {
    const { date_debut, date_fin } = req.query;
    const magasinId = req.user?.magasinId;

    let dateFilter = '';
    const params: any[] = [magasinId];

    if (date_debut && date_fin) {
      dateFilter = `AND v.date_vente BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(date_debut, date_fin);
    }

    const query = `
      SELECT 
        c.nom as categorie,
        COALESCE(SUM(lv.quantite), 0) as quantite_vendue,
        COALESCE(SUM(lv.montant_total), 0) as ca_total
      FROM lignes_vente lv
      JOIN ventes v ON lv.vente_id = v.id
      LEFT JOIN produits p ON lv.produit_id = p.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE v.magasin_id = $1
      AND v.statut = 'valide'
      ${dateFilter}
      GROUP BY c.nom
      ORDER BY ca_total DESC
    `;

    const result = await pool.query(query, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erreur getVentesParCategorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ventes par utilisateur
export const getVentesParUtilisateur = async (req: AuthRequest, res: Response) => {
  try {
    const { date_debut, date_fin } = req.query;
    const magasinId = req.user?.magasinId;

    let dateFilter = '';
    const params: any[] = [magasinId];

    if (date_debut && date_fin) {
      dateFilter = `AND v.date_vente BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(date_debut, date_fin);
    }

    const query = `
      SELECT 
        u.nom || ' ' || COALESCE(u.prenom, '') as utilisateur,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(v.montant_ttc), 0) as ca_total
      FROM ventes v
      JOIN users u ON v.user_id = u.id
      WHERE v.magasin_id = $1
      AND v.statut = 'valide'
      ${dateFilter}
      GROUP BY u.id, u.nom, u.prenom
      ORDER BY ca_total DESC
    `;

    const result = await pool.query(query, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erreur getVentesParUtilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rapports financiers
export const getRapportFinancier = async (req: AuthRequest, res: Response) => {
  try {
    const { date_debut, date_fin } = req.query;
    const magasinId = req.user?.magasinId;

    let dateFilter = '';
    const params: any[] = [magasinId];

    if (date_debut && date_fin) {
      dateFilter = `AND v.date_vente BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(date_debut, date_fin);
    }

    // CA total
    const caQuery = `
      SELECT 
        COALESCE(SUM(v.montant_ttc), 0) as ca_total,
        COALESCE(SUM(v.montant_ht), 0) as ca_ht,
        COALESCE(SUM(v.montant_tva), 0) as tva_total
      FROM ventes v
      WHERE v.magasin_id = $1
      AND v.statut = 'valide'
      ${dateFilter}
    `;

    // Coût d'achat (basé sur les prix d'achat des produits vendus)
    const coutQuery = `
      SELECT 
        COALESCE(SUM(p.prix_achat * lv.quantite), 0) as cout_achat
      FROM lignes_vente lv
      JOIN ventes v ON lv.vente_id = v.id
      JOIN produits p ON lv.produit_id = p.id
      WHERE v.magasin_id = $1
      AND v.statut = 'valide'
      ${dateFilter}
    `;

    // Créances clients
    const creancesQuery = `
      SELECT 
        COALESCE(SUM(solde), 0) as creances_total
      FROM clients
      WHERE magasin_id = $1
      AND solde > 0
    `;

    const [caResult, coutResult, creancesResult] = await Promise.all([
      pool.query(caQuery, params),
      pool.query(coutQuery, params),
      pool.query(creancesQuery, [magasinId]),
    ]);

    const ca = parseFloat(caResult.rows[0].ca_total);
    const coutAchat = parseFloat(coutResult.rows[0].cout_achat);
    const margeBrute = ca - coutAchat;
    const tauxMarge = ca > 0 ? (margeBrute / ca) * 100 : 0;

    res.json({
      ca: {
        total_ttc: ca,
        total_ht: parseFloat(caResult.rows[0].ca_ht),
        tva: parseFloat(caResult.rows[0].tva_total),
      },
      cout_achat: coutAchat,
      marge_brute: margeBrute,
      taux_marge: tauxMarge,
      creances: parseFloat(creancesResult.rows[0].creances_total),
    });
  } catch (error) {
    console.error('Erreur getRapportFinancier:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rapports de stock
export const getRapportStock = async (req: AuthRequest, res: Response) => {
  try {
    const magasinId = req.user?.magasinId;

    // Valeur totale du stock
    const valeurQuery = `
      SELECT 
        COALESCE(SUM(p.stock_actuel * COALESCE(p.prix_achat, p.prix_vente * 0.7)), 0) as valeur_totale
      FROM produits p
      WHERE p.magasin_id = $1
      AND p.actif = true
    `;

    // Stock par catégorie
    const stockCategorieQuery = `
      SELECT 
        c.nom as categorie,
        COUNT(*) as nb_produits,
        COALESCE(SUM(p.stock_actuel), 0) as stock_total,
        COALESCE(SUM(p.stock_actuel * COALESCE(p.prix_achat, p.prix_vente * 0.7)), 0) as valeur
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE p.magasin_id = $1
      AND p.actif = true
      GROUP BY c.nom
      ORDER BY valeur DESC
    `;

    // Produits en rupture
    const ruptureQuery = `
      SELECT COUNT(*) as nb_produits
      FROM produits
      WHERE magasin_id = $1
      AND stock_actuel <= 0
      AND actif = true
    `;

    // Produits à rotation lente (stock > 0 mais pas de vente depuis 90 jours)
    const rotationLenteQuery = `
      SELECT COUNT(DISTINCT p.id) as nb_produits
      FROM produits p
      WHERE p.magasin_id = $1
      AND p.actif = true
      AND p.stock_actuel > 0
      AND NOT EXISTS (
        SELECT 1 FROM lignes_vente lv
        JOIN ventes v ON lv.vente_id = v.id
        WHERE lv.produit_id = p.id
        AND v.date_vente >= CURRENT_DATE - INTERVAL '90 days'
        AND v.statut = 'valide'
      )
    `;

    const [valeurResult, stockCategorieResult, ruptureResult, rotationLenteResult] = await Promise.all([
      pool.query(valeurQuery, [magasinId]),
      pool.query(stockCategorieQuery, [magasinId]),
      pool.query(ruptureQuery, [magasinId]),
      pool.query(rotationLenteQuery, [magasinId]),
    ]);

    res.json({
      valeur_totale: parseFloat(valeurResult.rows[0].valeur_totale),
      par_categorie: stockCategorieResult.rows,
      produits_rupture: parseInt(ruptureResult.rows[0].nb_produits),
      produits_rotation_lente: parseInt(rotationLenteResult.rows[0].nb_produits),
    });
  } catch (error) {
    console.error('Erreur getRapportStock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Top produits
export const getTopProduits = async (req: AuthRequest, res: Response) => {
  try {
    const { date_debut, date_fin, limit = 10 } = req.query;
    const magasinId = req.user?.magasinId;

    let dateFilter = '';
    const params: any[] = [magasinId];

    if (date_debut && date_fin) {
      dateFilter = `AND v.date_vente BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(date_debut, date_fin);
    }

    params.push(parseInt(limit as string));

    const query = `
      SELECT 
        p.id,
        p.nom,
        COALESCE(SUM(lv.quantite), 0) as quantite_vendue,
        COALESCE(SUM(lv.montant_total), 0) as ca_produit
      FROM lignes_vente lv
      JOIN ventes v ON lv.vente_id = v.id
      JOIN produits p ON lv.produit_id = p.id
      WHERE v.magasin_id = $1
      AND v.statut = 'valide'
      ${dateFilter}
      GROUP BY p.id, p.nom
      ORDER BY quantite_vendue DESC
      LIMIT $${params.length}
    `;

    const result = await pool.query(query, params);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Erreur getTopProduits:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

