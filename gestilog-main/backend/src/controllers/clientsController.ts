import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const tenantFilter = addTenantFilter(req, '', []);
    let query = `SELECT * FROM clients WHERE magasin_id = $1`;
    const params: any[] = tenantFilter.params;

    if (search) {
      query += ` AND (nom ILIKE $${params.length + 1} OR telephone ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY nom ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      clients: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Erreur getClients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return res.status(400).json({ message: 'ID client invalide' });
    }

    let query = 'SELECT * FROM clients WHERE id = $1';
    let params: any[] = [clientId];

    // Filtre tenant (sauf pour super admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      query += ' AND magasin_id = $2';
      params.push(req.user.magasinId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    // Récupérer l'historique des ventes
    const magasinId = req.magasinId || req.user?.magasinId;
    const ventesResult = await pool.query(
      `SELECT v.*, SUM(lv.montant_total) as total_lignes
       FROM ventes v
       LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
       WHERE v.client_id = $1 AND v.magasin_id = $2
       GROUP BY v.id
       ORDER BY v.date_vente DESC
       LIMIT 20`,
      [clientId, magasinId]
    );

    res.json({
      client: result.rows[0],
      historique_ventes: ventesResult.rows,
    });
  } catch (error) {
    console.error('Erreur getClient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, telephone, email, adresse, ice, credit_autorise, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO clients 
       (magasin_id, nom, telephone, email, adresse, ice, credit_autorise, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user?.magasinId, nom, telephone, email, adresse, ice, credit_autorise || 0, notes]
    );

    await logActivity(req, 'creation_client', 'client', result.rows[0].id, { nom });

    res.status(201).json({ client: result.rows[0] });
  } catch (error) {
    console.error('Erreur createClient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['nom', 'telephone', 'email', 'adresse', 'ice', 'credit_autorise', 'notes'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Aucun champ valide à mettre à jour' });
    }

    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = [id, req.user?.magasinId, ...fieldsToUpdate.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE clients SET ${setClause} WHERE id = $1 AND magasin_id = $2 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    await logActivity(req, 'modification_client', 'client', parseInt(id), updates);

    res.json({ client: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateClient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Enregistrer un paiement client
export const enregistrerPaiement = async (req: AuthRequest, res: Response) => {
  try {
    const { client_id, montant, notes } = req.body;

    const clientCheck = await pool.query(
      'SELECT solde FROM clients WHERE id = $1 AND magasin_id = $2',
      [client_id, req.user?.magasinId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const nouveauSolde = parseFloat(clientCheck.rows[0].solde) - montant;

    await pool.query(
      'UPDATE clients SET solde = $1 WHERE id = $2',
      [nouveauSolde, client_id]
    );

    await logActivity(req, 'paiement_client', 'client', client_id, { montant, nouveau_solde: nouveauSolde });

    res.json({ message: 'Paiement enregistré avec succès', nouveau_solde: nouveauSolde });
  } catch (error) {
    console.error('Erreur enregistrerPaiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  const dbClient = await pool.connect();
  try {
    const { id } = req.params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return res.status(400).json({ message: 'ID client invalide' });
    }

    await dbClient.query('BEGIN');

    // Vérifier que le client existe et appartient au bon magasin
    let checkQuery = 'SELECT id, nom FROM clients WHERE id = $1';
    let checkParams: any[] = [clientId];

    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      checkQuery += ' AND magasin_id = $2';
      checkParams.push(req.user.magasinId);
    }

    const checkResult = await dbClient.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const clientNom = checkResult.rows[0].nom;

    // Mettre à jour les ventes pour mettre client_id à NULL
    // (car la contrainte de clé étrangère empêche la suppression)
    try {
      const magasinId = req.magasinId || req.user?.magasinId;
      if (magasinId) {
        await dbClient.query(
          'UPDATE ventes SET client_id = NULL WHERE client_id = $1 AND magasin_id = $2',
          [clientId, magasinId]
        );
      } else {
        await dbClient.query(
          'UPDATE ventes SET client_id = NULL WHERE client_id = $1',
          [clientId]
        );
      }
    } catch (venteError: any) {
      console.error('Erreur lors de la mise à jour des ventes:', venteError);
      // Continuer quand même, on essaiera de supprimer le client
    }

    // Supprimer le client
    let deleteQuery = 'DELETE FROM clients WHERE id = $1';
    let deleteParams: any[] = [clientId];

    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      deleteQuery += ' AND magasin_id = $2';
      deleteParams.push(req.user.magasinId);
    }

    deleteQuery += ' RETURNING id, nom';

    const result = await dbClient.query(deleteQuery, deleteParams);

    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Client introuvable' });
    }

    await dbClient.query('COMMIT');

    await logActivity(req, 'suppression_client', 'client', clientId, {
      nom: clientNom
    });

    res.json({ message: 'Client supprimé avec succès' });
  } catch (error: any) {
    await dbClient.query('ROLLBACK');
    console.error('Erreur deleteClient:', error);
    console.error('Détails:', {
      id: req.params.id,
      userId: req.user?.userId,
      role: req.user?.role,
      magasinId: req.magasinId || req.user?.magasinId,
      errorMessage: error.message,
      errorCode: error.code
    });
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression du client',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    dbClient.release();
  }
};

