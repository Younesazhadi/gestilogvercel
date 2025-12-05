import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';

export const getFournisseurs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const tenantFilter = addTenantFilter(req, '', []);
    let query = `SELECT * FROM fournisseurs WHERE magasin_id = $1`;
    const params: any[] = tenantFilter.params;

    if (search) {
      query += ` AND (nom ILIKE $${params.length + 1} OR contact_nom ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY nom ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      fournisseurs: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Erreur getFournisseurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getFournisseur = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const fournisseurId = parseInt(id);

    if (isNaN(fournisseurId)) {
      return res.status(400).json({ message: 'ID fournisseur invalide' });
    }

    let query = 'SELECT * FROM fournisseurs WHERE id = $1';
    let params: any[] = [fournisseurId];

    // Filtre tenant (sauf pour super admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      query += ' AND magasin_id = $2';
      params.push(req.user.magasinId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fournisseur introuvable' });
    }

    // Récupérer les commandes
    const magasinId = req.magasinId || req.user?.magasinId;
    const commandesResult = await pool.query(
      `SELECT * FROM commandes_fournisseurs 
       WHERE fournisseur_id = $1 AND magasin_id = $2
       ORDER BY date_commande DESC`,
      [fournisseurId, magasinId]
    );

    res.json({
      fournisseur: result.rows[0],
      commandes: commandesResult.rows,
    });
  } catch (error) {
    console.error('Erreur getFournisseur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createFournisseur = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, contact_nom, telephone, email, adresse, ice, ville, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO fournisseurs 
       (magasin_id, nom, contact_nom, telephone, email, adresse, ice, ville, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user?.magasinId, nom, contact_nom, telephone, email, adresse, ice, ville, notes]
    );

    await logActivity(req, 'creation_fournisseur', 'fournisseur', result.rows[0].id, { nom });

    res.status(201).json({ fournisseur: result.rows[0] });
  } catch (error) {
    console.error('Erreur createFournisseur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateFournisseur = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['nom', 'contact_nom', 'telephone', 'email', 'adresse', 'ice', 'ville', 'notes'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Aucun champ valide à mettre à jour' });
    }

    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = [id, req.user?.magasinId, ...fieldsToUpdate.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE fournisseurs SET ${setClause} WHERE id = $1 AND magasin_id = $2 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fournisseur introuvable' });
    }

    await logActivity(req, 'modification_fournisseur', 'fournisseur', parseInt(id), updates);

    res.json({ fournisseur: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateFournisseur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteFournisseur = async (req: AuthRequest, res: Response) => {
  const dbClient = await pool.connect();
  try {
    const { id } = req.params;
    const fournisseurId = parseInt(id);

    if (isNaN(fournisseurId)) {
      return res.status(400).json({ message: 'ID fournisseur invalide' });
    }

    await dbClient.query('BEGIN');

    // Vérifier que le fournisseur existe et appartient au bon magasin
    let checkQuery = 'SELECT id, nom FROM fournisseurs WHERE id = $1';
    let checkParams: any[] = [fournisseurId];

    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      checkQuery += ' AND magasin_id = $2';
      checkParams.push(req.user.magasinId);
    }

    const checkResult = await dbClient.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Fournisseur introuvable' });
    }

    const fournisseurNom = checkResult.rows[0].nom;
    const magasinId = req.magasinId || req.user?.magasinId;

    // Mettre à jour les mouvements de stock pour mettre fournisseur_id à NULL
    try {
      if (magasinId) {
        await dbClient.query(
          'UPDATE mouvements_stock SET fournisseur_id = NULL WHERE fournisseur_id = $1 AND magasin_id = $2',
          [fournisseurId, magasinId]
        );
      } else {
        await dbClient.query(
          'UPDATE mouvements_stock SET fournisseur_id = NULL WHERE fournisseur_id = $1',
          [fournisseurId]
        );
      }
    } catch (mvtError: any) {
      console.error('Erreur lors de la mise à jour des mouvements de stock:', mvtError);
      // Continuer quand même
    }

    // Mettre à jour les commandes fournisseurs pour mettre fournisseur_id à NULL
    try {
      if (magasinId) {
        await dbClient.query(
          'UPDATE commandes_fournisseurs SET fournisseur_id = NULL WHERE fournisseur_id = $1 AND magasin_id = $2',
          [fournisseurId, magasinId]
        );
      } else {
        await dbClient.query(
          'UPDATE commandes_fournisseurs SET fournisseur_id = NULL WHERE fournisseur_id = $1',
          [fournisseurId]
        );
      }
    } catch (cmdError: any) {
      console.error('Erreur lors de la mise à jour des commandes:', cmdError);
      // Continuer quand même
    }

    // Supprimer le fournisseur
    let deleteQuery = 'DELETE FROM fournisseurs WHERE id = $1';
    let deleteParams: any[] = [fournisseurId];

    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      deleteQuery += ' AND magasin_id = $2';
      deleteParams.push(req.user.magasinId);
    }

    deleteQuery += ' RETURNING id, nom';

    const result = await dbClient.query(deleteQuery, deleteParams);

    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Fournisseur introuvable' });
    }

    await dbClient.query('COMMIT');

    await logActivity(req, 'suppression_fournisseur', 'fournisseur', fournisseurId, {
      nom: fournisseurNom
    });

    res.json({ message: 'Fournisseur supprimé avec succès' });
  } catch (error: any) {
    await dbClient.query('ROLLBACK');
    console.error('Erreur deleteFournisseur:', error);
    console.error('Détails:', {
      id: req.params.id,
      userId: req.user?.userId,
      role: req.user?.role,
      magasinId: req.magasinId || req.user?.magasinId,
      errorMessage: error.message,
      errorCode: error.code
    });
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression du fournisseur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    dbClient.release();
  }
};

