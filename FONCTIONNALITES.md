# 📋 Liste Complète des Fonctionnalités - Gestilog

## 🎯 Vue d'ensemble

Cette application de gestion de magasin (ERP) propose trois niveaux d'utilisateurs avec des permissions et fonctionnalités différentes.

---

## 👑 SUPER ADMIN

Le Super Admin gère l'ensemble de la plateforme, les magasins, les plans d'abonnement et les paiements.

### 📊 Module : Dashboard / Statistiques

#### Statistiques Globales
- **Vue d'ensemble des magasins**
  - Nombre total de magasins
  - Nombre de magasins par statut (actif, suspendu, expiré)
  - Revenus du mois en cours
  - Revenus du mois précédent
  - Comparaison des revenus (évolution)

#### Gestion des Abonnements
- **Rappels d'expiration**
  - Liste des abonnements qui expirent dans les 7 prochains jours
  - Affichage des jours restants avec alertes colorées (rouge ≤0 jours, orange 1-3 jours, jaune 4-7 jours)
  - Liste des abonnements déjà expirés avec jours écoulés
- **Mise à jour automatique des statuts**
  - Mise à jour automatique au démarrage du serveur
  - Mise à jour automatique toutes les heures
  - Mise à jour manuelle via endpoint dédié

### 🏪 Module : Gestion des Magasins

#### Liste des Magasins
- **Consultation**
  - Liste paginée de tous les magasins
  - Recherche par nom ou email
  - Filtrage par statut (actif, suspendu, expiré)
  - Affichage des informations principales :
    - Nom du magasin
    - Email
    - Plan d'abonnement
    - Statut
    - Date d'expiration avec jours restants (alertes colorées)
    - Date de création

#### Détails d'un Magasin
- **Informations complètes**
  - Toutes les informations du magasin
  - Plan d'abonnement associé
  - Statistiques détaillées :
    - Nombre d'utilisateurs
    - Nombre de produits
    - Nombre de ventes
    - Chiffre d'affaires total

#### Création de Magasin
- **Formulaire de création**
  - Nom du magasin
  - Adresse
  - Téléphone
  - Email (unique)
  - ICE (Identifiant Commun de l'Entreprise)
  - RC (Registre de Commerce)
  - Plan d'abonnement
  - Date d'expiration de l'abonnement
  - Notes

#### Modification de Magasin
- **Mise à jour des informations**
  - Modification de tous les champs (sauf email si déjà utilisé par un autre magasin)
  - Validation de l'unicité de l'email
  - Mise à jour du statut
  - Modification de la date d'expiration
  - Modification du plan d'abonnement

#### Suppression de Magasin
- **Suppression sécurisée**
  - Vérification des statistiques avant suppression
  - Affichage des données liées (utilisateurs, produits, ventes)
  - Confirmation requise
  - Suppression en cascade des données associées

#### Création d'Admin pour un Magasin
- **Création automatique d'administrateur**
  - Création d'un compte administrateur lors de la création d'un magasin
  - Ou création d'un admin supplémentaire pour un magasin existant

### 💳 Module : Plans d'Abonnement

#### Liste des Plans
- **Consultation**
  - Liste de tous les plans disponibles
  - Informations affichées :
    - Nom du plan
    - Prix mensuel
    - Nombre d'utilisateurs maximum
    - Nombre de produits maximum
    - Fonctionnalités incluses
    - Statut (actif/inactif)

#### Création de Plan
- **Nouveau plan**
  - Nom du plan
  - Prix mensuel
  - Limites d'utilisateurs
  - Limites de produits
  - Configuration des fonctionnalités (JSONB)

#### Modification de Plan
- **Mise à jour**
  - Modification de tous les paramètres
  - Activation/Désactivation

#### Suppression de Plan
- **Suppression**
  - Vérification des magasins utilisant le plan
  - Suppression si aucun magasin n'utilise le plan

### 💰 Module : Paiements

#### Liste des Paiements
- **Consultation**
  - Liste de tous les paiements
  - Filtrage par magasin
  - Filtrage par statut (payé, en attente, échoué)
  - Filtrage par période
  - Informations affichées :
    - Magasin
    - Montant
    - Date de paiement
    - Méthode de paiement
    - Statut
    - Période couverte
    - Référence

#### Création de Paiement
- **Enregistrement**
  - Sélection du magasin
  - Montant
  - Date de paiement
  - Méthode de paiement
  - Période de début et fin
  - Référence
  - Notes

---

## 🛠️ ADMIN D'UN MAGASIN

L'Admin d'un magasin a tous les droits sur son magasin et peut gérer les employés.

### 📊 Module : Dashboard

#### Statistiques en Temps Réel
- **CA (Chiffre d'Affaires)**
  - CA du jour (exclut les ventes à crédit, inclut les paiements de crédit)
  - CA de la semaine
  - CA du mois
  - Nombre de ventes du jour

#### Alertes Stock
- **Produits en alerte**
  - Nombre de produits en rupture de stock
  - Nombre de produits en seuil minimum
  - Nombre de produits en péremption (30 jours)

#### Top Produits
- **Meilleurs produits du mois**
  - Top 10 des produits les plus vendus
  - Quantité vendue
  - CA généré par produit

#### Évolution des Ventes
- **Graphique d'évolution**
  - Évolution du CA sur 7 derniers jours
  - Nombre de ventes par jour
  - Graphique visuel

### 🛍️ Module : Point de Vente (POS)

#### Recherche de Produits
- **Recherche avancée**
  - Recherche par nom
  - Recherche par code-barres (exact ou partiel)
  - Recherche par référence
  - Recherche dès 1 caractère saisi
  - Affichage des résultats en temps réel

#### Gestion du Panier
- **Ajout de produits**
  - Ajout multiple de produits sans vider la liste
  - Affichage continu des produits disponibles
- **Modification des quantités**
  - Incrémentation/Décrémentation (+1/-1)
  - Saisie manuelle directe (sélection automatique du champ)
  - Validation au blur (suppression si quantité = 0)
- **Modification des prix**
  - Saisie manuelle directe du prix unitaire
  - Modification en temps réel
- **Gestion de la TVA**
  - TVA par défaut à 0%
  - Modification manuelle de la TVA par ligne (0-100%)
  - Calcul automatique du montant TTC avec TVA
- **Remise globale**
  - Application d'une remise en pourcentage sur le total
  - Calcul automatique

#### Recherche de Clients
- **Recherche par lettre**
  - Recherche dès 1 caractère
  - Affichage des clients correspondants
  - Sélection d'un client
  - Affichage du crédit existant du client
  - Affichage du crédit autorisé
  - Validation du crédit autorisé avant validation de la vente

#### Paiement du Crédit Client
- **Paiement du crédit existant**
  - Bouton "Payer le crédit" si le client a un solde > 0
  - Formulaire de paiement (affiché après clic)
  - Modes de paiement disponibles :
    - Espèces
    - Carte bancaire
    - Chèque (avec numéro et date)
    - Virement bancaire
  - Enregistrement dans le tableau des ventes
  - Mise à jour automatique du solde client

#### Modes de Paiement
- **Espèces**
  - Saisie du montant reçu
  - Validation : montant reçu ≥ total
  - Calcul automatique de la monnaie à rendre
- **Carte bancaire**
  - Saisie optionnelle de la référence (n° transaction)
- **Chèque**
  - Saisie obligatoire du numéro de chèque
  - Saisie obligatoire de la date du chèque
  - Alerte si chèque à date future (traité comme crédit)
  - Enregistrement dans le module de gestion des chèques
- **Virement bancaire**
  - Saisie optionnelle de la référence (n° virement)
- **Crédit**
  - Sélection obligatoire d'un client
  - Saisie du montant payé (optionnel)
  - Calcul automatique du reste à payer
  - Vérification du crédit autorisé
  - Ajout du reste au solde du client
  - Exclusion du CA (argent non reçu)

#### Type de Document
- **Type fixe**
  - Uniquement "Ticket" (pas de facture, devis, BL)

#### Finalisation de la Vente
- **Validation**
  - Vérification du stock disponible
  - Vérification du crédit autorisé (si crédit)
  - Enregistrement de la vente
  - Mise à jour automatique du stock
  - Mise à jour du solde client (si crédit)
  - Réinitialisation du panier

### 📦 Module : Produits

#### Liste des Produits
- **Consultation**
  - Liste paginée de tous les produits
  - Recherche par nom, code-barres, référence
  - Filtrage par catégorie
  - Filtrage par statut (actif/inactif)
  - Informations affichées :
    - Nom
    - Code-barres
    - Référence
    - Catégorie
    - Prix d'achat
    - Prix de vente
    - Stock actuel
    - Stock minimum
    - Unité
    - Statut

#### Détails d'un Produit
- **Informations complètes**
  - Toutes les informations du produit
  - Historique des mouvements de stock
  - Historique des ventes

#### Création de Produit
- **Formulaire de création**
  - Nom (obligatoire)
  - Code-barres
  - Référence
  - Catégorie (sélection)
  - Description
  - Prix d'achat
  - Prix de vente (obligatoire)
  - Stock actuel
  - Stock minimum
  - Unité (unité, kg, litre, etc.)
  - Emplacement
  - Image (URL)
  - Date de péremption
  - Statut (actif/inactif)

#### Modification de Produit
- **Mise à jour**
  - Modification de tous les champs
  - Mise à jour du stock
  - Modification des prix

#### Suppression de Produit
- **Suppression**
  - Vérification des ventes associées
  - Suppression si aucune vente

#### Alertes Stock
- **Consultation des alertes**
  - Produits en rupture (stock = 0)
  - Produits en seuil minimum (stock ≤ stock_min)
  - Produits en péremption (30 jours)

### 📊 Module : Stock

#### Mouvements de Stock
- **Consultation**
  - Liste de tous les mouvements
  - Filtrage par type (entrée, sortie, ajustement)
  - Filtrage par produit
  - Filtrage par date
  - Informations affichées :
    - Date
    - Type
    - Produit
    - Quantité
    - Prix unitaire
    - Fournisseur (si entrée)
    - Utilisateur
    - Motif

#### Entrée de Stock
- **Ajout de stock**
  - Sélection du produit
  - Quantité
  - Prix d'achat unitaire
  - Fournisseur (optionnel)
  - Référence document (BL, facture)
  - Motif
  - Mise à jour automatique du stock

#### Sortie de Stock
- **Retrait de stock**
  - Sélection du produit
  - Quantité
  - Motif
  - Mise à jour automatique du stock

#### Ajustement de Stock
- **Correction de stock**
  - Sélection du produit
  - Nouvelle quantité
  - Motif de l'ajustement
  - Mise à jour automatique du stock

### 💰 Module : Ventes

#### Liste des Ventes
- **Consultation**
  - Liste paginée de toutes les ventes
  - Recherche par numéro de vente
  - Filtrage par type de document
  - Filtrage par statut (valide, annulé, brouillon)
  - Filtrage par date
  - Informations affichées :
    - Numéro de vente
    - Date
    - Type de document
    - Client
    - Utilisateur
    - Montant TTC
    - Mode de paiement
    - Référence paiement (si disponible)
    - Statut

#### Détails d'une Vente
- **Informations complètes**
  - Toutes les informations de la vente
  - Liste des lignes de vente (produits)
  - Détails du paiement :
    - Mode de paiement
    - Référence (chèque, transaction, virement)
    - Date du chèque (si chèque)
    - Statut du chèque (si chèque)
    - Montant payé (si crédit)
    - Reste à payer (si crédit)
  - Informations client
  - Informations utilisateur

#### Création de Vente
- **Via POS uniquement**
  - Toutes les ventes sont créées via le module POS

#### Annulation de Vente
- **Annulation**
  - Annulation d'une vente valide
  - Restauration automatique du stock
  - Gestion spéciale pour paiements de crédit :
    - Remise du montant au solde du client
  - Gestion spéciale pour ventes à crédit :
    - Retrait du crédit ajouté du solde client
  - Enregistrement du motif d'annulation

### 👥 Module : Clients

#### Liste des Clients
- **Consultation**
  - Liste paginée de tous les clients
  - Recherche par nom, téléphone, email
  - Informations affichées :
    - Nom
    - Téléphone
    - Email
    - Adresse
    - Crédit autorisé
    - Solde actuel (avec indication visuelle si > 0)
    - Bouton "Payer le crédit" si solde > 0

#### Détails d'un Client
- **Informations complètes**
  - Toutes les informations du client
  - Historique des ventes
  - Historique des paiements

#### Création de Client
- **Formulaire de création**
  - Nom (obligatoire)
  - Téléphone
  - Email
  - Adresse
  - ICE
  - Crédit autorisé
  - Notes

#### Modification de Client
- **Mise à jour**
  - Modification de tous les champs
  - Modification du crédit autorisé

#### Suppression de Client
- **Suppression (Admin uniquement)**
  - Vérification des ventes associées
  - Mise à jour des ventes (client_id = NULL)
  - Suppression du client

#### Paiement du Crédit Client
- **Enregistrement d'un paiement**
  - Depuis la liste des clients
  - Modal de paiement
  - Modes de paiement disponibles :
    - Espèces
    - Carte bancaire
    - Chèque (avec numéro et date)
    - Virement bancaire
  - Enregistrement dans le tableau des ventes
  - Mise à jour automatique du solde

### 🏢 Module : Fournisseurs

#### Liste des Fournisseurs
- **Consultation**
  - Liste paginée de tous les fournisseurs
  - Recherche par nom, contact, téléphone
  - Informations affichées :
    - Nom
    - Contact
    - Téléphone
    - Email
    - Adresse
    - Ville
    - ICE

#### Détails d'un Fournisseur
- **Informations complètes**
  - Toutes les informations du fournisseur
  - Historique des entrées de stock

#### Création de Fournisseur
- **Formulaire de création**
  - Nom (obligatoire)
  - Nom du contact
  - Téléphone
  - Email
  - Adresse
  - ICE
  - Ville
  - Notes

#### Modification de Fournisseur
- **Mise à jour**
  - Modification de tous les champs

#### Suppression de Fournisseur
- **Suppression (Admin uniquement)**
  - Vérification des entrées de stock associées
  - Suppression si aucune entrée

### 📄 Module : Documents / Chèques

#### Liste des Documents
- **Consultation**
  - Liste de tous les documents (ventes)
  - Filtrage par type (ticket, facture, devis, BL, paiement_credit)
  - Recherche
  - Actions :
    - Impression
    - Envoi par email

#### Gestion des Chèques
- **Liste des chèques**
  - Statistiques :
    - Total des chèques
    - En attente
    - Déposés
    - Payés
    - Impayés
    - Prêts pour dépôt (date arrivée)
  - Recherche par numéro, vente, client
  - Filtrage par statut
  - Informations affichées :
    - Numéro de chèque
    - Numéro de vente
    - Client
    - Date du chèque
    - Montant
    - Statut
    - Indication "Prêt dépôt" si date arrivée
  - Actions :
    - Marquer comme déposé
    - Marquer comme payé
    - Marquer comme impayé

### 📊 Module : Rapports

#### Rapport de Ventes
- **Analyse des ventes**
  - Groupement par jour, semaine, mois
  - Filtrage par période
  - Métriques :
    - Nombre de ventes
    - Total HT
    - Total TVA
    - Total TTC
  - Graphiques :
    - Évolution des ventes
    - Ventes par catégorie
    - Ventes par utilisateur
    - Top produits

#### Rapport Financier
- **Analyse financière**
  - Filtrage par période
  - Métriques :
    - CA total (HT, TVA, TTC)
    - Coût d'achat
    - Marge brute
    - Taux de marge
    - Créances clients (total des soldes)
  - Graphiques visuels

#### Rapport Stock
- **Analyse du stock**
  - Filtrage par période
  - Métriques :
    - Valeur du stock actuel
    - Produits en rupture
    - Produits en seuil minimum
    - Produits en péremption
  - Graphiques

### 👤 Module : Utilisateurs (Employés)

#### Liste des Utilisateurs
- **Consultation (Admin uniquement)**
  - Liste de tous les utilisateurs du magasin
  - Informations affichées :
    - Nom et prénom
    - Email
    - Rôle
    - Statut (actif/inactif)
    - Dernière connexion

#### Détails d'un Utilisateur
- **Informations complètes**
  - Toutes les informations
  - Permissions détaillées

#### Création d'Utilisateur
- **Formulaire de création (Admin uniquement)**
  - Nom
  - Prénom
  - Email (unique)
  - Mot de passe
  - Rôle (user uniquement)
  - Permissions détaillées par module :
    - Ventes (consulter, créer, modifier, supprimer, remises, voir prix achat)
    - Produits (consulter, créer, modifier, supprimer, modifier prix, importer/exporter)
    - Stock (consulter, entrées, sorties, ajustements, inventaire)
    - Clients (consulter, gérer, voir soldes, paiements)
    - Fournisseurs (consulter, gérer)
    - Rapports (ventes, financiers, stock)

#### Modification d'Utilisateur
- **Mise à jour (Admin uniquement)**
  - Modification des informations
  - Modification des permissions
  - Activation/Désactivation

#### Suppression d'Utilisateur
- **Suppression (Admin uniquement)**
  - Vérification des ventes associées
  - Suppression si aucune vente

---

## 👨‍💼 EMPLOYÉ (USER)

L'employé a des permissions limitées définies par l'admin du magasin.

### 📊 Module : Dashboard

#### Statistiques (selon permissions)
- **Accès limité**
  - CA du jour (si permission ventes.consulter)
  - Alertes stock (si permission stock.consulter)
  - Top produits (si permission ventes.consulter)

### 🛍️ Module : Point de Vente (POS)

#### Accès selon permissions
- **Création de ventes**
  - Si permission `ventes.creer` : accès complet au POS
  - Toutes les fonctionnalités du POS (comme admin)
  - Application de remises (si permission `ventes.remises`)
  - Voir prix d'achat (si permission `ventes.voir_prix_achat`)

### 📦 Module : Produits

#### Consultation (si permission `produits.consulter`)
- **Liste des produits**
  - Accès en lecture seule ou modification selon permissions

#### Création (si permission `produits.creer`)
- **Ajout de produits**
  - Formulaire complet de création

#### Modification (si permission `produits.modifier`)
- **Mise à jour des produits**
  - Modification des informations
  - Modification des prix (si permission `produits.modifier_prix`)

#### Suppression (si permission `produits.supprimer`)
- **Suppression de produits**

### 📊 Module : Stock

#### Consultation (si permission `stock.consulter`)
- **Mouvements de stock**
  - Consultation de l'historique

#### Entrées (si permission `stock.entrees`)
- **Ajout de stock**
  - Création d'entrées de stock

#### Sorties (si permission `stock.sorties`)
- **Retrait de stock**
  - Création de sorties de stock

#### Ajustements (si permission `stock.ajustements`)
- **Correction de stock**
  - Création d'ajustements

### 💰 Module : Ventes

#### Consultation (si permission `ventes.consulter`)
- **Liste des ventes**
  - Consultation de toutes les ventes

#### Création (si permission `ventes.creer`)
- **Création de ventes**
  - Accès au POS

#### Modification (si permission `ventes.modifier`)
- **Modification de ventes**
  - Modification des informations

#### Annulation (si permission `ventes.supprimer`)
- **Annulation de ventes**
  - Annulation avec restauration du stock

#### Remises (si permission `ventes.remises`)
- **Application de remises**
  - Remises dans le POS

### 👥 Module : Clients

#### Consultation (si permission `clients.consulter`)
- **Liste des clients**
  - Consultation des clients

#### Gestion (si permission `clients.gerer`)
- **Création et modification**
  - Création de clients
  - Modification des informations

#### Voir Soldes (si permission `clients.voir_soldes`)
- **Affichage des soldes**
  - Voir le crédit des clients

#### Paiements (si permission `clients.paiements`)
- **Enregistrement de paiements**
  - Paiement du crédit client
  - Enregistrement de paiements

### 🏢 Module : Fournisseurs

#### Consultation (si permission `fournisseurs.consulter`)
- **Liste des fournisseurs**
  - Consultation des fournisseurs

#### Gestion (si permission `fournisseurs.gerer`)
- **Création et modification**
  - Création de fournisseurs
  - Modification des informations

### 📊 Module : Rapports

#### Rapports Ventes (si permission `rapports.ventes`)
- **Analyse des ventes**
  - Rapport de ventes
  - Ventes par catégorie
  - Ventes par utilisateur
  - Top produits

#### Rapports Financiers (si permission `rapports.financiers`)
- **Analyse financière**
  - Rapport financier complet

#### Rapports Stock (si permission `rapports.stock`)
- **Analyse du stock**
  - Rapport stock

---

## 🔐 Système de Permissions

### Structure des Permissions

Les permissions sont organisées par module et action :
- Format : `module.action`
- Exemple : `ventes.consulter`, `produits.creer`

### Modules Disponibles

1. **ventes**
   - consulter
   - creer
   - modifier
   - supprimer
   - remises
   - voir_prix_achat

2. **produits**
   - consulter
   - creer
   - modifier
   - supprimer
   - modifier_prix
   - importer_exporter

3. **stock**
   - consulter
   - entrees
   - sorties
   - ajustements
   - inventaire

4. **clients**
   - consulter
   - gerer
   - voir_soldes
   - paiements

5. **fournisseurs**
   - consulter
   - gerer

6. **rapports**
   - ventes
   - financiers
   - stock

### Règles de Permissions

- **Super Admin** : Accès total à tout
- **Admin** : Accès total à son magasin
- **User** : Accès selon permissions définies par l'admin

---

## 🔄 Fonctionnalités Transversales

### Gestion du Crédit Client
- Affichage du solde dans le POS
- Validation du crédit autorisé avant vente
- Paiement du crédit avec tous les modes de paiement
- Enregistrement dans les ventes
- Exclusion des ventes à crédit du CA (argent non reçu)
- Inclusion des paiements de crédit dans le CA (argent reçu)

### Gestion des Chèques
- Enregistrement de la date du chèque
- Gestion des statuts (en_attente, déposé, payé, impayé)
- Identification des chèques prêts pour dépôt
- Traitement des chèques à date future comme crédit
- Module dédié de gestion des chèques

### Calcul du CA (Chiffre d'Affaires)
- Exclusion des ventes à crédit (argent non reçu)
- Inclusion des paiements de crédit (argent reçu)
- Exclusion des chèques impayés (si implémenté)
- Calculs automatiques dans tous les rapports

### Gestion Multi-Tenant
- Isolation complète des données par magasin
- Chaque magasin voit uniquement ses données
- Super admin peut voir tous les magasins

### Logs d'Activité
- Enregistrement de toutes les actions importantes
- Traçabilité complète
- Informations : utilisateur, action, entité, détails, IP, date

### Sécurité
- Authentification JWT
- Hashage des mots de passe (bcrypt)
- Validation des permissions à chaque requête
- Isolation des données par magasin
- Protection CSRF (helmet)

---

## 📝 Notes Importantes

1. **Toutes les fonctionnalités listées sont implémentées et fonctionnelles**
2. **Les permissions sont granulaires et permettent un contrôle fin des accès**
3. **Le système de crédit est complet avec validation et gestion des paiements**
4. **La gestion des chèques inclut le suivi complet du cycle de vie**
5. **Les rapports excluent automatiquement les opérations non monétisées du CA**

---

*Document généré le : $(date)*
*Version de l'application : 1.0*




