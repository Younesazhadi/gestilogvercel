import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import bcrypt from 'bcrypt';
import { updateExpiredSubscriptions, getExpiringSubscriptions, getExpiredSubscriptions } from '../utils/subscriptionUtils';

// ============ GESTION DES MAGASINS ============

export const getMagasins = async (req: AuthRequest, res: Response) => {
  try {
    // Mettre à jour automatiquement les statuts des abonnements expirés
    await updateExpiredSubscriptions();

    const { page = 1, limit = 20, search = '', statut = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT m.*, p.nom as plan_nom, p.prix_mensuel as plan_prix
      FROM magasins m
      LEFT JOIN plans p ON m.plan_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (m.nom_magasin ILIKE $${paramIndex} OR m.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (statut) {
      query += ` AND m.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    // Compter le total avec les mêmes filtres
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countParams = params.slice();
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY m.date_creation DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      magasins: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur getMagasins:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getMagasin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT m.*, p.nom as plan_nom, p.prix_mensuel as plan_prix
       FROM magasins m
       LEFT JOIN plans p ON m.plan_id = p.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    // Récupérer les statistiques du magasin
    const statsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT u.id) as nb_utilisateurs,
        COUNT(DISTINCT pr.id) as nb_produits,
        COUNT(DISTINCT v.id) as nb_ventes,
        COALESCE(SUM(v.montant_ttc), 0) as ca_total
       FROM magasins m
       LEFT JOIN users u ON u.magasin_id = m.id
       LEFT JOIN produits pr ON pr.magasin_id = m.id
       LEFT JOIN ventes v ON v.magasin_id = m.id
       WHERE m.id = $1
       GROUP BY m.id`,
      [id]
    );

    res.json({
      magasin: result.rows[0],
      statistiques: statsResult.rows[0] || {},
    });
  } catch (error) {
    console.error('Erreur getMagasin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques détaillées d'un magasin avant suppression
export const getMagasinStatsForDeletion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const magasinId = parseInt(id);

    // Vérifier que le magasin existe
    const magasinCheck = await pool.query('SELECT id, nom_magasin FROM magasins WHERE id = $1', [magasinId]);
    if (magasinCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    const magasin = magasinCheck.rows[0];

    // Récupérer toutes les statistiques
    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE magasin_id = $1) as nb_utilisateurs,
        (SELECT COUNT(*) FROM produits WHERE magasin_id = $1) as nb_produits,
        (SELECT COUNT(*) FROM categories WHERE magasin_id = $1) as nb_categories,
        (SELECT COUNT(*) FROM clients WHERE magasin_id = $1) as nb_clients,
        (SELECT COUNT(*) FROM fournisseurs WHERE magasin_id = $1) as nb_fournisseurs,
        (SELECT COUNT(*) FROM ventes WHERE magasin_id = $1) as nb_ventes,
        (SELECT COUNT(*) FROM paiements WHERE magasin_id = $1) as nb_paiements,
        (SELECT COUNT(*) FROM commandes_fournisseurs WHERE magasin_id = $1) as nb_commandes,
        (SELECT COUNT(*) FROM mouvements_stock WHERE magasin_id = $1) as nb_mouvements,
        (SELECT COUNT(*) FROM logs_activite WHERE magasin_id = $1) as nb_logs,
        (SELECT COALESCE(SUM(montant_ttc), 0) FROM ventes WHERE magasin_id = $1) as ca_total`,
      [magasinId]
    );

    const statistiques = stats.rows[0];

    res.json({
      magasin: {
        id: magasin.id,
        nom_magasin: magasin.nom_magasin
      },
      statistiques: {
        utilisateurs: parseInt(statistiques.nb_utilisateurs || '0'),
        produits: parseInt(statistiques.nb_produits || '0'),
        categories: parseInt(statistiques.nb_categories || '0'),
        clients: parseInt(statistiques.nb_clients || '0'),
        fournisseurs: parseInt(statistiques.nb_fournisseurs || '0'),
        ventes: parseInt(statistiques.nb_ventes || '0'),
        paiements: parseInt(statistiques.nb_paiements || '0'),
        commandes: parseInt(statistiques.nb_commandes || '0'),
        mouvements_stock: parseInt(statistiques.nb_mouvements || '0'),
        logs: parseInt(statistiques.nb_logs || '0'),
        ca_total: parseFloat(statistiques.ca_total || '0'),
      },
      total_elements: 
        parseInt(statistiques.nb_utilisateurs || '0') +
        parseInt(statistiques.nb_produits || '0') +
        parseInt(statistiques.nb_categories || '0') +
        parseInt(statistiques.nb_clients || '0') +
        parseInt(statistiques.nb_fournisseurs || '0') +
        parseInt(statistiques.nb_ventes || '0') +
        parseInt(statistiques.nb_paiements || '0') +
        parseInt(statistiques.nb_commandes || '0') +
        parseInt(statistiques.nb_mouvements || '0') +
        parseInt(statistiques.nb_logs || '0')
    });
  } catch (error) {
    console.error('Erreur getMagasinStatsForDeletion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createMagasin = async (req: AuthRequest, res: Response) => {
  try {
    const {
      nom_magasin,
      adresse,
      telephone,
      email,
      ice,
      rc,
      plan_id,
      date_expiration_abonnement,
      notes,
    } = req.body;

    // Vérifier que l'email n'existe pas déjà
    const emailCheck = await pool.query('SELECT id FROM magasins WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const result = await pool.query(
      `INSERT INTO magasins 
       (nom_magasin, adresse, telephone, email, ice, rc, plan_id, date_expiration_abonnement, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nom_magasin, adresse, telephone, email, ice, rc, plan_id, date_expiration_abonnement, notes]
    );

    await logActivity(req, 'creation_magasin', 'magasin', result.rows[0].id, { nom_magasin });

    res.status(201).json({ magasin: result.rows[0] });
  } catch (error) {
    console.error('Erreur createMagasin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateMagasin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const magasinId = parseInt(id);
    const updates = req.body;

    if (isNaN(magasinId)) {
      return res.status(400).json({ message: 'ID magasin invalide' });
    }

    // Vérifier que le magasin existe
    const magasinCheck = await pool.query('SELECT id FROM magasins WHERE id = $1', [magasinId]);
    if (magasinCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre magasin (si email est modifié)
    if (updates.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM magasins WHERE email = $1 AND id != $2',
        [updates.email, magasinId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre magasin' });
      }
    }

    const allowedFields = [
      'nom_magasin', 'adresse', 'telephone', 'email', 'ice', 'rc',
      'plan_id', 'statut', 'date_expiration_abonnement', 'notes', 'logo_url'
    ];

    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Aucun champ valide à mettre à jour' });
    }

    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values: any[] = [magasinId, ...fieldsToUpdate.map(field => updates[field] !== undefined ? updates[field] : null)];

    const result = await pool.query(
      `UPDATE magasins SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    await logActivity(req, 'modification_magasin', 'magasin', magasinId, updates);

    res.json({ magasin: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateMagasin:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const deleteMagasin = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const magasinId = parseInt(id);

    if (isNaN(magasinId)) {
      client.release();
      return res.status(400).json({ message: 'ID de magasin invalide' });
    }

    // Vérifier que le magasin existe et récupérer les statistiques
    const magasinCheck = await client.query(
      `SELECT 
        m.id, 
        m.nom_magasin,
        (SELECT COUNT(*) FROM users WHERE magasin_id = m.id) as nb_utilisateurs,
        (SELECT COUNT(*) FROM produits WHERE magasin_id = m.id) as nb_produits,
        (SELECT COUNT(*) FROM categories WHERE magasin_id = m.id) as nb_categories,
        (SELECT COUNT(*) FROM clients WHERE magasin_id = m.id) as nb_clients,
        (SELECT COUNT(*) FROM fournisseurs WHERE magasin_id = m.id) as nb_fournisseurs,
        (SELECT COUNT(*) FROM ventes WHERE magasin_id = m.id) as nb_ventes,
        (SELECT COUNT(*) FROM paiements WHERE magasin_id = m.id) as nb_paiements,
        (SELECT COUNT(*) FROM commandes_fournisseurs WHERE magasin_id = m.id) as nb_commandes,
        (SELECT COUNT(*) FROM mouvements_stock WHERE magasin_id = m.id) as nb_mouvements,
        (SELECT COUNT(*) FROM logs_activite WHERE magasin_id = m.id) as nb_logs
       FROM magasins m
       WHERE m.id = $1`,
      [magasinId]
    );

    if (magasinCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    const magasin = magasinCheck.rows[0];
    const statistiques = {
      nb_utilisateurs: parseInt(magasin.nb_utilisateurs || '0'),
      nb_produits: parseInt(magasin.nb_produits || '0'),
      nb_categories: parseInt(magasin.nb_categories || '0'),
      nb_clients: parseInt(magasin.nb_clients || '0'),
      nb_fournisseurs: parseInt(magasin.nb_fournisseurs || '0'),
      nb_ventes: parseInt(magasin.nb_ventes || '0'),
      nb_paiements: parseInt(magasin.nb_paiements || '0'),
      nb_commandes: parseInt(magasin.nb_commandes || '0'),
      nb_mouvements: parseInt(magasin.nb_mouvements || '0'),
      nb_logs: parseInt(magasin.nb_logs || '0'),
    };

    // Démarrer une transaction
    await client.query('BEGIN');

    try {
      // Supprimer les associations multi-magasins si les tables existent
      try {
        await client.query('DELETE FROM users_magasins WHERE magasin_id = $1', [magasinId]);
      } catch (e: any) {
        // Table peut ne pas exister, continuer
        if (e.code !== '42P01') { // 42P01 = table does not exist
          console.log('Erreur lors de la suppression de users_magasins:', e.message);
        }
      }

      try {
        await client.query('DELETE FROM user_magasin_actif WHERE magasin_id = $1', [magasinId]);
      } catch (e: any) {
        // Table peut ne pas exister, continuer
        if (e.code !== '42P01') {
          console.log('Erreur lors de la suppression de user_magasin_actif:', e.message);
        }
      }

      // Supprimer le magasin (CASCADE supprimera automatiquement toutes les données liées)
      // Mais on supprime d'abord les données qui pourraient avoir des dépendances circulaires
      
      // Supprimer les lignes de vente (doit être avant les ventes)
      await client.query(
        `DELETE FROM lignes_vente 
         WHERE vente_id IN (SELECT id FROM ventes WHERE magasin_id = $1)`,
        [magasinId]
      );

      // Supprimer les lignes de commande (doit être avant les commandes)
      await client.query(
        `DELETE FROM lignes_commande 
         WHERE commande_id IN (SELECT id FROM commandes_fournisseurs WHERE magasin_id = $1)`,
        [magasinId]
      );

      // Supprimer le magasin (CASCADE supprimera le reste)
      const result = await client.query('DELETE FROM magasins WHERE id = $1 RETURNING *', [magasinId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ message: 'Magasin introuvable' });
      }

      // Valider la transaction
      await client.query('COMMIT');

      // Logger l'activité (après la transaction)
      try {
        await logActivity(req, 'suppression_magasin', 'magasin', magasinId, {
          nom_magasin: magasin.nom_magasin,
          statistiques
        });
      } catch (logError) {
        console.error('Erreur lors du logging:', logError);
        // Ne pas échouer la suppression si le logging échoue
      }

      client.release();

      res.json({
        message: 'Magasin supprimé complètement avec succès',
        magasin: {
          id: magasin.id,
          nom: magasin.nom_magasin
        },
        statistiques_supprimees: {
          utilisateurs: statistiques.nb_utilisateurs,
          produits: statistiques.nb_produits,
          categories: statistiques.nb_categories,
          clients: statistiques.nb_clients,
          fournisseurs: statistiques.nb_fournisseurs,
          ventes: statistiques.nb_ventes,
          paiements: statistiques.nb_paiements,
          commandes: statistiques.nb_commandes,
          mouvements_stock: statistiques.nb_mouvements,
          logs: statistiques.nb_logs,
        }
      });
    } catch (error: any) {
      // En cas d'erreur, annuler la transaction
      await client.query('ROLLBACK');
      client.release();
      console.error('Erreur dans la transaction deleteMagasin:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Erreur deleteMagasin:', error);
    res.status(500).json({ 
      message: error.message || 'Erreur lors de la suppression du magasin',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Créer un admin pour un magasin
export const createAdminForMagasin = async (req: AuthRequest, res: Response) => {
  try {
    const { magasin_id, nom, prenom, email, password } = req.body;

    // Vérifier que le magasin existe
    const magasinCheck = await pool.query('SELECT id FROM magasins WHERE id = $1', [magasin_id]);
    if (magasinCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    // Vérifier que l'email n'existe pas déjà
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (magasin_id, nom, prenom, email, mot_de_passe, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')
       RETURNING id, nom, prenom, email, role, magasin_id`,
      [magasin_id, nom, prenom, email, hashedPassword]
    );

    await logActivity(req, 'creation_admin', 'user', result.rows[0].id, { magasin_id, email });

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erreur createAdminForMagasin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============ GESTION DES PLANS ============

export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM plans ORDER BY prix_mensuel ASC');
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('Erreur getPlans:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, fonctionnalites, actif } = req.body;

    // Validation des champs requis
    if (!nom || prix_mensuel === undefined || !nb_utilisateurs_max) {
      return res.status(400).json({ message: 'Les champs nom, prix_mensuel et nb_utilisateurs_max sont requis' });
    }

    // Préparer les fonctionnalités pour JSONB
    // Si c'est déjà un objet, on le garde tel quel (PostgreSQL JSONB accepte les objets JS)
    // Si c'est une chaîne, on essaie de la parser
    // Sinon, on utilise un objet vide
    let fonctionnalitesJson: any = {};
    if (typeof fonctionnalites === 'object' && fonctionnalites !== null) {
      fonctionnalitesJson = fonctionnalites;
    } else if (typeof fonctionnalites === 'string') {
      try {
        fonctionnalitesJson = JSON.parse(fonctionnalites);
      } catch {
        fonctionnalitesJson = {};
      }
    }

    // Gérer nb_produits_max (peut être null pour illimité)
    const nbProduitsMax = nb_produits_max === '' || nb_produits_max === null || nb_produits_max === undefined
      ? null
      : parseInt(nb_produits_max);

    const result = await pool.query(
      `INSERT INTO plans (nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, fonctionnalites, actif)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING *`,
      [
        nom,
        parseFloat(prix_mensuel),
        parseInt(nb_utilisateurs_max),
        nbProduitsMax,
        JSON.stringify(fonctionnalitesJson), // PostgreSQL nécessite une chaîne JSON pour ::jsonb
        actif !== undefined ? actif : true
      ]
    );

    await logActivity(req, 'creation_plan', 'plan', result.rows[0].id, { nom });

    res.status(201).json({ plan: result.rows[0] });
  } catch (error: any) {
    console.error('Erreur createPlan:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Un plan avec ce nom existe déjà' });
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que le plan existe
    const existingPlan = await pool.query('SELECT id FROM plans WHERE id = $1', [id]);
    if (existingPlan.rows.length === 0) {
      return res.status(404).json({ message: 'Plan introuvable' });
    }

    const allowedFields = ['nom', 'prix_mensuel', 'nb_utilisateurs_max', 'nb_produits_max', 'fonctionnalites', 'actif'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Aucun champ valide à mettre à jour' });
    }

    // Préparer les valeurs avec conversion appropriée
    const values: any[] = [id];
    const setClauseParts: string[] = [];

    fieldsToUpdate.forEach((field, index) => {
      let value = updates[field];
      
      // Traitement spécial pour chaque champ
      if (field === 'fonctionnalites') {
        // Préparer les fonctionnalités pour JSONB
        let fonctionnalitesJson: any = {};
        if (typeof value === 'object' && value !== null) {
          fonctionnalitesJson = value;
        } else if (typeof value === 'string') {
          try {
            fonctionnalitesJson = JSON.parse(value);
          } catch {
            fonctionnalitesJson = {};
          }
        }
        value = JSON.stringify(fonctionnalitesJson);
        setClauseParts.push(`${field} = $${index + 2}::jsonb`);
      } else if (field === 'nb_produits_max') {
        value = value === '' || value === null || value === undefined
          ? null
          : parseInt(value);
        setClauseParts.push(`${field} = $${index + 2}`);
      } else if (field === 'prix_mensuel') {
        value = parseFloat(value);
        setClauseParts.push(`${field} = $${index + 2}`);
      } else if (field === 'nb_utilisateurs_max') {
        value = parseInt(value);
        setClauseParts.push(`${field} = $${index + 2}`);
      } else if (field === 'actif') {
        value = value !== undefined ? value : true;
        setClauseParts.push(`${field} = $${index + 2}`);
      } else {
        setClauseParts.push(`${field} = $${index + 2}`);
      }

      values.push(value);
    });

    const setClause = setClauseParts.join(', ');

    const result = await pool.query(
      `UPDATE plans SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    await logActivity(req, 'modification_plan', 'plan', parseInt(id), updates);

    res.json({ plan: result.rows[0] });
  } catch (error: any) {
    console.error('Erreur updatePlan:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Un plan avec ce nom existe déjà' });
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier si le plan est utilisé par des magasins
    const magasinsResult = await pool.query(
      'SELECT COUNT(*) as count FROM magasins WHERE plan_id = $1',
      [id]
    );

    if (parseInt(magasinsResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Ce plan ne peut pas être supprimé car il est utilisé par des magasins' 
      });
    }

    const result = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Plan introuvable' });
    }

    await logActivity(req, 'suppression_plan', 'plan', parseInt(id), { nom: result.rows[0].nom });

    res.json({ message: 'Plan supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deletePlan:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============ GESTION DES PAIEMENTS ============

export const getPaiements = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, magasin_id, statut, periode_debut, periode_fin } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT p.*, m.nom_magasin
      FROM paiements p
      JOIN magasins m ON p.magasin_id = m.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (magasin_id) {
      query += ` AND p.magasin_id = $${paramIndex}`;
      params.push(magasin_id);
      paramIndex++;
    }

    if (statut) {
      query += ` AND p.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    if (periode_debut) {
      query += ` AND p.date_paiement >= $${paramIndex}`;
      params.push(periode_debut);
      paramIndex++;
    }

    if (periode_fin) {
      query += ` AND p.date_paiement <= $${paramIndex}`;
      params.push(periode_fin);
      paramIndex++;
    }

    query += ` ORDER BY p.date_paiement DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Compter le total avec les mêmes filtres (sans LIMIT/OFFSET)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM paiements p
      JOIN magasins m ON p.magasin_id = m.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (magasin_id) {
      countQuery += ` AND p.magasin_id = $${countParamIndex}`;
      countParams.push(magasin_id);
      countParamIndex++;
    }

    if (statut) {
      countQuery += ` AND p.statut = $${countParamIndex}`;
      countParams.push(statut);
      countParamIndex++;
    }

    if (periode_debut) {
      countQuery += ` AND p.date_paiement >= $${countParamIndex}`;
      countParams.push(periode_debut);
      countParamIndex++;
    }

    if (periode_fin) {
      countQuery += ` AND p.date_paiement <= $${countParamIndex}`;
      countParams.push(periode_fin);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      paiements: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur getPaiements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createPaiement = async (req: AuthRequest, res: Response) => {
  try {
    const {
      magasin_id,
      montant,
      methode_paiement,
      statut,
      periode_debut,
      periode_fin,
      reference,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO paiements 
       (magasin_id, montant, methode_paiement, statut, periode_debut, periode_fin, reference, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [magasin_id, montant, methode_paiement, statut || 'en_attente', periode_debut, periode_fin, reference, notes]
    );

    // Si le paiement est marqué comme payé, mettre à jour la date d'expiration du magasin
    if (statut === 'paye' && periode_fin) {
      await pool.query(
        'UPDATE magasins SET date_expiration_abonnement = $1, statut = $2 WHERE id = $3',
        [periode_fin, 'actif', magasin_id]
      );
    }

    await logActivity(req, 'creation_paiement', 'paiement', result.rows[0].id, { magasin_id, montant });

    res.status(201).json({ paiement: result.rows[0] });
  } catch (error) {
    console.error('Erreur createPaiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============ GESTION DES ABONNEMENTS ============

// Endpoint pour forcer la mise à jour des statuts d'abonnements
export const updateSubscriptionsStatus = async (req: AuthRequest, res: Response) => {
  try {
    await updateExpiredSubscriptions();
    res.json({ 
      message: 'Statuts des abonnements mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateSubscriptionsStatus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============ STATISTIQUES SUPER ADMIN ============

export const getSuperAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    // Mettre à jour automatiquement les statuts des abonnements expirés
    await updateExpiredSubscriptions();

    // Nombre de magasins par statut
    const magasinsStats = await pool.query(
      `SELECT statut, COUNT(*) as count 
       FROM magasins 
       GROUP BY statut`
    );

    // Revenus du mois en cours
    const revenusMois = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM paiements
       WHERE statut = 'paye'
       AND EXTRACT(MONTH FROM date_paiement) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM date_paiement) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    // Revenus du mois précédent
    const revenusMoisPrecedent = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM paiements
       WHERE statut = 'paye'
       AND date_paiement >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
       AND date_paiement < DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Abonnements qui expirent dans 7 jours (avec jours restants)
    const expirations = await getExpiringSubscriptions(7);

    // Abonnements déjà expirés
    const expired = await getExpiredSubscriptions();

    // Évolution des inscriptions (12 derniers mois)
    const evolution = await pool.query(
      `SELECT 
        DATE_TRUNC('month', date_creation) as mois,
        COUNT(*) as count
       FROM magasins
       WHERE date_creation >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY mois
       ORDER BY mois ASC`
    );

    res.json({
      magasins: magasinsStats.rows,
      revenus: {
        mois_actuel: parseFloat(revenusMois.rows[0].total),
        mois_precedent: parseFloat(revenusMoisPrecedent.rows[0].total),
      },
      expirations: expirations,
      expired: expired,
      evolution: evolution.rows,
    });
  } catch (error) {
    console.error('Erreur getSuperAdminStats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

