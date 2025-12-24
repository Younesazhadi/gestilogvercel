import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validators pour l'authentification
export const loginValidator = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

export const registerValidator = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères'),
  body('nom').notEmpty().withMessage('Nom requis'),
];

// Validators pour les produits
export const produitValidator = [
  body('nom').notEmpty().withMessage('Nom du produit requis'),
  body('prix_vente').isFloat({ min: 0 }).withMessage('Prix de vente invalide'),
  body('stock_actuel').isFloat({ min: 0 }).withMessage('Stock actuel invalide'),
  body('stock_min').isFloat({ min: 0 }).withMessage('Stock minimum invalide'),
];

// Validators pour les ventes
export const venteValidator = [
  body('lignes').isArray({ min: 1 }).withMessage('Au moins un produit requis'),
  body('lignes.*.quantite').isFloat({ min: 0.01 }).withMessage('Quantité invalide'),
  body('lignes.*.prix_unitaire').isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
];

// Validators pour les clients
export const clientValidator = [
  body('nom').notEmpty().withMessage('Nom du client requis'),
];

// Validators pour les fournisseurs
export const fournisseurValidator = [
  body('nom').notEmpty().withMessage('Nom du fournisseur requis'),
];

