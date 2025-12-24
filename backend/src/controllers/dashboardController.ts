import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const magasinId = req.user?.magasinId;

    // CA du jour (exclure les ventes à crédit et les chèques non payés)
    // Inclure les paiements de crédit (sauf par chèque), les paiements de chèques
    // Les chèques (mode_paiement='cheque') ont toujours montant_ht=0, donc on les exclut
    // Les paiements de crédit par chèque (type_document='paiement_credit' ET mode_paiement='cheque') sont aussi exclus
    // Quand un chèque est payé, on crée une nouvelle vente type_document='paiement_cheque' qui est incluse
    const caJour = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total, COUNT(*) as nb_ventes
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE(date_vente) = CURRENT_DATE
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // CA de la semaine (exclure les ventes à crédit et les chèques non payés)
    const caSemaine = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // CA du mois (exclure les ventes à crédit et les chèques non payés)
    const caMois = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // Produits en alerte (avec détails)
    const produitsRupture = await pool.query(
      `SELECT id, nom, stock_actuel
       FROM produits
       WHERE magasin_id = $1 AND stock_actuel <= 0 AND actif = true
       ORDER BY nom ASC
       LIMIT 10`,
      [magasinId]
    );

    const produitsSeuilMinimum = await pool.query(
      `SELECT id, nom, stock_actuel, stock_min
       FROM produits
       WHERE magasin_id = $1 AND stock_actuel > 0 AND stock_actuel <= stock_min AND actif = true
       ORDER BY stock_actuel ASC
       LIMIT 10`,
      [magasinId]
    );

    const produitsPeremption = await pool.query(
      `SELECT id, nom, date_peremption
       FROM produits
       WHERE magasin_id = $1 
       AND date_peremption IS NOT NULL 
       AND date_peremption BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       AND actif = true
       ORDER BY date_peremption ASC
       LIMIT 10`,
      [magasinId]
    );

    const alertes = {
      rupture: produitsRupture.rows.length,
      seuil_minimum: produitsSeuilMinimum.rows.length,
      peremption: produitsPeremption.rows.length,
      details: {
        rupture: produitsRupture.rows,
        seuil_minimum: produitsSeuilMinimum.rows,
        peremption: produitsPeremption.rows,
      }
    };

    // Top produits du mois (exclure uniquement les ventes à crédit, les paiements de crédit n'ont pas de produits)
    const topProduits = await pool.query(
      `SELECT 
        p.id, p.nom, SUM(lv.quantite) as quantite_vendue, SUM(lv.montant_total) as ca_produit
       FROM lignes_vente lv
       JOIN ventes v ON lv.vente_id = v.id
       JOIN produits p ON lv.produit_id = p.id
       WHERE v.magasin_id = $1
       AND DATE_TRUNC('month', v.date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND v.statut = 'valide'
       AND v.type_document != 'paiement_credit'
       AND (v.mode_paiement IS NULL OR v.mode_paiement != 'credit')
       GROUP BY p.id, p.nom
       ORDER BY quantite_vendue DESC
       LIMIT 10`,
      [magasinId]
    );

    // Évolution des ventes (7 derniers jours) - exclure les ventes à crédit et les chèques non payés
    const evolution = await pool.query(
      `SELECT 
        DATE(date_vente) as date,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(montant_ttc), 0) as ca
       FROM ventes
       WHERE magasin_id = $1
       AND date_vente >= CURRENT_DATE - INTERVAL '7 days'
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))
       GROUP BY DATE(date_vente)
       ORDER BY date ASC`,
      [magasinId]
    );

    // CA d'hier pour comparaison
    const caHier = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE(date_vente) = CURRENT_DATE - INTERVAL '1 day'
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // CA de la semaine dernière pour comparaison
    const caSemaineDerniere = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
       AND date_vente < DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // Crédits clients en attente (avec détails)
    const creditsEnAttenteDetails = await pool.query(
      `SELECT id, nom, solde, credit_autorise
       FROM clients
       WHERE magasin_id = $1 
       AND solde > 0
       ORDER BY solde DESC
       LIMIT 20`,
      [magasinId]
    );

    const creditsEnAttente = {
      nb_clients: creditsEnAttenteDetails.rows.length,
      total_credits: creditsEnAttenteDetails.rows.reduce((sum, c) => sum + parseFloat(c.solde || 0), 0),
      details: creditsEnAttenteDetails.rows
    };

    // Chèques en attente de dépôt (avec détails)
    const chequesEnAttenteDetails = await pool.query(
      `SELECT 
        v.id, v.numero_vente, v.reference_paiement, v.date_cheque, v.montant_ttc,
        c.nom as client_nom, c.telephone as client_telephone
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.magasin_id = $1
       AND v.mode_paiement = 'cheque'
       AND v.statut_cheque = 'en_attente'
       AND v.statut = 'valide'
       ORDER BY v.date_cheque ASC
       LIMIT 20`,
      [magasinId]
    );

    const chequesEnAttente = {
      nb_cheques: chequesEnAttenteDetails.rows.length,
      total_montant: chequesEnAttenteDetails.rows.reduce((sum, c) => sum + parseFloat(c.montant_ttc || 0), 0),
      details: chequesEnAttenteDetails.rows
    };

    // Chèques prêts pour dépôt (date_cheque <= aujourd'hui) (avec détails)
    const chequesPretDepotDetails = await pool.query(
      `SELECT 
        v.id, v.numero_vente, v.reference_paiement, v.date_cheque, v.montant_ttc,
        c.nom as client_nom, c.telephone as client_telephone
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.magasin_id = $1
       AND v.mode_paiement = 'cheque'
       AND v.statut_cheque = 'en_attente'
       AND v.date_cheque <= CURRENT_DATE
       AND v.statut = 'valide'
       ORDER BY v.date_cheque ASC
       LIMIT 20`,
      [magasinId]
    );

    const chequesPretDepot = {
      nb_cheques: chequesPretDepotDetails.rows.length,
      total_montant: chequesPretDepotDetails.rows.reduce((sum, c) => sum + parseFloat(c.montant_ttc || 0), 0),
      details: chequesPretDepotDetails.rows
    };

    // Statistiques par mode de paiement (aujourd'hui)
    const modesPaiement = await pool.query(
      `SELECT 
        COALESCE(mode_paiement, 'non_specifie') as mode,
        COUNT(*) as nb_operations,
        COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1
       AND DATE(date_vente) = CURRENT_DATE
       AND statut = 'valide'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))
       GROUP BY mode_paiement
       ORDER BY total DESC`,
      [magasinId]
    );

    // Top produits du jour
    const topProduitsJour = await pool.query(
      `SELECT 
        p.id, p.nom, SUM(lv.quantite) as quantite_vendue, SUM(lv.montant_total) as ca_produit
       FROM lignes_vente lv
       JOIN ventes v ON lv.vente_id = v.id
       JOIN produits p ON lv.produit_id = p.id
       WHERE v.magasin_id = $1
       AND DATE(v.date_vente) = CURRENT_DATE
       AND v.statut = 'valide'
       AND v.type_document != 'paiement_credit'
       AND (v.mode_paiement IS NULL OR v.mode_paiement != 'credit')
       GROUP BY p.id, p.nom
       ORDER BY quantite_vendue DESC
       LIMIT 5`,
      [magasinId]
    );

    // Clients avec crédit élevé (> 80% du crédit autorisé) (avec détails)
    const clientsCreditEleveDetails = await pool.query(
      `SELECT 
        id, nom, solde, credit_autorise,
        ROUND((solde / credit_autorise * 100)::numeric, 2) as pourcentage_utilise
       FROM clients
       WHERE magasin_id = $1
       AND solde > 0
       AND credit_autorise > 0
       AND (solde / credit_autorise) >= 0.8
       ORDER BY (solde / credit_autorise) DESC
       LIMIT 20`,
      [magasinId]
    );

    const clientsCreditEleve = {
      nb_clients: clientsCreditEleveDetails.rows.length,
      details: clientsCreditEleveDetails.rows
    };

    res.json({
      ca: {
        jour: {
          total: parseFloat(caJour.rows[0].total),
          nb_ventes: parseInt(caJour.rows[0].nb_ventes),
        },
        hier: parseFloat(caHier.rows[0].total),
        semaine: parseFloat(caSemaine.rows[0].total),
        semaine_derniere: parseFloat(caSemaineDerniere.rows[0].total),
        mois: parseFloat(caMois.rows[0].total),
      },
      alertes: {
        rupture: alertes.rupture,
        seuil_minimum: alertes.seuil_minimum,
        peremption: alertes.peremption,
        details: alertes.details,
      },
      top_produits: topProduits.rows,
      top_produits_jour: topProduitsJour.rows,
      evolution: evolution.rows,
      credits: {
        nb_clients: creditsEnAttente.nb_clients,
        total: creditsEnAttente.total_credits,
        clients_credit_eleve: clientsCreditEleve.nb_clients,
        details: creditsEnAttente.details,
        clients_credit_eleve_details: clientsCreditEleve.details,
      },
      cheques: {
        en_attente: {
          nb: chequesEnAttente.nb_cheques,
          montant: chequesEnAttente.total_montant,
          details: chequesEnAttente.details,
        },
        pret_depot: {
          nb: chequesPretDepot.nb_cheques,
          montant: chequesPretDepot.total_montant,
          details: chequesPretDepot.details,
        },
      },
      modes_paiement: modesPaiement.rows,
    });
  } catch (error) {
    console.error('Erreur getAdminDashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

