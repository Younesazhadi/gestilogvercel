# ✅ Plan de Tests - Gestilog

Ce document permet de tester systématiquement toutes les fonctionnalités de l'application pour s'assurer qu'elles fonctionnent correctement.

**Instructions :**
- Cocher chaque case (☐) après avoir testé la fonctionnalité
- Noter les problèmes éventuels dans la section "Notes"
- Tester dans l'ordre logique (Super Admin → Admin → Employé)

---

## 👑 SUPER ADMIN

### 📊 Module : Dashboard / Statistiques

#### Statistiques Globales
- [ ] **Affichage du nombre total de magasins**
  - Vérifier que le nombre est correct
  - Notes : _________________________

- [ ] **Affichage des magasins par statut**
  - Vérifier actif, suspendu, expiré
  - Notes : _________________________

- [ ] **Affichage des revenus du mois en cours**
  - Vérifier que le montant est correct
  - Notes : _________________________

- [ ] **Affichage des revenus du mois précédent**
  - Vérifier que le montant est correct
  - Notes : _________________________

- [ ] **Comparaison des revenus (évolution)**
  - Vérifier le calcul de l'évolution
  - Notes : _________________________

#### Gestion des Abonnements
- [ ] **Affichage des abonnements qui expirent dans 7 jours**
  - Vérifier la liste
  - Vérifier les jours restants
  - Vérifier les couleurs d'alerte (rouge ≤0, orange 1-3, jaune 4-7)
  - Notes : _________________________

- [ ] **Affichage des abonnements expirés**
  - Vérifier la liste
  - Vérifier les jours écoulés
  - Notes : _________________________

- [ ] **Mise à jour automatique des statuts au démarrage**
  - Redémarrer le serveur
  - Vérifier que les statuts sont mis à jour
  - Notes : _________________________

- [ ] **Mise à jour automatique toutes les heures**
  - Attendre 1 heure ou modifier l'intervalle pour tester
  - Vérifier que les statuts sont mis à jour
  - Notes : _________________________

- [ ] **Mise à jour manuelle via endpoint**
  - Appeler l'endpoint de mise à jour
  - Vérifier que les statuts sont mis à jour
  - Notes : _________________________

### 🏪 Module : Gestion des Magasins

#### Liste des Magasins
- [ ] **Affichage de la liste paginée**
  - Vérifier la pagination
  - Notes : _________________________

- [ ] **Recherche par nom**
  - Rechercher un magasin par nom
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Recherche par email**
  - Rechercher un magasin par email
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Filtrage par statut**
  - Filtrer par actif
  - Filtrer par suspendu
  - Filtrer par expiré
  - Notes : _________________________

- [ ] **Affichage des informations principales**
  - Vérifier nom, email, plan, statut, date expiration
  - Vérifier les alertes colorées pour la date d'expiration
  - Notes : _________________________

#### Détails d'un Magasin
- [ ] **Affichage des informations complètes**
  - Vérifier toutes les informations
  - Notes : _________________________

- [ ] **Affichage des statistiques**
  - Vérifier nombre d'utilisateurs
  - Vérifier nombre de produits
  - Vérifier nombre de ventes
  - Vérifier CA total
  - Notes : _________________________

#### Création de Magasin
- [ ] **Création avec tous les champs**
  - Remplir tous les champs
  - Vérifier la création
  - Notes : _________________________

- [ ] **Validation de l'email unique**
  - Essayer de créer avec un email existant
  - Vérifier le message d'erreur
  - Notes : _________________________

- [ ] **Création avec champs optionnels vides**
  - Créer avec seulement les champs obligatoires
  - Vérifier la création
  - Notes : _________________________

#### Modification de Magasin
- [ ] **Modification de tous les champs**
  - Modifier chaque champ
  - Vérifier la sauvegarde
  - Notes : _________________________

- [ ] **Validation email unique lors de modification**
  - Modifier l'email avec un email existant
  - Vérifier le message d'erreur
  - Notes : _________________________

- [ ] **Modification du statut**
  - Changer le statut
  - Vérifier la mise à jour
  - Notes : _________________________

- [ ] **Modification de la date d'expiration**
  - Changer la date
  - Vérifier la mise à jour
  - Notes : _________________________

#### Suppression de Magasin
- [ ] **Affichage des statistiques avant suppression**
  - Vérifier l'affichage des données liées
  - Notes : _________________________

- [ ] **Suppression avec confirmation**
  - Supprimer un magasin
  - Vérifier la suppression
  - Notes : _________________________

#### Création d'Admin pour un Magasin
- [ ] **Création d'admin lors de la création du magasin**
  - Vérifier la création automatique
  - Notes : _________________________

- [ ] **Création d'admin supplémentaire**
  - Créer un admin pour un magasin existant
  - Vérifier la création
  - Notes : _________________________

### 💳 Module : Plans d'Abonnement

#### Liste des Plans
- [ ] **Affichage de tous les plans**
  - Vérifier la liste complète
  - Notes : _________________________

#### Création de Plan
- [ ] **Création avec tous les paramètres**
  - Créer un nouveau plan
  - Vérifier la création
  - Notes : _________________________

#### Modification de Plan
- [ ] **Modification des paramètres**
  - Modifier un plan
  - Vérifier la mise à jour
  - Notes : _________________________

#### Suppression de Plan
- [ ] **Suppression si aucun magasin n'utilise le plan**
  - Supprimer un plan non utilisé
  - Vérifier la suppression
  - Notes : _________________________

- [ ] **Impossibilité de supprimer un plan utilisé**
  - Essayer de supprimer un plan utilisé
  - Vérifier le message d'erreur
  - Notes : _________________________

### 💰 Module : Paiements

#### Liste des Paiements
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Filtrage par magasin**
  - Filtrer par magasin
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Filtrage par statut**
  - Filtrer par statut
  - Vérifier les résultats
  - Notes : _________________________

#### Création de Paiement
- [ ] **Enregistrement d'un paiement**
  - Créer un paiement
  - Vérifier l'enregistrement
  - Notes : _________________________

---

## 🛠️ ADMIN D'UN MAGASIN

### 📊 Module : Dashboard

#### Statistiques en Temps Réel
- [ ] **CA du jour**
  - Vérifier le calcul (exclut crédits, inclut paiements crédit)
  - Notes : _________________________

- [ ] **CA de la semaine**
  - Vérifier le calcul
  - Notes : _________________________

- [ ] **CA du mois**
  - Vérifier le calcul
  - Notes : _________________________

- [ ] **Nombre de ventes du jour**
  - Vérifier le nombre
  - Notes : _________________________

#### Alertes Stock
- [ ] **Produits en rupture**
  - Vérifier le nombre
  - Notes : _________________________

- [ ] **Produits en seuil minimum**
  - Vérifier le nombre
  - Notes : _________________________

- [ ] **Produits en péremption**
  - Vérifier le nombre
  - Notes : _________________________

#### Top Produits
- [ ] **Affichage du top 10**
  - Vérifier la liste
  - Vérifier les quantités et CA
  - Notes : _________________________

#### Évolution des Ventes
- [ ] **Graphique sur 7 jours**
  - Vérifier l'affichage
  - Vérifier les données
  - Notes : _________________________

### 🛍️ Module : Point de Vente (POS)

#### Recherche de Produits
- [ ] **Recherche par nom**
  - Rechercher un produit par nom
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Recherche par code-barres (exact)**
  - Scanner/rechercher un code-barres exact
  - Vérifier le résultat
  - Notes : _________________________

- [ ] **Recherche par code-barres (partiel)**
  - Rechercher un code-barres partiel
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Recherche par référence**
  - Rechercher par référence
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Recherche dès 1 caractère**
  - Taper 1 caractère
  - Vérifier que la recherche se lance
  - Notes : _________________________

- [ ] **Affichage continu des produits**
  - Ajouter un produit au panier
  - Vérifier que la liste reste visible
  - Notes : _________________________

#### Gestion du Panier
- [ ] **Ajout de produits**
  - Ajouter plusieurs produits
  - Vérifier l'ajout
  - Notes : _________________________

- [ ] **Incrémentation quantité (+1)**
  - Cliquer sur +
  - Vérifier l'augmentation
  - Notes : _________________________

- [ ] **Décrémentation quantité (-1)**
  - Cliquer sur -
  - Vérifier la diminution
  - Notes : _________________________

- [ ] **Saisie manuelle quantité**
  - Sélectionner le champ
  - Taper directement une valeur
  - Vérifier que le champ est sélectionné automatiquement
  - Notes : _________________________

- [ ] **Suppression si quantité = 0 (on blur)**
  - Mettre quantité à 0
  - Quitter le champ (blur)
  - Vérifier la suppression
  - Notes : _________________________

- [ ] **Saisie manuelle prix**
  - Sélectionner le champ prix
  - Taper directement une valeur
  - Vérifier la mise à jour
  - Notes : _________________________

- [ ] **TVA par défaut à 0%**
  - Ajouter un produit
  - Vérifier que TVA = 0%
  - Notes : _________________________

- [ ] **Modification TVA manuelle**
  - Modifier la TVA
  - Vérifier le calcul du TTC
  - Notes : _________________________

- [ ] **Remise globale**
  - Appliquer une remise
  - Vérifier le calcul
  - Notes : _________________________

#### Recherche de Clients
- [ ] **Recherche par lettre**
  - Taper une lettre
  - Vérifier l'affichage des résultats
  - Notes : _________________________

- [ ] **Sélection d'un client**
  - Sélectionner un client
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Affichage du crédit existant**
  - Sélectionner un client avec crédit
  - Vérifier l'affichage du solde
  - Notes : _________________________

- [ ] **Affichage du crédit autorisé**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Validation crédit autorisé**
  - Faire une vente à crédit qui dépasse le crédit autorisé
  - Vérifier le message d'erreur
  - Notes : _________________________

#### Paiement du Crédit Client
- [ ] **Affichage du bouton "Payer le crédit"**
  - Sélectionner un client avec solde > 0
  - Vérifier l'affichage du bouton
  - Notes : _________________________

- [ ] **Affichage du formulaire après clic**
  - Cliquer sur "Payer le crédit"
  - Vérifier l'affichage du formulaire
  - Notes : _________________________

- [ ] **Paiement crédit en espèces**
  - Payer un crédit en espèces
  - Vérifier l'enregistrement
  - Vérifier la mise à jour du solde
  - Notes : _________________________

- [ ] **Paiement crédit par chèque**
  - Payer un crédit par chèque
  - Vérifier l'enregistrement avec date
  - Vérifier l'apparition dans le module chèques
  - Notes : _________________________

- [ ] **Paiement crédit par carte**
  - Payer un crédit par carte
  - Vérifier l'enregistrement
  - Notes : _________________________

- [ ] **Paiement crédit par virement**
  - Payer un crédit par virement
  - Vérifier l'enregistrement
  - Notes : _________________________

#### Modes de Paiement
- [ ] **Paiement espèces**
  - Faire une vente en espèces
  - Saisir montant reçu
  - Vérifier validation (≥ total)
  - Vérifier calcul monnaie à rendre
  - Notes : _________________________

- [ ] **Paiement carte**
  - Faire une vente par carte
  - Saisir référence optionnelle
  - Vérifier l'enregistrement
  - Notes : _________________________

- [ ] **Paiement chèque**
  - Faire une vente par chèque
  - Saisir numéro (obligatoire)
  - Saisir date (obligatoire)
  - Vérifier l'enregistrement
  - Vérifier l'apparition dans module chèques
  - Notes : _________________________

- [ ] **Chèque à date future**
  - Faire une vente avec chèque à date future
  - Vérifier l'alerte
  - Vérifier traitement comme crédit
  - Notes : _________________________

- [ ] **Paiement virement**
  - Faire une vente par virement
  - Saisir référence optionnelle
  - Vérifier l'enregistrement
  - Notes : _________________________

- [ ] **Paiement crédit**
  - Faire une vente à crédit
  - Sélectionner un client
  - Saisir montant payé (optionnel)
  - Vérifier calcul reste à payer
  - Vérifier mise à jour solde client
  - Vérifier exclusion du CA
  - Notes : _________________________

#### Finalisation de la Vente
- [ ] **Validation avec stock suffisant**
  - Faire une vente normale
  - Vérifier l'enregistrement
  - Vérifier mise à jour stock
  - Notes : _________________________

- [ ] **Validation avec stock insuffisant**
  - Faire une vente avec stock insuffisant
  - Vérifier le message d'erreur
  - Notes : _________________________

- [ ] **Validation avec crédit autorisé respecté**
  - Faire une vente à crédit dans la limite
  - Vérifier l'enregistrement
  - Notes : _________________________

- [ ] **Réinitialisation du panier après vente**
  - Finaliser une vente
  - Vérifier que le panier est vide
  - Notes : _________________________

### 📦 Module : Produits

#### Liste des Produits
- [ ] **Affichage de la liste paginée**
  - Vérifier la pagination
  - Notes : _________________________

- [ ] **Recherche par nom**
  - Rechercher un produit
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Recherche par code-barres**
  - Rechercher par code-barres
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Recherche par référence**
  - Rechercher par référence
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Filtrage par catégorie**
  - Filtrer par catégorie
  - Vérifier les résultats
  - Notes : _________________________

#### Création de Produit
- [ ] **Création avec tous les champs**
  - Créer un produit complet
  - Vérifier la création
  - Notes : _________________________

- [ ] **Validation champs obligatoires**
  - Essayer de créer sans nom
  - Vérifier le message d'erreur
  - Notes : _________________________

#### Modification de Produit
- [ ] **Modification des informations**
  - Modifier un produit
  - Vérifier la mise à jour
  - Notes : _________________________

#### Suppression de Produit
- [ ] **Suppression sans ventes**
  - Supprimer un produit sans ventes
  - Vérifier la suppression
  - Notes : _________________________

#### Alertes Stock
- [ ] **Affichage des produits en rupture**
  - Vérifier la liste
  - Notes : _________________________

- [ ] **Affichage des produits en seuil minimum**
  - Vérifier la liste
  - Notes : _________________________

- [ ] **Affichage des produits en péremption**
  - Vérifier la liste
  - Notes : _________________________

### 📊 Module : Stock

#### Mouvements de Stock
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Filtrage par type**
  - Filtrer par entrée, sortie, ajustement
  - Vérifier les résultats
  - Notes : _________________________

#### Entrée de Stock
- [ ] **Création d'une entrée**
  - Créer une entrée
  - Vérifier la mise à jour du stock
  - Notes : _________________________

#### Sortie de Stock
- [ ] **Création d'une sortie**
  - Créer une sortie
  - Vérifier la mise à jour du stock
  - Notes : _________________________

#### Ajustement de Stock
- [ ] **Création d'un ajustement**
  - Créer un ajustement
  - Vérifier la mise à jour du stock
  - Notes : _________________________

### 💰 Module : Ventes

#### Liste des Ventes
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Recherche par numéro**
  - Rechercher une vente
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Filtrage par type**
  - Filtrer par type de document
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Filtrage par statut**
  - Filtrer par statut
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Affichage du mode de paiement**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Affichage de la référence paiement**
  - Vérifier l'affichage
  - Notes : _________________________

#### Détails d'une Vente
- [ ] **Affichage des informations complètes**
  - Ouvrir une vente
  - Vérifier toutes les informations
  - Notes : _________________________

- [ ] **Affichage des détails paiement**
  - Vérifier mode paiement
  - Vérifier référence
  - Vérifier date chèque (si chèque)
  - Vérifier statut chèque (si chèque)
  - Vérifier montant payé (si crédit)
  - Vérifier reste à payer (si crédit)
  - Notes : _________________________

#### Annulation de Vente
- [ ] **Annulation vente normale**
  - Annuler une vente
  - Vérifier restauration stock
  - Notes : _________________________

- [ ] **Annulation paiement crédit**
  - Annuler un paiement de crédit
  - Vérifier remise du montant au solde client
  - Notes : _________________________

- [ ] **Annulation vente à crédit**
  - Annuler une vente à crédit
  - Vérifier retrait du crédit du solde client
  - Vérifier restauration stock
  - Notes : _________________________

### 👥 Module : Clients

#### Liste des Clients
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Recherche**
  - Rechercher un client
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Affichage du solde**
  - Vérifier l'affichage
  - Vérifier indication visuelle si > 0
  - Notes : _________________________

- [ ] **Bouton "Payer le crédit"**
  - Vérifier l'affichage si solde > 0
  - Notes : _________________________

#### Création de Client
- [ ] **Création avec tous les champs**
  - Créer un client
  - Vérifier la création
  - Notes : _________________________

#### Modification de Client
- [ ] **Modification des informations**
  - Modifier un client
  - Vérifier la mise à jour
  - Notes : _________________________

#### Paiement du Crédit (depuis liste)
- [ ] **Paiement depuis la liste**
  - Cliquer sur "Payer"
  - Remplir le formulaire
  - Vérifier l'enregistrement
  - Vérifier mise à jour solde
  - Notes : _________________________

### 🏢 Module : Fournisseurs

#### Liste des Fournisseurs
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

#### Création de Fournisseur
- [ ] **Création**
  - Créer un fournisseur
  - Vérifier la création
  - Notes : _________________________

#### Modification de Fournisseur
- [ ] **Modification**
  - Modifier un fournisseur
  - Vérifier la mise à jour
  - Notes : _________________________

### 📄 Module : Documents / Chèques

#### Liste des Documents
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Filtrage par type**
  - Filtrer par type
  - Vérifier les résultats
  - Notes : _________________________

#### Gestion des Chèques
- [ ] **Affichage des statistiques**
  - Vérifier total, en attente, déposé, payé, impayé
  - Notes : _________________________

- [ ] **Recherche de chèques**
  - Rechercher un chèque
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Filtrage par statut**
  - Filtrer par statut
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Indication "Prêt dépôt"**
  - Vérifier l'affichage pour chèques à date arrivée
  - Notes : _________________________

- [ ] **Marquer comme déposé**
  - Changer le statut
  - Vérifier la mise à jour
  - Notes : _________________________

- [ ] **Marquer comme payé**
  - Changer le statut
  - Vérifier la mise à jour
  - Notes : _________________________

- [ ] **Marquer comme impayé**
  - Changer le statut
  - Vérifier la mise à jour
  - Notes : _________________________

- [ ] **Affichage des chèques de paiement crédit**
  - Vérifier que les chèques de paiement crédit apparaissent
  - Notes : _________________________

### 📊 Module : Rapports

#### Rapport de Ventes
- [ ] **Génération du rapport**
  - Générer un rapport
  - Vérifier les données
  - Notes : _________________________

- [ ] **Filtrage par période**
  - Filtrer par dates
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Groupement par jour/semaine/mois**
  - Tester chaque groupement
  - Vérifier les résultats
  - Notes : _________________________

- [ ] **Graphiques**
  - Vérifier l'affichage des graphiques
  - Notes : _________________________

#### Rapport Financier
- [ ] **Génération du rapport**
  - Générer un rapport
  - Vérifier les données
  - Notes : _________________________

- [ ] **Vérification du CA**
  - Vérifier que les crédits sont exclus
  - Vérifier que les paiements crédit sont inclus
  - Notes : _________________________

- [ ] **Calcul de la marge**
  - Vérifier le calcul
  - Notes : _________________________

#### Rapport Stock
- [ ] **Génération du rapport**
  - Générer un rapport
  - Vérifier les données
  - Notes : _________________________

### 👤 Module : Utilisateurs (Employés)

#### Liste des Utilisateurs
- [ ] **Affichage de la liste**
  - Vérifier l'affichage
  - Notes : _________________________

#### Création d'Utilisateur
- [ ] **Création avec permissions**
  - Créer un utilisateur
  - Définir les permissions
  - Vérifier la création
  - Notes : _________________________

#### Modification d'Utilisateur
- [ ] **Modification des permissions**
  - Modifier les permissions
  - Vérifier la mise à jour
  - Notes : _________________________

---

## 👨‍💼 EMPLOYÉ (USER)

### Test des Permissions

#### Module Ventes
- [ ] **Permission consulter**
  - Se connecter avec user ayant cette permission
  - Vérifier accès à la liste des ventes
  - Notes : _________________________

- [ ] **Permission créer**
  - Vérifier accès au POS
  - Notes : _________________________

- [ ] **Permission modifier**
  - Vérifier possibilité de modifier
  - Notes : _________________________

- [ ] **Permission supprimer**
  - Vérifier possibilité d'annuler
  - Notes : _________________________

- [ ] **Permission remises**
  - Vérifier possibilité d'appliquer remises
  - Notes : _________________________

- [ ] **Sans permission**
  - Se connecter sans permission
  - Vérifier refus d'accès
  - Notes : _________________________

#### Module Produits
- [ ] **Permission consulter**
  - Vérifier accès en lecture
  - Notes : _________________________

- [ ] **Permission créer**
  - Vérifier possibilité de créer
  - Notes : _________________________

- [ ] **Permission modifier**
  - Vérifier possibilité de modifier
  - Notes : _________________________

- [ ] **Permission modifier_prix**
  - Vérifier possibilité de modifier prix
  - Notes : _________________________

#### Module Stock
- [ ] **Permission consulter**
  - Vérifier accès aux mouvements
  - Notes : _________________________

- [ ] **Permission entrees**
  - Vérifier possibilité de créer entrées
  - Notes : _________________________

- [ ] **Permission sorties**
  - Vérifier possibilité de créer sorties
  - Notes : _________________________

#### Module Clients
- [ ] **Permission consulter**
  - Vérifier accès à la liste
  - Notes : _________________________

- [ ] **Permission gerer**
  - Vérifier possibilité de créer/modifier
  - Notes : _________________________

- [ ] **Permission paiements**
  - Vérifier possibilité d'enregistrer paiements
  - Notes : _________________________

#### Module Rapports
- [ ] **Permission rapports.ventes**
  - Vérifier accès aux rapports ventes
  - Notes : _________________________

- [ ] **Permission rapports.financiers**
  - Vérifier accès aux rapports financiers
  - Notes : _________________________

---

## 🔄 Fonctionnalités Transversales

### Gestion du Crédit Client
- [ ] **Affichage solde dans POS**
  - Vérifier l'affichage
  - Notes : _________________________

- [ ] **Validation crédit autorisé**
  - Tester dépassement
  - Vérifier message d'erreur
  - Notes : _________________________

- [ ] **Paiement crédit tous modes**
  - Tester chaque mode de paiement
  - Vérifier enregistrement
  - Notes : _________________________

- [ ] **Exclusion crédits du CA**
  - Faire une vente à crédit
  - Vérifier exclusion du CA
  - Notes : _________________________

- [ ] **Inclusion paiements crédit dans CA**
  - Payer un crédit
  - Vérifier inclusion dans CA
  - Notes : _________________________

### Gestion des Chèques
- [ ] **Enregistrement date chèque**
  - Faire une vente par chèque
  - Vérifier l'enregistrement de la date
  - Notes : _________________________

- [ ] **Gestion statuts**
  - Tester tous les changements de statut
  - Vérifier les mises à jour
  - Notes : _________________________

- [ ] **Chèque à date future**
  - Faire une vente avec chèque futur
  - Vérifier traitement comme crédit
  - Notes : _________________________

### Calcul du CA
- [ ] **Exclusion ventes à crédit**
  - Vérifier dans dashboard
  - Vérifier dans rapports
  - Notes : _________________________

- [ ] **Inclusion paiements crédit**
  - Vérifier dans dashboard
  - Vérifier dans rapports
  - Notes : _________________________

### Multi-Tenant
- [ ] **Isolation des données**
  - Se connecter avec admin magasin A
  - Vérifier qu'on ne voit que les données du magasin A
  - Notes : _________________________

### Sécurité
- [ ] **Authentification**
  - Tester connexion
  - Tester déconnexion
  - Notes : _________________________

- [ ] **Validation permissions**
  - Tester accès sans permission
  - Vérifier refus d'accès
  - Notes : _________________________

---

## 📝 Résumé des Tests

### Statistiques Globales
- Total de tests : ___
- Tests réussis : ___
- Tests échoués : ___
- Tests non effectués : ___

### Problèmes Identifiés

1. **Problème 1 :**
   - Description : _________________________
   - Module : _________________________
   - Priorité : ☐ Haute ☐ Moyenne ☐ Basse

2. **Problème 2 :**
   - Description : _________________________
   - Module : _________________________
   - Priorité : ☐ Haute ☐ Moyenne ☐ Basse

3. **Problème 3 :**
   - Description : _________________________
   - Module : _________________________
   - Priorité : ☐ Haute ☐ Moyenne ☐ Basse

### Notes Finales

_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

**Date des tests :** _________________________

**Testeur :** _________________________

**Version testée :** _________________________



