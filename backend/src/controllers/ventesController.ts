import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';

// Générer un numéro de vente unique
const generateNumeroVente = async (magasinId: number, type: string): Promise<string> => {
  const prefix = type === 'facture' ? 'FAC' 
    : type === 'devis' ? 'DEV' 
    : type === 'bl' ? 'BL' 
    : type === 'depense' ? 'DEP'
    : 'TKT';
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
      reference_paiement,
      date_cheque,
      montant_paye,
      notes,
      tva_taux = 20, // TVA par défaut
    } = req.body;

    // Pour les dépenses, on accepte des lignes sans produit_id
    if (type_document !== 'depense' && (!lignes || lignes.length === 0)) {
      return res.status(400).json({ message: 'Au moins un produit est requis' });
    }
    
    // Pour les dépenses, on doit avoir au moins une ligne
    if (type_document === 'depense' && (!lignes || lignes.length === 0)) {
      return res.status(400).json({ message: 'Au moins une ligne est requise pour une dépense' });
    }

    // Générer le numéro de vente
    const numero_vente = await generateNumeroVente(req.user!.magasinId!, type_document || 'ticket');

    // Calculer les montants
    let montant_ht = 0;
    let montant_tva = 0;
    let montant_ttc = 0;

    const lignesVente = [];

    for (const ligne of lignes) {
      const produit_id = ligne.produit_id;
      const quantite = parseFloat(ligne.quantite);
      const prix_unitaire = parseFloat(ligne.prix_unitaire);
      const tva = ligne.tva != null ? parseFloat(ligne.tva) : tva_taux;
      const remise_ligne = ligne.remise_ligne != null ? parseFloat(ligne.remise_ligne) : 0;
      if (!Number.isFinite(quantite) || quantite <= 0 || !Number.isFinite(prix_unitaire) || prix_unitaire < 0) {
        return res.status(400).json({ message: 'Quantité et prix unitaire doivent être des nombres valides (quantité > 0, prix >= 0).' });
      }

      let produitNom = ligne.designation || 'Produit';
      
      // Pour les dépenses, pas besoin de vérifier le stock
      if (type_document === 'depense') {
        // Les dépenses n'ont pas de produit_id, on utilise juste la designation
        produitNom = ligne.designation || 'Dépense';
      } else if (type_document !== 'devis') {
        // Vérifier le stock si ce n'est pas un devis
        const produitCheck = await pool.query(
          'SELECT stock_actuel, nom FROM produits WHERE id = $1 AND magasin_id = $2',
          [produit_id, req.user?.magasinId]
        );

        if (produitCheck.rows.length === 0) {
          return res.status(404).json({ message: `Produit ${produit_id} introuvable` });
        }

        produitNom = produitCheck.rows[0].nom;
        const stockActuel = parseFloat(produitCheck.rows[0].stock_actuel);
        if (stockActuel < quantite) {
          return res.status(400).json({
            message: `Stock insuffisant pour ${produitNom}. Stock disponible: ${stockActuel}`,
          });
        }
      } else if (produit_id) {
        // Pour les devis, récupérer le nom du produit si disponible
        const produitCheck = await pool.query(
          'SELECT nom FROM produits WHERE id = $1 AND magasin_id = $2',
          [produit_id, req.user?.magasinId]
        );
        if (produitCheck.rows.length > 0) {
          produitNom = produitCheck.rows[0].nom;
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
        designation: ligne.designation || produitNom,
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

    // Validation pour crédit
    if (mode_paiement === 'credit') {
      if (!client_id) {
        return res.status(400).json({ message: 'Un client doit être sélectionné pour le paiement à crédit' });
      }
      if (montant_paye && montant_paye < 0) {
        return res.status(400).json({ message: 'Le montant payé ne peut pas être négatif' });
      }
      if (montant_paye && montant_paye > montant_ttc) {
        return res.status(400).json({ message: 'Le montant payé ne peut pas être supérieur au total' });
      }

      // Vérifier que le crédit autorisé n'est pas dépassé
      const clientCheck = await pool.query(
        'SELECT solde, credit_autorise, nom FROM clients WHERE id = $1 AND magasin_id = $2',
        [client_id, req.user?.magasinId]
      );

      if (clientCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Client introuvable' });
      }

      const soldeActuel = parseFloat(clientCheck.rows[0].solde);
      const creditAutorise = parseFloat(clientCheck.rows[0].credit_autorise);
      const resteAPayer = montant_ttc - (montant_paye || 0);
      const nouveauSolde = soldeActuel + resteAPayer;

      if (creditAutorise > 0 && nouveauSolde > creditAutorise) {
        return res.status(400).json({ 
          message: `Le crédit autorisé (${creditAutorise.toFixed(2)} MAD) sera dépassé. Solde actuel: ${soldeActuel.toFixed(2)} MAD, Nouveau solde: ${nouveauSolde.toFixed(2)} MAD. Crédit disponible: ${(creditAutorise - soldeActuel).toFixed(2)} MAD.` 
        });
      }
    }

    // Validation pour chèque
    if (mode_paiement === 'cheque') {
      if (!client_id) {
        return res.status(400).json({ message: 'Un client doit être sélectionné pour le paiement par chèque' });
      }
      if (!reference_paiement?.trim()) {
        return res.status(400).json({ message: 'Le numéro de chèque est requis' });
      }
      if (!date_cheque) {
        return res.status(400).json({ message: 'La date du chèque est requise' });
      }
    }

    // Pour les chèques et les crédits, ne pas compter dans le CA initialement
    // - Chèques : seront ajoutés au CA quand marqués comme payés (via paiement_cheque)
    // - Crédits : seront ajoutés au CA quand payés (via paiement_credit)
    const estCheque = mode_paiement === 'cheque';
    const estCredit = mode_paiement === 'credit';
    const montant_ht_final = (estCheque || estCredit) ? 0 : montant_ht;
    const montant_tva_final = (estCheque || estCredit) ? 0 : montant_tva;
    // Le montant_ttc reste pour affichage, mais ne sera compté dans le CA que si payé

    // Créer la vente
    const venteResult = await pool.query(
      `INSERT INTO ventes 
       (magasin_id, numero_vente, type_document, client_id, user_id, montant_ht, montant_tva, montant_ttc, remise, mode_paiement, reference_paiement, date_cheque, montant_paye, notes, statut_cheque)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        req.user?.magasinId,
        numero_vente,
        type_document || 'ticket',
        client_id,
        req.user?.userId,
        montant_ht_final, // 0 pour chèques et crédits, montant normal pour autres
        montant_tva_final, // 0 pour chèques et crédits, montant normal pour autres
        montant_ttc, // Garde le montant total pour affichage
        remise || 0,
        mode_paiement,
        reference_paiement || null,
        estCheque ? date_cheque : null,
        montant_paye || null,
        notes,
        estCheque ? 'en_attente' : null,
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

      // Diminuer le stock si ce n'est pas un devis et ce n'est pas une dépense
      if (type_document !== 'devis' && type_document !== 'depense' && ligne.produit_id) {
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
      const resteAPayer = montant_ttc - (montant_paye || 0);
      await pool.query(
        'UPDATE clients SET solde = solde + $1 WHERE id = $2',
        [resteAPayer, client_id]
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
    `SELECT v.*, c.nom as client_nom, c.telephone as client_telephone, u.nom as user_nom, u.prenom as user_prenom
     FROM ventes v
     LEFT JOIN clients c ON v.client_id = c.id
     LEFT JOIN users u ON v.user_id = u.id
     WHERE v.id = $1 AND v.magasin_id = $2`,
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
      query += ` AND DATE(v.date_vente) >= $${paramIndex}::date`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      query += ` AND DATE(v.date_vente) < $${paramIndex}::date`;
      params.push(date_fin);
      paramIndex++;
    }

    // Compter le total avant pagination (même conditions WHERE mais sans JOINs)
    let countQuery = `SELECT COUNT(*) as total FROM ventes v WHERE v.magasin_id = $1`;
    const countParams: any[] = [req.user?.magasinId];
    let countParamIndex = 2;

    if (search) {
      countQuery += ` AND v.numero_vente ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (type_document) {
      countQuery += ` AND v.type_document = $${countParamIndex}`;
      countParams.push(type_document);
      countParamIndex++;
    }

    if (statut) {
      countQuery += ` AND v.statut = $${countParamIndex}`;
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

    // Trier par date décroissante, puis par type (ventes normales avant paiements), puis par ID décroissant
    query += ` ORDER BY v.date_vente DESC, 
      CASE 
        WHEN v.type_document = 'paiement_cheque' THEN 2
        WHEN v.type_document = 'paiement_credit' THEN 2
        ELSE 1
      END,
      v.id DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      ventes: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { motif } = req.body;
    const venteId = parseInt(id);

    const vente = await getVenteById(venteId, req.user!.magasinId!);
    if (!vente) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Vente introuvable' });
    }

    if (vente.statut === 'annule') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: 'Cette vente est déjà annulée' });
    }

    // Marquer comme annulée
    await client.query(
      'UPDATE ventes SET statut = $1 WHERE id = $2',
      ['annule', venteId]
    );

    // Si c'est un paiement de crédit, remettre le montant au solde du client
    if (vente.type_document === 'paiement_credit' && vente.client_id) {
      const montant = parseFloat(vente.montant_ttc);
      
      // Vérifier que le client existe
      const clientCheck = await client.query(
        'SELECT id, nom, solde FROM clients WHERE id = $1 AND magasin_id = $2',
        [vente.client_id, req.user?.magasinId]
      );

      if (clientCheck.rows.length > 0) {
        // Remettre le montant au solde du client (on avait retiré lors du paiement)
        await client.query(
          'UPDATE clients SET solde = solde + $1 WHERE id = $2',
          [montant, vente.client_id]
        );
      }
    }

    // Restaurer le stock si ce n'était pas un devis, ce n'est pas un paiement (paiement_credit, paiement_cheque) et ce n'est pas une dépense
    if (vente.type_document !== 'devis' && 
        vente.type_document !== 'paiement_credit' && 
        vente.type_document !== 'paiement_cheque' &&
        vente.type_document !== 'depense') {
      for (const ligne of vente.lignes) {
        if (ligne.produit_id) {
          await client.query(
            'UPDATE produits SET stock_actuel = stock_actuel + $1 WHERE id = $2',
            [ligne.quantite, ligne.produit_id]
          );

          // Créer un mouvement d'entrée
          await client.query(
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

      // Restaurer le solde client si c'était une vente à crédit (retirer le crédit qu'on avait ajouté)
      if (vente.client_id && vente.mode_paiement === 'credit') {
        const resteAPayer = parseFloat(vente.montant_ttc) - (parseFloat(vente.montant_paye || '0'));
        if (resteAPayer > 0) {
          await client.query(
            'UPDATE clients SET solde = solde - $1 WHERE id = $2',
            [resteAPayer, vente.client_id]
          );
        }
      }
    }

    // Pour les paiements de chèques, pas besoin de restaurer le stock ni le crédit
    // Juste marquer comme annulé (déjà fait plus haut)

    await client.query('COMMIT');
    client.release();

    await logActivity(req, 'annulation_vente', 'vente', venteId, { 
      motif,
      type_document: vente.type_document,
      montant: vente.montant_ttc
    });

    res.json({ message: 'Vente annulée avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Erreur annulerVente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

