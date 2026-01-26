import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import { addTenantFilter } from '../middleware/multiTenant';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

// Fonction helper pour uploader une image vers Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string = 'produits'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `gestilog/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

export const getProduits = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '', categorie_id, stock_bas, actif } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Super admin peut voir tous les produits
    let query = `
      SELECT p.*, c.nom as categorie_nom
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE 1=1
    `;
    let params: any[] = [];
    let paramIndex = 1;

    // Filtre tenant (sauf pour super admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      query += ` AND p.magasin_id = $${paramIndex}`;
      params.push(req.user.magasinId);
      paramIndex++;
    }

    if (search) {
      // Recherche par nom, code_barre (exacte ou partielle) et référence
      const searchStr = String(search);
      const searchPattern = `%${searchStr}%`;
      const searchExact = searchStr.trim();
      query += ` AND (
        p.nom ILIKE $${paramIndex} 
        OR p.code_barre ILIKE $${paramIndex} 
        OR p.code_barre = $${paramIndex + 1}
        OR p.reference ILIKE $${paramIndex}
      )`;
      params.push(searchPattern, searchExact);
      paramIndex += 2;
    }

    if (categorie_id) {
      query += ` AND p.categorie_id = $${paramIndex}`;
      params.push(categorie_id);
      paramIndex++;
    }

    if (stock_bas === 'true') {
      query += ` AND p.stock_actuel <= p.stock_min`;
    }

    if (actif !== undefined) {
      query += ` AND p.actif = $${paramIndex}`;
      params.push(actif === 'true');
      paramIndex++;
    }

    // Compter le total avant pagination (même conditions WHERE)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM produits p
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    // Filtre tenant (sauf pour super admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      countQuery += ` AND p.magasin_id = $${countParamIndex}`;
      countParams.push(req.user.magasinId);
      countParamIndex++;
    }

    if (search) {
      const searchStr = String(search);
      const searchPattern = `%${searchStr}%`;
      const searchExact = searchStr.trim();
      countQuery += ` AND (
        p.nom ILIKE $${countParamIndex} 
        OR p.code_barre ILIKE $${countParamIndex} 
        OR p.code_barre = $${countParamIndex + 1}
        OR p.reference ILIKE $${countParamIndex}
      )`;
      countParams.push(searchPattern, searchExact);
      countParamIndex += 2;
    }

    if (categorie_id) {
      countQuery += ` AND p.categorie_id = $${countParamIndex}`;
      countParams.push(categorie_id);
      countParamIndex++;
    }

    if (stock_bas === 'true') {
      countQuery += ` AND p.stock_actuel <= p.stock_min`;
    }

    if (actif !== undefined) {
      countQuery += ` AND p.actif = $${countParamIndex}`;
      countParams.push(actif === 'true');
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY p.nom ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      produits: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur getProduits:', error);
    res.status(500).json({ message: 'Erreur serveur', error: (error as Error).message });
  }
};

export const getProduit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const produitId = parseInt(id);

    if (isNaN(produitId)) {
      return res.status(400).json({ message: 'ID produit invalide' });
    }

    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    // Utiliser req.magasinId (défini par le middleware) ou req.user.magasinId
    const magasinId = req.magasinId || req.user.magasinId;

    let query = 'SELECT * FROM produits WHERE id = $1';
    let params: any[] = [produitId];

    // Filtre tenant (sauf pour super admin)
    if (req.user.role !== 'super_admin') {
      if (!magasinId) {
        return res.status(403).json({ message: 'Magasin non associé' });
      }
      query += ' AND magasin_id = $2';
      params.push(magasinId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    res.json({ produit: result.rows[0] });
  } catch (error: any) {
    console.error('Erreur getProduit:', error);
    console.error('Détails:', {
      id: req.params.id,
      userId: req.user?.userId,
      role: req.user?.role,
      magasinId: req.magasinId || req.user?.magasinId,
      errorMessage: error.message,
      errorCode: error.code
    });
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createProduit = async (req: AuthRequest, res: Response) => {
  try {
    const {
      nom,
      code_barre,
      reference,
      categorie_id,
      description,
      prix_achat,
      prix_vente,
      stock_actuel,
      stock_min,
      unite,
      emplacement,
      image_url,
      actif,
    } = req.body;

    // Gérer l'upload de l'image si un fichier est fourni
    let finalImageUrl = image_url || null;
    if (req.file) {
      try {
        finalImageUrl = await uploadToCloudinary(req.file.buffer, 'produits');
      } catch (uploadError) {
        console.error('Erreur upload image produit:', uploadError);
        return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
      }
    }

    // Parser les valeurs numériques et booléennes depuis FormData
    const parsedCategorieId = categorie_id ? parseFloat(categorie_id) : null;
    const parsedPrixAchat = prix_achat ? parseFloat(prix_achat) : 0;
    const parsedPrixVente = prix_vente ? parseFloat(prix_vente) : 0;
    const parsedStockActuel = stock_actuel ? parseFloat(stock_actuel) : 0;
    const parsedStockMin = stock_min ? parseFloat(stock_min) : 0;
    const parsedActif = actif === 'true' || actif === true || actif === undefined || actif === '';

    // Vérifier la limite de produits du plan
    if (req.user?.magasinId) {
      const magasinResult = await pool.query(
        `SELECT m.plan_id, p.nb_produits_max
         FROM magasins m
         LEFT JOIN plans p ON m.plan_id = p.id
         WHERE m.id = $1`,
        [req.user.magasinId]
      );

      if (magasinResult.rows[0]?.nb_produits_max) {
        const countResult = await pool.query(
          'SELECT COUNT(*) FROM produits WHERE magasin_id = $1',
          [req.user.magasinId]
        );
        const currentCount = parseInt(countResult.rows[0].count);

        if (currentCount >= magasinResult.rows[0].nb_produits_max) {
          return res.status(403).json({
            message: `Limite de produits atteinte (${magasinResult.rows[0].nb_produits_max}). Veuillez passer à un plan supérieur.`,
          });
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO produits 
       (magasin_id, nom, code_barre, reference, categorie_id, description, prix_achat, prix_vente,
        stock_actuel, stock_min, unite, emplacement, image_url, actif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        req.user?.magasinId,
        nom,
        code_barre || null,
        reference || null,
        parsedCategorieId,
        description || null,
        parsedPrixAchat,
        parsedPrixVente,
        parsedStockActuel,
        parsedStockMin,
        unite || 'unité',
        emplacement || null,
        finalImageUrl || null,
        parsedActif,
      ]
    );

    await logActivity(req, 'creation_produit', 'produit', result.rows[0].id, { nom });

    res.status(201).json({ produit: result.rows[0] });
  } catch (error) {
    console.error('Erreur createProduit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateProduit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const produitId = parseInt(id);
    let updates = req.body;

    if (isNaN(produitId)) {
      return res.status(400).json({ message: 'ID produit invalide' });
    }

    // Gérer l'upload de l'image si un fichier est fourni
    if (req.file) {
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'produits');
        updates.image_url = imageUrl;
      } catch (uploadError) {
        console.error('Erreur upload image produit:', uploadError);
        return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
      }
    }

    // Parser les valeurs numériques et booléennes depuis FormData
    if (updates.categorie_id !== undefined) {
      updates.categorie_id = updates.categorie_id ? parseFloat(updates.categorie_id) : null;
    }
    if (updates.prix_achat !== undefined) {
      updates.prix_achat = updates.prix_achat ? parseFloat(updates.prix_achat) : null;
    }
    if (updates.prix_vente !== undefined) {
      updates.prix_vente = updates.prix_vente ? parseFloat(updates.prix_vente) : null;
    }
    if (updates.stock_actuel !== undefined) {
      updates.stock_actuel = updates.stock_actuel ? parseFloat(updates.stock_actuel) : null;
    }
    if (updates.stock_min !== undefined) {
      updates.stock_min = updates.stock_min ? parseFloat(updates.stock_min) : null;
    }
    if (updates.actif !== undefined) {
      updates.actif = updates.actif === 'true' || updates.actif === true;
    }

    const allowedFields = [
      'nom', 'code_barre', 'reference', 'categorie_id', 'description',
      'prix_achat', 'prix_vente', 'stock_actuel', 'stock_min', 'unite',
      'emplacement', 'image_url', 'actif'
    ];

    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Aucun champ valide à mettre à jour' });
    }

    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values: any[] = [produitId, ...fieldsToUpdate.map(field => updates[field])];

    let query = `UPDATE produits SET ${setClause} WHERE id = $1`;
    
    // Ajouter magasin_id pour la sécurité (sauf pour super admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      query += ' AND magasin_id = $' + (values.length + 1);
      values.push(req.user.magasinId);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    await logActivity(req, 'modification_produit', 'produit', produitId, updates);

    res.json({ produit: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateProduit:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const deleteProduit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const produitId = parseInt(id);

    if (isNaN(produitId)) {
      return res.status(400).json({ message: 'ID produit invalide' });
    }

    let query = 'DELETE FROM produits WHERE id = $1';
    let params: any[] = [produitId];

    // Filtre tenant (sauf pour super admin)
    if (req.user?.role !== 'super_admin' && req.user?.magasinId) {
      query += ' AND magasin_id = $2';
      params.push(req.user.magasinId);
    }

    query += ' RETURNING id, nom';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    await logActivity(req, 'suppression_produit', 'produit', produitId, {
      nom: result.rows[0].nom
    });

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteProduit:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Produits en alerte (stock bas, péremption proche)
export const getAlertes = async (req: AuthRequest, res: Response) => {
  try {
    const tenantFilter = addTenantFilter(req, '', []);

    // Produits en rupture
    const ruptureQuery = `
      SELECT * FROM produits 
      WHERE magasin_id = $1 AND stock_actuel <= 0 AND actif = true
      ORDER BY stock_actuel ASC
    `;
    const rupture = await pool.query(ruptureQuery, tenantFilter.params);

    // Produits sous le seuil minimum
    const seuilQuery = `
      SELECT * FROM produits 
      WHERE magasin_id = $1 AND stock_actuel > 0 AND stock_actuel <= stock_min AND actif = true
      ORDER BY stock_actuel ASC
    `;
    const seuil = await pool.query(seuilQuery, tenantFilter.params);

    res.json({
      rupture: rupture.rows,
      seuil_minimum: seuil.rows,
    });
  } catch (error) {
    console.error('Erreur getAlertes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

