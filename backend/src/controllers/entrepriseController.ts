import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/logger';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

// Récupérer les informations de l'entreprise (magasin)
export const getEntrepriseInfo = async (req: AuthRequest, res: Response) => {
  try {
    const magasinId = req.user?.magasinId;

    if (!magasinId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const result = await pool.query(
      `SELECT 
        id,
        nom_magasin,
        adresse,
        ville,
        code_postal,
        telephone,
        telephone_fixe,
        telephone_gsm,
        email,
        logo_url,
        ice,
        rc,
        patent,
        if_fiscal,
        cnss,
        compte_bancaire,
        proprietaire,
        activites,
        notes,
        date_creation
       FROM magasins
       WHERE id = $1`,
      [magasinId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    res.json({ entreprise: result.rows[0] });
  } catch (error) {
    console.error('Erreur getEntrepriseInfo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction helper pour uploader une image vers Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string = 'logos'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `gestilog/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
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

// Mettre à jour les informations de l'entreprise
export const updateEntrepriseInfo = async (req: AuthRequest, res: Response) => {
  try {
    const magasinId = req.user?.magasinId;

    if (!magasinId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const {
      nom_magasin,
      adresse,
      ville,
      code_postal,
      telephone,
      telephone_fixe,
      telephone_gsm,
      email,
      ice,
      rc,
      patent,
      if_fiscal,
      cnss,
      compte_bancaire,
      proprietaire,
      activites,
      notes,
      logo_url
    } = req.body;

    // Gérer l'upload du logo si un fichier est fourni
    let finalLogoUrl = logo_url;
    if (req.file) {
      try {
        finalLogoUrl = await uploadToCloudinary(req.file.buffer, 'logos');
      } catch (uploadError) {
        console.error('Erreur upload logo:', uploadError);
        return res.status(500).json({ message: 'Erreur lors de l\'upload du logo' });
      }
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre magasin (si email est modifié)
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM magasins WHERE email = $1 AND id != $2',
        [email, magasinId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre magasin' });
      }
    }

    const result = await pool.query(
      `UPDATE magasins 
       SET 
         nom_magasin = COALESCE($1, nom_magasin),
         adresse = COALESCE($2, adresse),
         ville = COALESCE($3, ville),
         code_postal = COALESCE($4, code_postal),
         telephone = COALESCE($5, telephone),
         telephone_fixe = COALESCE($6, telephone_fixe),
         telephone_gsm = COALESCE($7, telephone_gsm),
         email = COALESCE($8, email),
         ice = COALESCE($9, ice),
         rc = COALESCE($10, rc),
         patent = COALESCE($11, patent),
         if_fiscal = COALESCE($12, if_fiscal),
         cnss = COALESCE($13, cnss),
         compte_bancaire = COALESCE($14, compte_bancaire),
         proprietaire = COALESCE($15, proprietaire),
         activites = COALESCE($16, activites),
         notes = COALESCE($17, notes),
         logo_url = COALESCE($18, logo_url)
       WHERE id = $19
       RETURNING *`,
      [
        nom_magasin, adresse, ville, code_postal, telephone, telephone_fixe, telephone_gsm,
        email, ice, rc, patent, if_fiscal, cnss, compte_bancaire, proprietaire, activites,
        notes, finalLogoUrl, magasinId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Magasin introuvable' });
    }

    await logActivity(req, 'modification_entreprise', 'magasin', magasinId, req.body);

    res.json({ 
      message: 'Informations mises à jour avec succès',
      entreprise: result.rows[0] 
    });
  } catch (error) {
    console.error('Erreur updateEntrepriseInfo:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

