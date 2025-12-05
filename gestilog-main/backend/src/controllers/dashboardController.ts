import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const magasinId = req.user?.magasinId;

    // CA du jour
    const caJour = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total, COUNT(*) as nb_ventes
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE(date_vente) = CURRENT_DATE
       AND statut = 'valide'`,
      [magasinId]
    );

    // CA de la semaine
    const caSemaine = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'`,
      [magasinId]
    );

    // CA du mois
    const caMois = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND statut = 'valide'`,
      [magasinId]
    );

    // Produits en alerte
    const alertes = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE stock_actuel <= 0) as rupture,
        COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= stock_min) as seuil_minimum,
        COUNT(*) FILTER (WHERE date_peremption IS NOT NULL AND date_peremption BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as peremption
       FROM produits
       WHERE magasin_id = $1 AND actif = true`,
      [magasinId]
    );

    // Top produits du mois
    const topProduits = await pool.query(
      `SELECT 
        p.id, p.nom, SUM(lv.quantite) as quantite_vendue, SUM(lv.montant_total) as ca_produit
       FROM lignes_vente lv
       JOIN ventes v ON lv.vente_id = v.id
       JOIN produits p ON lv.produit_id = p.id
       WHERE v.magasin_id = $1
       AND DATE_TRUNC('month', v.date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND v.statut = 'valide'
       GROUP BY p.id, p.nom
       ORDER BY quantite_vendue DESC
       LIMIT 10`,
      [magasinId]
    );

    // Évolution des ventes (7 derniers jours)
    const evolution = await pool.query(
      `SELECT 
        DATE(date_vente) as date,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(montant_ttc), 0) as ca
       FROM ventes
       WHERE magasin_id = $1
       AND date_vente >= CURRENT_DATE - INTERVAL '7 days'
       AND statut = 'valide'
       GROUP BY DATE(date_vente)
       ORDER BY date ASC`,
      [magasinId]
    );

    res.json({
      ca: {
        jour: {
          total: parseFloat(caJour.rows[0].total),
          nb_ventes: parseInt(caJour.rows[0].nb_ventes),
        },
        semaine: parseFloat(caSemaine.rows[0].total),
        mois: parseFloat(caMois.rows[0].total),
      },
      alertes: alertes.rows[0],
      top_produits: topProduits.rows,
      evolution: evolution.rows,
    });
  } catch (error) {
    console.error('Erreur getAdminDashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

