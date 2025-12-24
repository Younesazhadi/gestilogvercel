import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';

// Récupérer tous les chèques
export const getCheques = async (req: AuthRequest, res: Response) => {
  try {
    const { search, statut, page = 1, limit = 50, date_debut, date_fin } = req.query;
    const magasinId = req.user?.magasinId;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        v.id,
        v.numero_vente,
        v.reference_paiement,
        v.date_cheque,
        v.montant_ttc,
        v.statut_cheque,
        v.date_vente,
        v.type_document,
        c.nom as client_nom,
        v.client_id
      FROM ventes v
      LEFT JOIN clients c ON v.client_id = c.id
      WHERE v.magasin_id = $1
      AND v.mode_paiement = 'cheque'
      AND v.statut = 'valide'
      AND v.date_cheque IS NOT NULL
    `;

    const params: any[] = [magasinId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (
        v.reference_paiement ILIKE $${paramIndex}
        OR v.numero_vente ILIKE $${paramIndex}
        OR c.nom ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (statut) {
      query += ` AND v.statut_cheque = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    if (date_debut) {
      query += ` AND DATE(v.date_vente) >= $${paramIndex}::date`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND DATE(v.date_vente) < $${paramIndex}::date`;
      params.push(date_fin);
      paramIndex++;
    }

    // Compter le total avec les mêmes filtres (sans JOINs)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM ventes v
      WHERE v.magasin_id = $1
      AND v.mode_paiement = 'cheque'
      AND v.statut = 'valide'
      AND v.date_cheque IS NOT NULL
    `;
    const countParams: any[] = [magasinId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND (
        v.reference_paiement ILIKE $${countParamIndex}
        OR v.numero_vente ILIKE $${countParamIndex}
        OR EXISTS (SELECT 1 FROM clients c WHERE c.id = v.client_id AND c.nom ILIKE $${countParamIndex})
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (statut) {
      countQuery += ` AND v.statut_cheque = $${countParamIndex}`;
      countParams.push(statut);
      countParamIndex++;
    }

    if (date_debut) {
      countQuery += ` AND DATE(v.date_vente) >= $${countParamIndex}::date`;
      countParams.push(date_debut);
      countParamIndex++;
    }

    if (date_fin) {
      countQuery += ` AND DATE(v.date_vente) < $${countParamIndex}::date`;
      countParams.push(date_fin);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY v.date_cheque ASC, v.date_vente DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({ 
      cheques: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur getCheques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'un chèque
export const updateStatutCheque = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { statut } = req.body;
    const magasinId = req.user?.magasinId;

    const statutsValides = ['en_attente', 'depose', 'paye', 'impaye'];
    if (!statutsValides.includes(statut)) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Récupérer les informations du chèque
    const chequeResult = await client.query(
      `SELECT v.id, v.client_id, v.montant_ttc, v.statut_cheque, v.type_document, v.numero_vente, v.reference_paiement, v.date_cheque, c.nom as client_nom
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.id = $1 AND v.magasin_id = $2 AND v.mode_paiement = $3`,
      [id, magasinId, 'cheque']
    );

    if (chequeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Chèque introuvable' });
    }

    const cheque = chequeResult.rows[0];
    const ancienStatut = cheque.statut_cheque;
    const montant = parseFloat(cheque.montant_ttc);

    // Si le chèque devient payé, ajouter au CA à la date courante (date de paiement)
    if (statut === 'paye' && ancienStatut !== 'paye') {
      // Récupérer les montants initiaux depuis les lignes de vente
      const lignesResult = await client.query(
        `SELECT 
          SUM(prix_unitaire * quantite * (1 - remise/100)) as total_ht,
          SUM(prix_unitaire * quantite * (1 - remise/100) * tva/100) as total_tva
         FROM lignes_vente 
         WHERE vente_id = $1`,
        [id]
      );

      if (lignesResult.rows.length > 0 && lignesResult.rows[0].total_ht) {
        const montant_ht = parseFloat(lignesResult.rows[0].total_ht) || 0;
        const montant_tva = parseFloat(lignesResult.rows[0].total_tva) || 0;
        const montant_ttc = montant_ht + montant_tva;

        // Toujours créer une vente de type "paiement_cheque" à la date et heure courante (timestamp de paiement)
        // Générer un numéro de vente pour le paiement
        const generateNumeroVentePaiement = async (magasinId: number) => {
          const year = new Date().getFullYear();
          const result = await client.query(
            `SELECT COUNT(*) as count FROM ventes 
             WHERE magasin_id = $1 
             AND numero_vente LIKE $2`,
            [magasinId, `PAY-CHEQUE-${year}-%`]
          );
          const nextNum = parseInt(result.rows[0].count) + 1;
          return `PAY-CHEQUE-${year}-${String(nextNum).padStart(6, '0')}`;
        };

        const numero_vente_paiement = await generateNumeroVentePaiement(magasinId!);

        // Créer une vente de type "paiement_cheque" avec CURRENT_TIMESTAMP (date et heure de paiement)
        // Ne pas spécifier date_vente pour utiliser la valeur par défaut CURRENT_TIMESTAMP
        const ventePaiementResult = await client.query(
          `INSERT INTO ventes 
           (magasin_id, numero_vente, type_document, client_id, user_id, montant_ht, montant_tva, montant_ttc, remise, mode_paiement, reference_paiement, date_cheque, notes, statut_cheque)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING *`,
          [
            magasinId,
            numero_vente_paiement,
            'paiement_cheque', // Type spécial pour identifier les paiements de chèques
            cheque.client_id,
            req.user?.userId,
            montant_ht,
            montant_tva,
            montant_ttc,
            0,
            'cheque',
            cheque.reference_paiement || null,
            cheque.date_cheque || null, // Garder la date du chèque pour référence
            `Paiement chèque - Vente originale: ${cheque.numero_vente || 'N/A'}`,
            'paye',
            // date_vente sera automatiquement CURRENT_TIMESTAMP (date et heure actuelles)
          ]
        );

        // Créer une ligne de vente pour le paiement
        await client.query(
          `INSERT INTO lignes_vente 
           (vente_id, produit_id, designation, quantite, prix_unitaire, tva, remise, montant_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            ventePaiementResult.rows[0].id,
            null,
            `Paiement chèque - ${cheque.reference_paiement || 'N/A'}`,
            1,
            montant_ttc,
            0,
            0,
            montant_ttc
          ]
        );

        // Ne pas mettre à jour les montants de la vente originale
        // La vente originale garde ses montants à 0 (pas dans le CA)
        // Le CA est comptabilisé via la nouvelle vente de paiement
      }
    }

    // Si le chèque devient impayé, ajouter le montant au crédit du client
    if (statut === 'impaye' && ancienStatut !== 'impaye') {
      if (!cheque.client_id) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ message: 'Ce chèque n\'est pas associé à un client. Impossible de créer un crédit.' });
      }

      // Vérifier le crédit autorisé
      const clientCheck = await client.query(
        'SELECT solde, credit_autorise FROM clients WHERE id = $1 AND magasin_id = $2',
        [cheque.client_id, magasinId]
      );

      if (clientCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ message: 'Client introuvable' });
      }

      const soldeActuel = parseFloat(clientCheck.rows[0].solde);
      const creditAutorise = parseFloat(clientCheck.rows[0].credit_autorise);
      const nouveauSolde = soldeActuel + montant;

      // Vérifier que le crédit autorisé n'est pas dépassé
      if (creditAutorise > 0 && nouveauSolde > creditAutorise) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          message: `Le crédit autorisé (${creditAutorise.toFixed(2)} MAD) sera dépassé. Solde actuel: ${soldeActuel.toFixed(2)} MAD, Nouveau solde: ${nouveauSolde.toFixed(2)} MAD. Crédit disponible: ${(creditAutorise - soldeActuel).toFixed(2)} MAD.` 
        });
      }

      // Ajouter le montant au solde du client
      await client.query(
        'UPDATE clients SET solde = solde + $1 WHERE id = $2',
        [montant, cheque.client_id]
      );

      // Mettre les montants à 0 pour exclure du CA
      await client.query(
        `UPDATE ventes 
         SET montant_ht = 0, montant_tva = 0 
         WHERE id = $1`,
        [id]
      );
    }

    // Si le chèque passe de payé à un autre statut (sauf impayé), retirer du CA
    if (ancienStatut === 'paye' && statut !== 'paye' && statut !== 'impaye') {
      // Mettre les montants à 0 pour exclure du CA
      await client.query(
        `UPDATE ventes 
         SET montant_ht = 0, montant_tva = 0 
         WHERE id = $1`,
        [id]
      );
    }

    // Si le chèque passe d'impayé à payé, retirer le crédit et ajouter au CA
    if (ancienStatut === 'impaye' && statut === 'paye') {
      if (cheque.client_id) {
        // Vérifier que le solde est suffisant
        const clientCheck = await client.query(
          'SELECT solde FROM clients WHERE id = $1 AND magasin_id = $2',
          [cheque.client_id, magasinId]
        );

        if (clientCheck.rows.length > 0) {
          const soldeActuel = parseFloat(clientCheck.rows[0].solde);
          if (soldeActuel >= montant) {
            // Retirer le montant du solde du client
            await client.query(
              'UPDATE clients SET solde = solde - $1 WHERE id = $2',
              [montant, cheque.client_id]
            );
          }
        }
      }

      // Récupérer les montants initiaux depuis les lignes de vente
      const lignesResult = await client.query(
        `SELECT 
          SUM(prix_unitaire * quantite * (1 - remise/100)) as total_ht,
          SUM(prix_unitaire * quantite * (1 - remise/100) * tva/100) as total_tva
         FROM lignes_vente 
         WHERE vente_id = $1`,
        [id]
      );

      if (lignesResult.rows.length > 0 && lignesResult.rows[0].total_ht) {
        const montant_ht = parseFloat(lignesResult.rows[0].total_ht) || 0;
        const montant_tva = parseFloat(lignesResult.rows[0].total_tva) || 0;
        const montant_ttc = montant_ht + montant_tva;

        // Mettre à jour les montants pour inclure dans le CA
        await client.query(
          `UPDATE ventes 
           SET montant_ht = $1, montant_tva = $2, montant_ttc = $3 
           WHERE id = $4`,
          [montant_ht, montant_tva, montant_ttc, id]
        );
      }
    }

    // Mettre à jour le statut
    await client.query('UPDATE ventes SET statut_cheque = $1 WHERE id = $2', [statut, id]);

    await client.query('COMMIT');
    client.release();

    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Erreur updateStatutCheque:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

