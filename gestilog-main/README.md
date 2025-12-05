# Gestilog - SaaS de Gestion de Stock Multi-Tenant

Application SaaS complète de gestion de stock pour drogueries et magasins de produits avec système d'abonnement mensuel.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL
- **Hébergement**: Vercel (frontend), Render (backend + BDD)

## Installation

```bash
# Installer toutes les dépendances
npm run install:all

# Démarrer le backend en développement
npm run dev:backend

# Démarrer le frontend en développement
npm run dev:frontend
```

## Structure du projet

```
gestilog/
├── backend/          # API Express + TypeScript
├── frontend/         # Application React + TypeScript
└── database/         # Scripts SQL et migrations
```

## Configuration

1. Créer un fichier `.env` dans le dossier `backend/` avec les variables d'environnement nécessaires
2. Configurer la base de données PostgreSQL
3. Exécuter les scripts SQL dans `database/schema.sql`

## Fonctionnalités

- ✅ Authentification multi-niveaux (Super Admin, Admin, User)
- ✅ Gestion multi-tenant avec isolation des données
- ✅ Gestion complète des produits et stock
- ✅ Point de vente (POS) intégré
- ✅ Gestion des clients et fournisseurs
- ✅ Rapports et statistiques
- ✅ Système d'abonnement et paiements
- ✅ Permissions granulaires par utilisateur

