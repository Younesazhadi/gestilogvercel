import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const magasinId = req.user?.magasinId;

    // CA BRUT du jour (revenus uniquement, exclure les ventes à crédit et les chèques non payés)
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
       AND type_document != 'depense'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // DÉPENSES du jour
    const depensesJour = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total, COUNT(*) as nb_depenses
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE(date_vente) = CURRENT_DATE
       AND statut = 'valide'
       AND type_document = 'depense'`,
      [magasinId]
    );

    // CA NET du jour = CA brut - Dépenses
    const caNetJour = parseFloat(caJour.rows[0].total) - parseFloat(depensesJour.rows[0].total);

    // CA BRUT de la semaine (revenus uniquement)
    const caSemaine = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document != 'depense'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // DÉPENSES de la semaine
    const depensesSemaine = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document = 'depense'`,
      [magasinId]
    );

    // CA NET de la semaine = CA brut - Dépenses
    const caNetSemaine = parseFloat(caSemaine.rows[0].total) - parseFloat(depensesSemaine.rows[0].total);

    // CA BRUT du mois (revenus uniquement)
    const caMois = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document != 'depense'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // DÉPENSES du mois
    const depensesMois = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document = 'depense'`,
      [magasinId]
    );

    // CA NET du mois = CA brut - Dépenses
    const caNetMois = parseFloat(caMois.rows[0].total) - parseFloat(depensesMois.rows[0].total);

    // Panier moyen du jour
    const panierMoyenJour = parseInt(caJour.rows[0].nb_ventes) > 0 
      ? parseFloat(caJour.rows[0].total) / parseInt(caJour.rows[0].nb_ventes) 
      : 0;

    // Panier moyen du mois
    const caMoisAvecNb = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total, COUNT(*) as nb_ventes
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document != 'depense'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );
    const panierMoyenMois = parseInt(caMoisAvecNb.rows[0].nb_ventes) > 0
      ? parseFloat(caMoisAvecNb.rows[0].total) / parseInt(caMoisAvecNb.rows[0].nb_ventes)
      : 0;

    // Nombre total de clients
    const totalClients = await pool.query(
      `SELECT COUNT(*) as total FROM clients WHERE magasin_id = $1`,
      [magasinId]
    );

    // Nombre total de produits actifs
    const totalProduits = await pool.query(
      `SELECT COUNT(*) as total FROM produits WHERE magasin_id = $1 AND actif = true`,
      [magasinId]
    );

    // Valeur totale du stock
    const valeurStock = await pool.query(
      `SELECT COALESCE(SUM(stock_actuel * COALESCE(prix_achat, prix_vente * 0.7)), 0) as valeur_totale
       FROM produits
       WHERE magasin_id = $1 AND actif = true`,
      [magasinId]
    );

    // Nombre de ventes annulées du mois
    const ventesAnnulees = await pool.query(
      `SELECT COUNT(*) as total
       FROM ventes
       WHERE magasin_id = $1
       AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND statut = 'annule'`,
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

    const alertes = {
      rupture: produitsRupture.rows.length,
      seuil_minimum: produitsSeuilMinimum.rows.length,
      details: {
        rupture: produitsRupture.rows,
        seuil_minimum: produitsSeuilMinimum.rows,
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

    // Évolution des ventes (7 derniers jours) - CA brut et dépenses séparés pour calculer CA net
    const evolutionBrut = await pool.query(
      `SELECT 
        DATE(date_vente) as date,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(montant_ttc), 0) as ca_brut
       FROM ventes
       WHERE magasin_id = $1
      AND date_vente >= CURRENT_DATE - INTERVAL '7 days'
      AND statut = 'valide'
      AND type_document != 'depense'
      AND (type_document = 'paiement_cheque'
           OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
           OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))
       GROUP BY DATE(date_vente)
       ORDER BY date ASC`,
      [magasinId]
    );

    const evolutionDepenses = await pool.query(
      `SELECT 
        DATE(date_vente) as date,
        COALESCE(SUM(montant_ttc), 0) as depenses
       FROM ventes
       WHERE magasin_id = $1
      AND date_vente >= CURRENT_DATE - INTERVAL '7 days'
      AND statut = 'valide'
      AND type_document = 'depense'
       GROUP BY DATE(date_vente)
       ORDER BY date ASC`,
      [magasinId]
    );

    // Combiner les données pour calculer le CA net par jour
    const evolutionMap = new Map<string, any>();
    evolutionBrut.rows.forEach((row: any) => {
      // Convertir la date en string pour la clé de la Map
      const dateKey = row.date instanceof Date 
        ? row.date.toISOString().split('T')[0] 
        : String(row.date);
      evolutionMap.set(dateKey, {
        date: dateKey,
        nb_ventes: parseInt(row.nb_ventes || 0),
        ca_brut: parseFloat(row.ca_brut || 0),
        depenses: 0,
        ca: parseFloat(row.ca_brut || 0), // CA net = CA brut pour l'instant
      });
    });
    evolutionDepenses.rows.forEach((row: any) => {
      // Convertir la date en string pour la clé de la Map
      const dateKey = row.date instanceof Date 
        ? row.date.toISOString().split('T')[0] 
        : String(row.date);
      const existing = evolutionMap.get(dateKey);
      const depensesValue = parseFloat(row.depenses || 0);
      if (existing) {
        existing.depenses = depensesValue;
        existing.ca = existing.ca_brut - depensesValue; // CA net
      } else {
        evolutionMap.set(dateKey, {
          date: dateKey,
          nb_ventes: 0,
          ca_brut: 0,
          depenses: depensesValue,
          ca: -depensesValue, // CA net négatif si seulement dépenses
        });
      }
    });

    const evolution = Array.from(evolutionMap.values()).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // CA BRUT d'hier pour comparaison
    const caHier = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE(date_vente) = CURRENT_DATE - INTERVAL '1 day'
       AND statut = 'valide'
       AND type_document != 'depense'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // DÉPENSES d'hier
    const depensesHier = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND DATE(date_vente) = CURRENT_DATE - INTERVAL '1 day'
       AND statut = 'valide'
       AND type_document = 'depense'`,
      [magasinId]
    );

    // CA NET d'hier = CA brut - Dépenses
    const caNetHier = parseFloat(caHier.rows[0].total) - parseFloat(depensesHier.rows[0].total);

    // CA BRUT de la semaine dernière pour comparaison
    const caSemaineDerniere = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
       AND date_vente < DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document != 'depense'
       AND (type_document = 'paiement_cheque'
            OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
            OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque')))`,
      [magasinId]
    );

    // DÉPENSES de la semaine dernière
    const depensesSemaineDerniere = await pool.query(
      `SELECT COALESCE(SUM(montant_ttc), 0) as total
       FROM ventes
       WHERE magasin_id = $1 
       AND date_vente >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
       AND date_vente < DATE_TRUNC('week', CURRENT_DATE)
       AND statut = 'valide'
       AND type_document = 'depense'`,
      [magasinId]
    );

    // CA NET de la semaine dernière = CA brut - Dépenses
    const caNetSemaineDerniere = parseFloat(caSemaineDerniere.rows[0].total) - parseFloat(depensesSemaineDerniere.rows[0].total);

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

    // Top 5 clients par montant d'achats (du mois)
    const topClients = await pool.query(
      `SELECT 
        c.id,
        c.nom,
        COUNT(v.id) as nb_achats,
        COALESCE(SUM(v.montant_ttc), 0) as montant_total
       FROM ventes v
       JOIN clients c ON v.client_id = c.id
       WHERE v.magasin_id = $1
       AND DATE_TRUNC('month', v.date_vente) = DATE_TRUNC('month', CURRENT_DATE)
       AND v.statut = 'valide'
       AND v.type_document != 'depense'
       AND v.type_document != 'paiement_credit'
       AND v.type_document != 'paiement_cheque'
       AND (v.mode_paiement IS NULL OR v.mode_paiement != 'credit')
       AND v.client_id IS NOT NULL
       GROUP BY c.id, c.nom
       ORDER BY montant_total DESC
       LIMIT 5`,
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
        // CA BRUT (revenus uniquement)
        brut: {
          jour: parseFloat(caJour.rows[0].total),
          hier: parseFloat(caHier.rows[0].total),
          semaine: parseFloat(caSemaine.rows[0].total),
          semaine_derniere: parseFloat(caSemaineDerniere.rows[0].total),
          mois: parseFloat(caMois.rows[0].total),
        },
        // CA NET (CA brut - Dépenses)
        net: {
          jour: caNetJour,
          hier: caNetHier,
          semaine: caNetSemaine,
          semaine_derniere: caNetSemaineDerniere,
          mois: caNetMois,
        },
        // Dépenses
        depenses: {
          jour: parseFloat(depensesJour.rows[0].total),
          hier: parseFloat(depensesHier.rows[0].total),
          semaine: parseFloat(depensesSemaine.rows[0].total),
          semaine_derniere: parseFloat(depensesSemaineDerniere.rows[0].total),
          mois: parseFloat(depensesMois.rows[0].total),
        },
        // Pour compatibilité avec l'ancien code
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
        details: alertes.details,
      },
      top_produits: topProduits.rows,
      top_produits_jour: topProduitsJour.rows,
      evolution: evolution, // evolution est déjà un tableau, pas besoin de .rows
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
      top_clients: topClients.rows,
      statistiques: {
        panier_moyen_jour: panierMoyenJour,
        panier_moyen_mois: panierMoyenMois,
        total_clients: parseInt(totalClients.rows[0].total),
        total_produits: parseInt(totalProduits.rows[0].total),
        valeur_stock: parseFloat(valeurStock.rows[0].valeur_totale),
        ventes_annulees_mois: parseInt(ventesAnnulees.rows[0].total),
      },
    });
  } catch (error) {
    console.error('Erreur getAdminDashboard:', error);
    console.error('Stack:', (error as Error).stack);
    res.status(500).json({ message: 'Erreur serveur', error: (error as Error).message });
  }
};

