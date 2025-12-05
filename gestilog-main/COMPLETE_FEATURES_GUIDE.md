# 📘 Guide Complet - Gestilog Application
## Toutes les Fonctionnalités et Rôles

---

## 🎯 Vue d'Ensemble

**Gestilog** est une application SaaS (Software as a Service) de gestion de stock multi-tenant pour drogueries et magasins de produits. Elle permet à plusieurs magasins (clients) de gérer leur inventaire, ventes, clients, fournisseurs, et bien plus, avec un système d'abonnement mensuel.

---

## 👥 LES TROIS RÔLES

### 1. 🔴 SUPER ADMIN (Administrateur Système)
**Accès:** `/super-admin/*`

Le Super Admin gère l'ensemble de la plateforme SaaS. Il ne gère PAS les données d'un magasin spécifique, mais gère les magasins eux-mêmes en tant que clients de la plateforme.

#### ✅ Ce que le Super Admin PEUT faire:

**A. GESTION DES MAGASINS (Clients de la plateforme)**
- ✅ Voir tous les magasins (liste avec pagination et recherche)
- ✅ Créer un nouveau magasin (nom, adresse, téléphone, email, ICE, RC, logo)
- ✅ Voir les détails d'un magasin (informations complètes, statistiques, historique)
- ✅ Modifier les informations d'un magasin
- ✅ Supprimer un magasin (et toutes ses données associées)
- ✅ Activer/Suspendre/Expirer un magasin
- ✅ Assigner un plan d'abonnement à un magasin
- ✅ Définir la date d'expiration de l'abonnement
- ✅ Créer un compte Admin pour un magasin (création automatique du premier admin)

**B. GESTION DES PLANS D'ABONNEMENT**
- ✅ Voir tous les plans disponibles
- ✅ Créer un nouveau plan (nom, prix mensuel, nombre max d'utilisateurs, nombre max de produits, fonctionnalités)
- ✅ Modifier un plan existant
- ✅ Supprimer un plan (si non utilisé)
- ✅ Activer/Désactiver un plan
- ✅ Définir les fonctionnalités de chaque plan (rapports basiques, rapports avancés, alertes stock, gestion fournisseurs, factures, multi-magasins, API access, support prioritaire, tout inclus)

**C. GESTION DES PAIEMENTS**
- ✅ Voir tous les paiements de tous les magasins
- ✅ Enregistrer un nouveau paiement (montant, méthode, période, statut)
- ✅ Voir l'historique des paiements
- ✅ Filtrer les paiements par statut (payé, en attente, échoué)
- ✅ Voir les paiements par magasin

**D. STATISTIQUES GLOBALES**
- ✅ Nombre de magasins actifs/suspendus/expirés
- ✅ Revenus du mois en cours
- ✅ Revenus du mois précédent
- ✅ Liste des abonnements qui expirent dans 7 jours
- ✅ Évolution des inscriptions (12 derniers mois)
- ✅ Graphiques d'évolution

**E. DASHBOARD SUPER ADMIN**
- ✅ Vue d'ensemble de la plateforme
- ✅ Cartes statistiques (magasins actifs, revenus, suspendus, expirations)
- ✅ Alertes sur les abonnements qui expirent bientôt
- ✅ Graphiques de croissance

#### ❌ Ce que le Super Admin NE PEUT PAS faire:
- ❌ Gérer les produits d'un magasin spécifique
- ❌ Gérer les ventes d'un magasin
- ❌ Gérer le stock d'un magasin
- ❌ Accéder aux données opérationnelles des magasins (sauf statistiques globales)

---

### 2. 🟡 ADMIN (Administrateur Magasin)
**Accès:** `/admin/*`

L'Admin gère TOUTES les opérations de SON magasin uniquement. Il a un accès complet à toutes les fonctionnalités de gestion de stock et de vente.

#### ✅ Ce que l'Admin PEUT faire:

**A. DASHBOARD ADMIN**
- ✅ Voir le CA (Chiffre d'Affaires) du jour, de la semaine, du mois
- ✅ Voir le nombre de ventes du jour
- ✅ Voir les alertes stock (rupture, seuil minimum, péremption)
- ✅ Voir les top produits du mois
- ✅ Voir les graphiques de ventes (évolution quotidienne, hebdomadaire)
- ✅ Vue d'ensemble de l'activité du magasin

**B. GESTION DES PRODUITS**
- ✅ Voir tous les produits du magasin (liste avec pagination, recherche, filtres)
- ✅ Créer un nouveau produit (nom, code-barres, référence, catégorie, description, prix d'achat, prix de vente, stock initial, stock minimum, unité, emplacement, image, date de péremption)
- ✅ Modifier un produit existant
- ✅ Supprimer un produit
- ✅ Activer/Désactiver un produit
- ✅ Voir les alertes de stock (produits en rupture, sous le seuil minimum, proches de péremption)
- ✅ Rechercher par nom, code-barres, référence
- ✅ Filtrer par catégorie, statut (actif/inactif)

**C. GESTION DU STOCK**
- ✅ Voir tous les mouvements de stock (entrées, sorties, ajustements, inventaires)
- ✅ Créer une entrée de stock (réception de marchandise)
  - Quantité, prix unitaire, fournisseur, référence document (BL, facture)
- ✅ Créer une sortie de stock (sortie manuelle)
  - Quantité, motif
- ✅ Créer un ajustement de stock (correction d'inventaire)
  - Quantité finale, motif
- ✅ Créer un inventaire (comptage physique)
- ✅ Voir l'historique complet des mouvements
- ✅ Filtrer par type de mouvement, date, produit

**D. GESTION DES VENTES**
- ✅ Voir toutes les ventes (liste avec pagination, recherche, filtres)
- ✅ Voir les détails d'une vente (produits vendus, montants, client, mode de paiement)
- ✅ Créer une nouvelle vente (via POS ou manuellement)
- ✅ Annuler une vente (avec motif)
- ✅ Filtrer par date, client, statut (valide, annulé, brouillon)
- ✅ Voir les ventes par type de document (ticket, facture, devis, BL)

**E. POINT DE VENTE (POS) - CAISSE**
- ✅ Interface de caisse optimisée
- ✅ Scanner code-barres pour ajouter des produits
- ✅ Recherche manuelle de produits
- ✅ Ajouter/Retirer des produits du panier
- ✅ Modifier les quantités
- ✅ Appliquer des remises (pourcentage ou montant fixe)
- ✅ Sélectionner un client (ou vente sans client)
- ✅ Choisir le mode de paiement (espèces, carte, chèque, crédit, virement)
- ✅ Calcul automatique du total TTC
- ✅ Finaliser la vente
- ✅ Imprimer le ticket/facture

**F. GESTION DES CLIENTS**
- ✅ Voir tous les clients (liste avec pagination, recherche)
- ✅ Créer un nouveau client (nom, téléphone, email, adresse, ICE, crédit autorisé)
- ✅ Modifier un client
- ✅ Supprimer un client
- ✅ Voir l'historique des ventes d'un client
- ✅ Voir le solde du crédit client
- ✅ Enregistrer un paiement client (remboursement de crédit)
- ✅ Gérer le crédit autorisé par client

**G. GESTION DES FOURNISSEURS**
- ✅ Voir tous les fournisseurs (liste avec pagination, recherche)
- ✅ Créer un nouveau fournisseur (nom, contact, téléphone, email, adresse, ICE, ville)
- ✅ Modifier un fournisseur
- ✅ Supprimer un fournisseur
- ✅ Voir l'historique des commandes avec un fournisseur

**H. GESTION DES UTILISATEURS (Employés du magasin)**
- ✅ Voir tous les utilisateurs du magasin (liste)
- ✅ Créer un nouvel utilisateur (nom, prénom, email, mot de passe, permissions)
- ✅ Modifier un utilisateur (activer/désactiver, changer permissions)
- ✅ Supprimer un utilisateur
- ✅ Définir les permissions granulaires pour chaque utilisateur:
  - `ventes.consulter` - Voir les ventes
  - `ventes.creer` - Créer des ventes
  - `ventes.modifier` - Modifier des ventes
  - `ventes.supprimer` - Supprimer des ventes
  - `ventes.remises` - Appliquer des remises
  - `produits.consulter` - Voir les produits
  - `produits.creer` - Créer des produits
  - `produits.modifier` - Modifier des produits
  - `produits.supprimer` - Supprimer des produits
  - `produits.modifier_prix` - Modifier les prix
  - `stock.consulter` - Voir le stock
  - `stock.entrees` - Créer des entrées de stock
  - `stock.sorties` - Créer des sorties de stock
  - `stock.ajustements` - Faire des ajustements
  - `stock.inventaire` - Faire des inventaires

**I. RAPPORTS ET STATISTIQUES**
- ✅ Rapport des ventes (par période, par catégorie, par utilisateur)
- ✅ Rapport financier (CA, bénéfices, TVA)
- ✅ Rapport de stock (valeurs, mouvements)
- ✅ Top produits (les plus vendus)
- ✅ Ventes par catégorie
- ✅ Ventes par utilisateur
- ✅ Graphiques et tableaux de bord

**J. DOCUMENTS**
- ✅ Générer des factures
- ✅ Générer des devis
- ✅ Générer des bons de livraison (BL)
- ✅ Imprimer des tickets de caisse

#### ❌ Ce que l'Admin NE PEUT PAS faire:
- ❌ Accéder aux données d'autres magasins
- ❌ Modifier les plans d'abonnement
- ❌ Gérer les paiements de la plateforme
- ❌ Créer d'autres admins (seul le Super Admin peut créer le premier admin)

---

### 3. 🟢 USER (Utilisateur/Employé)
**Accès:** `/dashboard` (limité)

L'User est un employé du magasin avec des permissions limitées définies par l'Admin.

#### ✅ Ce que l'User PEUT faire (selon ses permissions):

**A. DASHBOARD USER**
- ✅ Voir un dashboard basique (selon permissions)

**B. PERMISSIONS POSSIBLES:**
L'User peut avoir accès à certaines fonctionnalités selon les permissions que l'Admin lui a accordées:

- ✅ **Voir les ventes** (si `ventes.consulter` = true)
- ✅ **Créer des ventes** (si `ventes.creer` = true) - Utiliser le POS
- ✅ **Modifier des ventes** (si `ventes.modifier` = true)
- ✅ **Annuler des ventes** (si `ventes.supprimer` = true)
- ✅ **Appliquer des remises** (si `ventes.remises` = true)
- ✅ **Voir les produits** (si `produits.consulter` = true)
- ✅ **Créer des produits** (si `produits.creer` = true)
- ✅ **Modifier des produits** (si `produits.modifier` = true)
- ✅ **Supprimer des produits** (si `produits.supprimer` = true)
- ✅ **Modifier les prix** (si `produits.modifier_prix` = true)
- ✅ **Voir le stock** (si `stock.consulter` = true)
- ✅ **Créer des entrées de stock** (si `stock.entrees` = true)
- ✅ **Créer des sorties de stock** (si `stock.sorties` = true)
- ✅ **Faire des ajustements** (si `stock.ajustements` = true)
- ✅ **Faire des inventaires** (si `stock.inventaire` = true)

#### ❌ Ce que l'User NE PEUT PAS faire:
- ❌ Gérer les utilisateurs
- ❌ Gérer les clients (sauf si permissions spéciales)
- ❌ Gérer les fournisseurs (sauf si permissions spéciales)
- ❌ Voir les rapports avancés (sauf si permissions spéciales)
- ❌ Accéder aux paramètres du magasin

---

## 📊 STRUCTURE DES DONNÉES

### Tables Principales:

1. **plans** - Plans d'abonnement (Basique 2000 DH, Standard 3000 DH, Premium 4000 DH)
2. **magasins** - Les magasins clients de la plateforme
3. **users** - Utilisateurs (super_admin, admin, user)
4. **produits** - Produits en stock
5. **categories** - Catégories de produits
6. **clients** - Clients du magasin
7. **fournisseurs** - Fournisseurs
8. **ventes** - Transactions de vente
9. **lignes_vente** - Détails des produits vendus
10. **mouvements_stock** - Historique des mouvements de stock
11. **commandes_fournisseurs** - Commandes aux fournisseurs
12. **lignes_commande** - Détails des commandes
13. **paiements** - Paiements des abonnements
14. **logs_activite** - Journal d'activité (audit)

---

## 🔐 SÉCURITÉ ET ISOLATION

### Multi-Tenant (Isolation des Données)
- ✅ Chaque magasin ne voit QUE ses propres données
- ✅ Les requêtes sont automatiquement filtrées par `magasin_id`
- ✅ Le Super Admin peut voir tous les magasins mais pas leurs données opérationnelles
- ✅ Impossible d'accéder aux données d'un autre magasin

### Authentification
- ✅ JWT (JSON Web Tokens) avec refresh tokens
- ✅ Mots de passe hashés avec bcrypt
- ✅ Expiration des tokens (1h access, 7j refresh)
- ✅ Rate limiting (protection contre les attaques)

### Permissions Granulaires
- ✅ Système de permissions par module.action
- ✅ Les Users ont des permissions limitées
- ✅ Les Admins ont tous les droits sur leur magasin
- ✅ Les Super Admins ont tous les droits sur la plateforme

---

## 📦 LES TROIS PLANS D'ABONNEMENT

### Plan Basique - 2,000 DH/mois
- 👥 **Utilisateurs max:** 2
- 📦 **Produits max:** 500
- ✅ Rapports basiques
- ✅ Alertes stock

### Plan Standard - 3,000 DH/mois
- 👥 **Utilisateurs max:** 5
- 📦 **Produits max:** 2,000
- ✅ Rapports basiques
- ✅ Rapports avancés
- ✅ Alertes stock
- ✅ Gestion fournisseurs
- ✅ Factures

### Plan Premium - 4,000 DH/mois
- 👥 **Utilisateurs max:** 99 (illimité)
- 📦 **Produits max:** Illimité
- ✅ Toutes les fonctionnalités du Standard
- ✅ Multi-magasins
- ✅ API access
- ✅ Support prioritaire
- ✅ Tout inclus

---

## 🎨 INTERFACE UTILISATEUR

### Technologies Frontend:
- React + TypeScript
- Tailwind CSS (design moderne)
- React Router (navigation)
- Axios (appels API)
- React Hot Toast (notifications)
- Recharts (graphiques)

### Technologies Backend:
- Node.js + Express
- TypeScript
- PostgreSQL (base de données)
- JWT (authentification)
- Bcrypt (hashage mots de passe)
- Multer (upload fichiers)
- Cloudinary (stockage images)

---

## 📱 PAGES ET ROUTES

### Super Admin:
- `/super-admin/dashboard` - Dashboard global
- `/super-admin/magasins` - Liste des magasins
- `/super-admin/magasins/:id` - Détails d'un magasin
- `/super-admin/plans` - Gestion des plans
- `/super-admin/paiements` - Gestion des paiements

### Admin:
- `/admin/dashboard` - Dashboard magasin
- `/admin/produits` - Liste des produits
- `/admin/produits/nouveau` - Créer un produit
- `/admin/produits/:id/edit` - Modifier un produit
- `/admin/ventes` - Liste des ventes
- `/admin/ventes/:id` - Détails d'une vente
- `/admin/pos` - Point de vente (caisse)
- `/admin/stock` - Mouvements de stock
- `/admin/clients` - Liste des clients
- `/admin/fournisseurs` - Liste des fournisseurs
- `/admin/users` - Gestion des utilisateurs
- `/admin/rapports` - Rapports et statistiques
- `/admin/documents` - Documents (factures, devis, BL)

### User:
- `/dashboard` - Dashboard limité (selon permissions)

---

## 🔄 FLUX DE TRAVAIL TYPIQUE

### Pour le Super Admin:
1. Créer un nouveau plan d'abonnement
2. Créer un nouveau magasin (client)
3. Assigner un plan au magasin
4. Créer le compte Admin pour le magasin
5. Le magasin peut maintenant utiliser la plateforme
6. Suivre les paiements et renouvellements

### Pour l'Admin d'un magasin:
1. Se connecter avec le compte créé par le Super Admin
2. Créer des produits
3. Gérer le stock (entrées, sorties)
4. Créer des clients et fournisseurs
5. Utiliser le POS pour les ventes
6. Créer des utilisateurs avec permissions limitées
7. Consulter les rapports et statistiques

### Pour un User:
1. Se connecter avec le compte créé par l'Admin
2. Utiliser les fonctionnalités selon ses permissions
3. Généralement: utiliser le POS pour les ventes, voir le stock, etc.

---

## 📈 STATISTIQUES ET RAPPORTS DISPONIBLES

### Super Admin:
- Nombre de magasins par statut
- Revenus mensuels
- Abonnements qui expirent bientôt
- Évolution des inscriptions

### Admin:
- CA du jour/semaine/mois
- Nombre de ventes
- Alertes stock (rupture, seuil, péremption)
- Top produits
- Graphiques de ventes
- Rapports détaillés par période
- Rapports financiers
- Rapports de stock

---

## 🚀 FONCTIONNALITÉS AVANCÉES

### Gestion Multi-Tenant:
- Isolation complète des données par magasin
- Chaque magasin est indépendant
- Le Super Admin gère la plateforme, pas les données des magasins

### Système de Permissions:
- Permissions granulaires par module.action
- L'Admin définit ce que chaque User peut faire
- Exemples: User peut vendre mais pas modifier les prix

### Journal d'Activité:
- Toutes les actions sont enregistrées
- Qui a fait quoi, quand
- Traçabilité complète

### Alertes Automatiques:
- Stock en rupture
- Stock sous le seuil minimum
- Produits proches de péremption
- Abonnements qui expirent

---

## 📝 NOTES IMPORTANTES

1. **Sécurité:** Les mots de passe sont hashés, les tokens expirent, rate limiting activé
2. **Isolation:** Impossible d'accéder aux données d'un autre magasin
3. **Permissions:** Les Users ont des droits limités définis par l'Admin
4. **Plans:** Les limites (utilisateurs, produits) sont vérifiées automatiquement
5. **Abonnements:** Les magasins peuvent être suspendus si l'abonnement expire

---

## 🎯 RÉSUMÉ RAPIDE

| Rôle | Accès | Principales Fonctions |
|------|-------|----------------------|
| **Super Admin** | Plateforme entière | Gère les magasins, plans, paiements |
| **Admin** | Son magasin uniquement | Gère produits, ventes, stock, clients, fournisseurs, users |
| **User** | Selon permissions | Utilise le POS, voit le stock (selon permissions) |

---

**C'est tout! Vous avez maintenant une vue complète de l'application Gestilog! 🎉**

