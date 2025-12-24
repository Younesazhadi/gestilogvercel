import { Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const tenantFilter = addTenantFilter(req, '', []);
    let query = `SELECT id, nom, prenom, email, role, permissions, actif, derniere_connexion, created_at 
                 FROM users WHERE magasin_id = $1`;
    const params: any[] = tenantFilter.params;

    if (search) {
      query += ` AND (nom ILIKE $${params.length + 1} OR prenom ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // Compter le total avant pagination
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE magasin_id = $1`;
    const countParams: any[] = tenantFilter.params.slice();

    if (search) {
      countQuery += ` AND (nom ILIKE $${countParams.length + 1} OR prenom ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Parser les permissions JSONB pour chaque utilisateur
    const users = result.rows.map((user: any) => {
      if (user.permissions && typeof user.permissions === 'string') {
        try {
          user.permissions = JSON.parse(user.permissions);
        } catch (e) {
          user.permissions = {};
        }
      } else if (!user.permissions) {
        user.permissions = {};
      }
      return user;
    });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Valider l'ID
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    // Construire la requête avec les bons paramètres
    let query = 'SELECT * FROM users WHERE id = $1';
    const params: any[] = [userId];

    // Ajouter le filtre magasin_id si nécessaire (pas pour super_admin)
    if (req.user.role !== 'super_admin' && req.user.magasinId) {
      query += ' AND magasin_id = $2';
      params.push(req.user.magasinId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Ne pas renvoyer le mot de passe
    const user = { ...result.rows[0] };
    delete user.mot_de_passe;

    // Gérer les permissions JSONB
    // PostgreSQL JSONB retourne déjà un objet, mais on vérifie au cas où
    if (user.permissions === null || user.permissions === undefined) {
      user.permissions = {};
    } else if (typeof user.permissions === 'string') {
      // Si c'est une chaîne (ne devrait pas arriver avec JSONB, mais au cas où)
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e: any) {
        console.error('Erreur parsing permissions dans getUser:', e);
        user.permissions = {};
      }
    }
    // Si c'est déjà un objet (cas normal avec JSONB), on le garde tel quel

    res.json({ user });
  } catch (error: any) {
    console.error('Erreur getUser:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, email, password, permissions, actif } = req.body;

    // Vérifier la limite d'utilisateurs du plan
    const magasinResult = await pool.query(
      `SELECT m.plan_id, p.nb_utilisateurs_max
       FROM magasins m
       LEFT JOIN plans p ON m.plan_id = p.id
       WHERE m.id = $1`,
      [req.user?.magasinId]
    );

    if (magasinResult.rows[0]?.nb_utilisateurs_max) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM users WHERE magasin_id = $1',
        [req.user?.magasinId]
      );
      const currentCount = parseInt(countResult.rows[0].count);

      if (currentCount >= magasinResult.rows[0].nb_utilisateurs_max) {
        return res.status(403).json({
          message: `Limite d'utilisateurs atteinte (${magasinResult.rows[0].nb_utilisateurs_max}). Veuillez passer à un plan supérieur.`,
        });
      }
    }

    // Vérifier que l'email n'existe pas déjà
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Préparer les permissions pour JSONB
    let permissionsJson: any = null;
    if (permissions && typeof permissions === 'object') {
      // S'assurer que les permissions sont un objet valide
      permissionsJson = permissions;
    } else if (typeof permissions === 'string') {
      try {
        permissionsJson = JSON.parse(permissions);
      } catch (e) {
        console.error('Erreur parsing permissions:', e);
        permissionsJson = {};
      }
    }

    const result = await pool.query(
      `INSERT INTO users (magasin_id, nom, prenom, email, mot_de_passe, role, permissions, actif)
       VALUES ($1, $2, $3, $4, $5, 'user', $6::jsonb, $7)
       RETURNING id, nom, prenom, email, role, permissions, actif, magasin_id, created_at`,
      [
        req.user?.magasinId,
        nom,
        prenom,
        email,
        hashedPassword,
        permissionsJson ? JSON.stringify(permissionsJson) : null,
        actif !== undefined ? actif : true,
      ]
    );

    // S'assurer que les permissions sont parsées correctement dans la réponse
    const user = result.rows[0];
    if (user.permissions && typeof user.permissions === 'string') {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e) {
        user.permissions = {};
      }
    }

    await logActivity(req, 'creation_user', 'user', user.id, { nom, email });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Erreur createUser:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['nom', 'prenom', 'email', 'permissions', 'actif'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Aucun champ valide à mettre à jour' });
    }

    // Si on met à jour le mot de passe
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      await pool.query(
        'UPDATE users SET mot_de_passe = $1 WHERE id = $2 AND magasin_id = $3',
        [hashedPassword, id, req.user?.magasinId]
      );
    }

    // Préparer les valeurs avec traitement spécial pour permissions
    const setClauseParts: string[] = [];
    const values: any[] = [id, req.user?.magasinId];
    let paramIndex = 3;

    fieldsToUpdate.forEach((field) => {
      let value = updates[field];
      
      if (field === 'permissions') {
        // Préparer les permissions pour JSONB
        let permissionsJson: any = null;
        if (value && typeof value === 'object') {
          permissionsJson = value;
        } else if (typeof value === 'string') {
          try {
            permissionsJson = JSON.parse(value);
          } catch (e) {
            console.error('Erreur parsing permissions:', e);
            permissionsJson = {};
          }
        }
        value = permissionsJson ? JSON.stringify(permissionsJson) : null;
        setClauseParts.push(`${field} = $${paramIndex}::jsonb`);
      } else {
        setClauseParts.push(`${field} = $${paramIndex}`);
      }
      
      values.push(value);
      paramIndex++;
    });

    const setClause = setClauseParts.join(', ');

    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 AND magasin_id = $2 RETURNING id, nom, prenom, email, role, permissions, actif`,
      values
    );

    // S'assurer que les permissions sont parsées correctement dans la réponse
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.permissions && typeof user.permissions === 'string') {
        try {
          user.permissions = JSON.parse(user.permissions);
        } catch (e) {
          user.permissions = {};
        }
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    await logActivity(req, 'modification_user', 'user', parseInt(id), updates);

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    // Construire la requête pour vérifier l'utilisateur
    let checkQuery = 'SELECT id, role, nom, prenom, email FROM users WHERE id = $1';
    const checkParams: any[] = [userId];

    // Ajouter le filtre magasin_id si nécessaire (pas pour super_admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      checkQuery += ' AND magasin_id = $2';
      checkParams.push(req.user.magasinId);
    }

    const userCheck = await pool.query(checkQuery, checkParams);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const userToDelete = userCheck.rows[0];

    // Ne pas permettre de supprimer un super_admin
    if (userToDelete.role === 'super_admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un super administrateur' });
    }

    // Un admin ne peut pas supprimer un autre admin (seul le super_admin peut)
    if (userToDelete.role === 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur. Seul le super administrateur peut supprimer des administrateurs.' });
    }

    // Supprimer ou mettre à jour les logs d'activité de l'utilisateur
    // (car la contrainte de clé étrangère empêche la suppression)
    try {
      // Option 1: Mettre user_id à NULL dans les logs (préserve l'historique)
      await pool.query(
        'UPDATE logs_activite SET user_id = NULL WHERE user_id = $1',
        [userId]
      );
    } catch (logError: any) {
      console.error('Erreur lors de la mise à jour des logs:', logError);
      // Si la mise à jour échoue, essayer de supprimer les logs
      try {
        await pool.query('DELETE FROM logs_activite WHERE user_id = $1', [userId]);
      } catch (deleteLogError: any) {
        console.error('Erreur lors de la suppression des logs:', deleteLogError);
        // Continuer quand même, on essaiera de supprimer l'utilisateur
      }
    }

    // Mettre à jour les commandes fournisseurs pour mettre user_id à NULL
    try {
      await pool.query(
        'UPDATE commandes_fournisseurs SET user_id = NULL WHERE user_id = $1',
        [userId]
      );
    } catch (cmdError: any) {
      console.error('Erreur lors de la mise à jour des commandes:', cmdError);
    }

    // Mettre à jour les ventes pour mettre user_id à NULL
    try {
      await pool.query(
        'UPDATE ventes SET user_id = NULL WHERE user_id = $1',
        [userId]
      );
    } catch (venteError: any) {
      console.error('Erreur lors de la mise à jour des ventes:', venteError);
    }

    // Mettre à jour les mouvements de stock pour mettre user_id à NULL
    try {
      await pool.query(
        'UPDATE mouvements_stock SET user_id = NULL WHERE user_id = $1',
        [userId]
      );
    } catch (mvtError: any) {
      console.error('Erreur lors de la mise à jour des mouvements:', mvtError);
    }

    // Construire la requête de suppression
    let deleteQuery = 'DELETE FROM users WHERE id = $1';
    const deleteParams: any[] = [userId];

    // Ajouter le filtre magasin_id si nécessaire (pas pour super_admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      deleteQuery += ' AND magasin_id = $2';
      deleteParams.push(req.user.magasinId);
    }

    deleteQuery += ' RETURNING id, nom, prenom, email, role';

    const result = await pool.query(deleteQuery, deleteParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    await logActivity(req, 'suppression_user', 'user', userId, {
      nom: userToDelete.nom,
      prenom: userToDelete.prenom,
      email: userToDelete.email,
      role: userToDelete.role
    });

    res.json({ 
      message: 'Utilisateur supprimé avec succès',
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ 
      message: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

