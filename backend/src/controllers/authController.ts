import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { logActivity } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

// Connexion
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.actif) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    // Si c'est un admin ou user, vérifier le statut du magasin
    if (user.magasin_id) {
      const magasinResult = await pool.query(
        'SELECT statut, date_expiration_abonnement FROM magasins WHERE id = $1',
        [user.magasin_id]
      );

      if (magasinResult.rows.length === 0) {
        return res.status(404).json({ message: 'Magasin introuvable' });
      }

      const magasin = magasinResult.rows[0];
      if (magasin.statut !== 'actif') {
        return res.status(403).json({ 
          message: 'Votre compte est suspendu ou votre abonnement a expiré' 
        });
      }

      // Vérifier l'expiration
      if (magasin.date_expiration_abonnement) {
        const expiration = new Date(magasin.date_expiration_abonnement);
        if (expiration < new Date()) {
          return res.status(403).json({ 
            message: 'Votre abonnement a expiré. Veuillez renouveler.' 
          });
        }
      }
    }

    // Mettre à jour la dernière connexion
    await pool.query(
      'UPDATE users SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Récupérer les permissions si c'est un user
    let permissions = null;
    if (user.role === 'user') {
      let userPermissions = user.permissions || {};
      // S'assurer que les permissions sont un objet (parser si c'est une chaîne)
      if (typeof userPermissions === 'string') {
        try {
          userPermissions = JSON.parse(userPermissions);
        } catch (e) {
          console.error('Erreur parsing permissions lors du login:', e);
          userPermissions = {};
        }
      }
      permissions = userPermissions;
    }

    // Récupérer les fonctionnalités du plan si l'utilisateur a un magasin
    let planFeatures = null;
    if (user.magasin_id) {
      const planResult = await pool.query(
        `SELECT p.fonctionnalites 
         FROM magasins m 
         JOIN plans p ON m.plan_id = p.id 
         WHERE m.id = $1`,
        [user.magasin_id]
      );
      if (planResult.rows.length > 0) {
        let features = planResult.rows[0].fonctionnalites || {};
        // S'assurer que les fonctionnalités sont un objet
        if (typeof features === 'string') {
          try {
            features = JSON.parse(features);
          } catch (e) {
            console.error('Erreur parsing fonctionnalités lors du login:', e);
            features = {};
          }
        }
        planFeatures = features;
      }
    }

    // Générer les tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      magasinId: user.magasin_id,
    };

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET n\'est pas défini dans les variables d\'environnement');
    }
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET n\'est pas défini dans les variables d\'environnement');
    }

    // @ts-ignore - Type issue with jsonwebtoken types
    const accessToken = jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // @ts-ignore - Type issue with jsonwebtoken types
    const refreshToken = jwt.sign(
      payload,
      jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Log de connexion
    const authReq = req as AuthRequest;
    authReq.user = payload;
    await logActivity(authReq, 'connexion', 'user', user.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        magasinId: user.magasin_id,
        permissions,
        planFeatures,
      },
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rafraîchir le token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token manquant' });
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      return res.status(500).json({ message: 'Configuration serveur invalide' });
    }

    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;

    // Vérifier que l'utilisateur existe toujours
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0 || !userResult.rows[0].actif) {
      return res.status(401).json({ message: 'Utilisateur invalide' });
    }

    const user = userResult.rows[0];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'Configuration serveur invalide' });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      magasinId: user.magasin_id,
    };

    // @ts-ignore - Type issue with jsonwebtoken types
    const newAccessToken = jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token invalide' });
  }
};

// Obtenir le profil de l'utilisateur connecté
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const user = userResult.rows[0];
    
    let magasin = null;
    let planFeatures = null;
    if (user.magasin_id) {
      const magasinResult = await pool.query(
        `SELECT m.*, p.fonctionnalites as plan_fonctionnalites 
         FROM magasins m 
         LEFT JOIN plans p ON m.plan_id = p.id 
         WHERE m.id = $1`,
        [user.magasin_id]
      );
      if (magasinResult.rows.length > 0) {
        magasin = magasinResult.rows[0];
        let features = magasin.plan_fonctionnalites || {};
        // S'assurer que les fonctionnalités sont un objet
        if (typeof features === 'string') {
          try {
            features = JSON.parse(features);
          } catch (e) {
            console.error('Erreur parsing fonctionnalités lors du getProfile:', e);
            features = {};
          }
        }
        planFeatures = features;
        // Retirer plan_fonctionnalites de l'objet magasin
        delete magasin.plan_fonctionnalites;
      }
    }

    // Parser les permissions si c'est un user
    let userPermissions = null;
    if (user.role === 'user') {
      let permissions = user.permissions || {};
      // S'assurer que les permissions sont un objet (parser si c'est une chaîne)
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions);
        } catch (e) {
          console.error('Erreur parsing permissions lors du getProfile:', e);
          permissions = {};
        }
      }
      userPermissions = permissions;
    }

    res.json({
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        magasinId: user.magasin_id,
        permissions: userPermissions,
        actif: user.actif,
        planFeatures,
      },
      magasin,
    });
  } catch (error: any) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

