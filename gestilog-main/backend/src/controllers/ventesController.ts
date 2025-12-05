import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';

// Générer un numéro de vente unique
const generateNumeroVente = async (magasinId: number, type: string): Promise<string> => {
  const prefix = type === 'facture' ? 'FAC' : type === 'devis' ? 'DEV' : type === 'bl' ? 'BL' : 'TKT';
  const year = new Date().getFullYear();
  
  const lastVente = await pool.query(
    `SELECT numero_vente FROM ventes 
     WHERE magasin_id = $1 AND numero_vente LIKE $2 
     ORDER BY id DESC LIMIT 1`,
    [magasinId, `${prefix}-${year}-%`]
  );

  let nextNum = 1;
  if (lastVente.rows.length > 0) {
    const lastNum = parseInt(lastVente.rows[0].numero_vente.split('-')[2]);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(6, '0')}`;
};

// Créer une vente
export const createVente = async (req: AuthRequest, res: Response) => {
  try {
    const {
      type_document,
      client_id,
      lignes,
      remise,
      mode_paiement,
      notes,
      tva_taux = 20, // TVA par défaut
    } = req.body;

    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ message: 'Au moins un produit est requis' });
    }

    // Générer le numéro de vente
    const numero_vente = await generateNumeroVente(req.user!.magasinId!, type_document || 'ticket');

    // Calculer les montants
    let montant_ht = 0;
    let montant_tva = 0;
    let montant_ttc = 0;

    const lignesVente = [];

    for (const ligne of lignes) {
      const { produit_id, quantite, prix_unitaire, tva = tva_taux, remise_ligne = 0 } = ligne;

      // Vérifier le stock si ce n'est pas un devis
      if (type_document !== 'devis') {
        const produitCheck = await pool.query(
          'SELECT stock_actuel, nom FROM produits WHERE id = $1 AND magasin_id = $2',
          [produit_id, req.user?.magasinId]
        );

        if (produitCheck.rows.length === 0) {
          return res.status(404).json({ message: `Produit ${produit_id} introuvable` });
        }

        const stockActuel = parseFloat(produitCheck.rows[0].stock_actuel);
        if (stockActuel < quantite) {
          return res.status(400).json({
            message: `Stock insuffisant pour ${produitCheck.rows[0].nom}. Stock disponible: ${stockActuel}`,
          });
        }
      }

      const montant_ligne_ht = prix_unitaire * quantite * (1 - remise_ligne / 100);
      const tva_ligne = montant_ligne_ht * (tva / 100);
      const montant_ligne_ttc = montant_ligne_ht + tva_ligne;

      montant_ht += montant_ligne_ht;
      montant_tva += tva_ligne;
      montant_ttc += montant_ligne_ttc;

      lignesVente.push({
        produit_id,
        designation: ligne.designation || produitCheck?.rows[0]?.nom || 'Produit',
        quantite,
        prix_unitaire,
        tva,
        remise: remise_ligne,
        montant_total: montant_ligne_ttc,
      });
    }

    // Appliquer la remise globale
    if (remise) {
      montant_ht = montant_ht * (1 - remise / 100);
      montant_tva = montant_ht * (tva_taux / 100);
      montant_ttc = montant_ht + montant_tva;
    }

    // Créer la vente
    const venteResult = await pool.query(
      `INSERT INTO ventes 
       (magasin_id, numero_vente, type_document, client_id, user_id, montant_ht, montant_tva, montant_ttc, remise, mode_paiement, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.user?.magasinId,
        numero_vente,
        type_document || 'ticket',
        client_id,
        req.user?.userId,
        montant_ht,
        montant_tva,
        montant_ttc,
        remise || 0,
        mode_paiement,
        notes,
      ]
    );

    const venteId = venteResult.rows[0].id;

    // Créer les lignes de vente
    for (const ligne of lignesVente) {
      await pool.query(
        `INSERT INTO lignes_vente 
         (vente_id, produit_id, designation, quantite, prix_unitaire, tva, remise, montant_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          venteId,
          ligne.produit_id,
          ligne.designation,
          ligne.quantite,
          ligne.prix_unitaire,
          ligne.tva,
          ligne.remise,
          ligne.montant_total,
        ]
      );

      // Diminuer le stock si ce n'est pas un devis
      if (type_document !== 'devis') {
        await pool.query(
          'UPDATE produits SET stock_actuel = stock_actuel - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [ligne.quantite, ligne.produit_id]
        );

        // Créer un mouvement de sortie
        await pool.query(
          `INSERT INTO mouvements_stock 
           (magasin_id, produit_id, type, quantite, user_id, motif)
           VALUES ($1, $2, 'sortie', $3, $4, $5)`,
          [
            req.user?.magasinId,
            ligne.produit_id,
            ligne.quantite,
            req.user?.userId,
            `Vente ${numero_vente}`,
          ]
        );
      }
    }

    // Mettre à jour le solde client si crédit
    if (client_id && mode_paiement === 'credit') {
      await pool.query(
        'UPDATE clients SET solde = solde + $1 WHERE id = $2',
        [montant_ttc, client_id]
      );
    }

    await logActivity(req, 'creation_vente', 'vente', venteId, {
      numero_vente,
      montant_ttc,
      type_document,
    });

    // Récupérer la vente complète avec lignes
    const venteComplete = await getVenteById(venteId, req.user!.magasinId!);

    res.status(201).json({ vente: venteComplete });
  } catch (error) {
    console.error('Erreur createVente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer une vente par ID
const getVenteById = async (venteId: number, magasinId: number) => {
  const venteResult = await pool.query(
    'SELECT * FROM ventes WHERE id = $1 AND magasin_id = $2',
    [venteId, magasinId]
  );

  if (venteResult.rows.length === 0) {
    return null;
  }

  const lignesResult = await pool.query(
    'SELECT * FROM lignes_vente WHERE vente_id = $1',
    [venteId]
  );

  return {
    ...venteResult.rows[0],
    lignes: lignesResult.rows,
  };
};

export const getVentes = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '', type_document, statut, date_debut, date_fin } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT v.*, c.nom as client_nom, u.nom as user_nom, u.prenom as user_prenom
      FROM ventes v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.magasin_id = $1
    `;
    const params: any[] = [req.user?.magasinId];
    let paramIndex = 2;

    if (search) {
      query += ` AND v.numero_vente ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (type_document) {
      query += ` AND v.type_document = $${paramIndex}`;
      params.push(type_document);
      paramIndex++;
    }

    if (statut) {
      query += ` AND v.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    if (date_debut) {
      query += ` AND v.date_vente >= $${paramIndex}`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND v.date_vente <= $${paramIndex}`;
      params.push(date_fin);
      paramIndex++;
    }

    query += ` ORDER BY v.date_vente DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      ventes: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Erreur getVentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getVente = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vente = await getVenteById(parseInt(id), req.user!.magasinId!);

    if (!vente) {
      return res.status(404).json({ message: 'Vente introuvable' });
    }

    res.json({ vente });
  } catch (error) {
    console.error('Erreur getVente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Annuler une vente
export const annulerVente = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    const vente = await getVenteById(parseInt(id), req.user!.magasinId!);
    if (!vente) {
      return res.status(404).json({ message: 'Vente introuvable' });
    }

    if (vente.statut === 'annule') {
      return res.status(400).json({ message: 'Cette vente est déjà annulée' });
    }

    // Marquer comme annulée
    await pool.query(
      'UPDATE ventes SET statut = $1 WHERE id = $2',
      ['annule', id]
    );

    // Restaurer le stock si ce n'était pas un devis
    if (vente.type_document !== 'devis') {
      for (const ligne of vente.lignes) {
        if (ligne.produit_id) {
          await pool.query(
            'UPDATE produits SET stock_actuel = stock_actuel + $1 WHERE id = $2',
            [ligne.quantite, ligne.produit_id]
          );

          // Créer un mouvement d'entrée
          await pool.query(
            `INSERT INTO mouvements_stock 
             (magasin_id, produit_id, type, quantite, user_id, motif)
             VALUES ($1, $2, 'entree', $3, $4, $5)`,
            [
              req.user?.magasinId,
              ligne.produit_id,
              ligne.quantite,
              req.user?.userId,
              `Annulation vente ${vente.numero_vente}`,
            ]
          );
        }
      }

      // Restaurer le solde client si crédit
      if (vente.client_id && vente.mode_paiement === 'credit') {
        await pool.query(
          'UPDATE clients SET solde = solde - $1 WHERE id = $2',
          [vente.montant_ttc, vente.client_id]
        );
      }
    }

    await logActivity(req, 'annulation_vente', 'vente', parseInt(id), { motif });

    res.json({ message: 'Vente annulée avec succès' });
  } catch (error) {
    console.error('Erreur annulerVente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

