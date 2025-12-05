# Guide de Configuration - Gestilog

## Structure du Projet

```
gestilog/
├── backend/              # API Express + TypeScript
│   ├── src/
│   │   ├── config/      # Configuration (DB, Cloudinary)
│   │   ├── controllers/ # Contrôleurs métier
│   │   ├── middleware/  # Auth, multi-tenant, permissions
│   │   ├── routes/      # Routes API
│   │   ├── types/       # Types TypeScript
│   │   ├── utils/       # Utilitaires (logger, validators)
│   │   └── server.ts    # Point d'entrée
│   └── package.json
├── frontend/            # Application React + TypeScript
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── contexts/    # Contextes React (Auth)
│   │   ├── layouts/     # Layouts par rôle
│   │   ├── pages/       # Pages de l'application
│   │   ├── types/       # Types TypeScript
│   │   └── App.tsx      # Point d'entrée
│   └── package.json
└── database/            # Scripts SQL
    └── schema.sql       # Schéma complet de la base de données
```

## Installation

### 1. Prérequis

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### 2. Installation des dépendances

```bash
# À la racine
npm run install:all

# Ou manuellement
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configuration de la base de données

1. Créer une base de données PostgreSQL :
```sql
CREATE DATABASE gestilog;
```

2. Exécuter le schéma SQL :
```bash
psql -U votre_user -d gestilog -f database/schema.sql
```

### 4. Configuration Backend

1. Créer un fichier `.env` dans `backend/` :
```env
DATABASE_URL=postgresql://user:password@localhost:5432/gestilog
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

2. Créer un super admin :
```bash
cd backend
npm run create-super-admin [email] [password] [nom] [prenom]

# Exemple :
npm run create-super-admin admin@gestilog.com admin123 Super Admin
```

Ou manuellement en SQL (le mot de passe doit être hashé avec bcrypt) :
```sql
-- Le mot de passe doit être hashé avec bcrypt
-- Exemple pour "admin123" : $2b$10$...
INSERT INTO users (nom, prenom, email, mot_de_passe, role) 
VALUES ('Super', 'Admin', 'admin@gestilog.com', '$2b$10$...', 'super_admin');
```

### 5. Configuration Frontend

1. Créer un fichier `.env` dans `frontend/` :
```env
VITE_API_URL=http://localhost:5000/api
```

## Démarrage

### Mode développement

```bash
# Terminal 1 - Backend
npm run dev:backend
# ou
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev:frontend
# ou
cd frontend && npm run dev
```

- Backend : http://localhost:5000
- Frontend : http://localhost:3000

## Fonctionnalités Implémentées

### ✅ Backend

- [x] Authentification JWT avec refresh token
- [x] Middleware multi-tenant (isolation des données)
- [x] Middleware de permissions granulaires
- [x] Système de logs d'activité
- [x] Routes Super Admin :
  - Gestion des magasins (CRUD)
  - Gestion des plans (CRUD)
  - Gestion des paiements
  - Statistiques globales
- [x] Routes Admin :
  - Gestion des produits (CRUD)
  - Gestion du stock (entrées, sorties, ajustements)
  - Gestion des ventes (création, annulation)
  - Gestion des clients (CRUD, paiements)
  - Gestion des fournisseurs (CRUD)
  - Dashboard avec statistiques

### ✅ Frontend

- [x] Structure React + TypeScript
- [x] Routing avec React Router
- [x] Authentification (login, logout, refresh token)
- [x] Context API pour l'état global
- [x] Layouts par rôle (Super Admin, Admin, User)
- [x] Composants de base (Sidebar, PrivateRoute)
- [x] Pages Super Admin :
  - Dashboard avec statistiques
  - Liste des magasins
- [x] Pages Admin (structure de base)
- [x] Design avec Tailwind CSS

## Fonctionnalités à Compléter

### 🔄 Backend

- [ ] Gestion des catégories (CRUD)
- [ ] Gestion des commandes fournisseurs
- [ ] Génération de documents PDF (factures, devis, BL)
- [ ] Rapports avancés (ventes, stock, financiers)
- [ ] Upload d'images vers Cloudinary
- [ ] Gestion des utilisateurs par magasin (CRUD, permissions)
- [ ] Paramètres du magasin
- [ ] Notifications email

### 🔄 Frontend

- [ ] Dashboard Admin complet avec graphiques
- [ ] Interface POS (Point de Vente) complète
- [ ] Gestion complète des produits (formulaire, liste, recherche)
- [ ] Gestion du stock (entrées, sorties, ajustements)
- [ ] Gestion des ventes (liste, détails, impression)
- [ ] Gestion des clients (CRUD, historique, paiements)
- [ ] Gestion des fournisseurs (CRUD, commandes)
- [ ] Rapports et statistiques avec graphiques (Recharts)
- [ ] Paramètres du magasin
- [ ] Gestion des utilisateurs et permissions
- [ ] Upload d'images
- [ ] Impression de documents

## Architecture Multi-Tenant

### Isolation des données

- Chaque table contient un `magasin_id`
- Le middleware `enforceTenantIsolation` vérifie automatiquement :
  - Que le magasin existe
  - Que le magasin est actif
  - Que l'abonnement n'a pas expiré
- Le middleware `addTenantFilter` ajoute automatiquement le filtre `magasin_id` aux requêtes

### Rôles et Permissions

1. **Super Admin** : Accès à tous les magasins, gestion des plans et paiements
2. **Admin** : Accès complet à son magasin uniquement
3. **User** : Accès limité selon les permissions définies par l'admin

Les permissions sont stockées dans `users.permissions` au format JSONB :
```json
{
  "ventes.consulter": true,
  "ventes.creer": true,
  "produits.modifier_prix": false,
  ...
}
```

## Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ JWT avec expiration (1h access, 7j refresh)
- ✅ Rate limiting (100 req/15min)
- ✅ CORS configuré
- ✅ Helmet pour les headers de sécurité
- ✅ Validation des entrées (express-validator)
- ✅ Protection contre les injections SQL (requêtes préparées)

## Prochaines Étapes

1. **Compléter les pages frontend** : Implémenter les formulaires et listes pour tous les modules
2. **Interface POS** : Créer une interface de vente optimisée avec scanner code-barres
3. **Génération PDF** : Utiliser une bibliothèque comme `pdfkit` ou `puppeteer` pour générer les factures
4. **Graphiques** : Utiliser Recharts pour les dashboards
5. **Tests** : Ajouter des tests unitaires et d'intégration
6. **Déploiement** : Configurer Vercel (frontend) et Render (backend + BDD)

## Notes Importantes

- ⚠️ **Sécurité** : Changer tous les secrets JWT en production
- ⚠️ **Base de données** : Faire des backups réguliers
- ⚠️ **Abonnements** : Implémenter un système de vérification automatique de l'expiration
- ⚠️ **Limites** : Vérifier les limites du plan avant d'ajouter des utilisateurs/produits

## Support

Pour toute question ou problème, consulter la documentation ou créer une issue.

