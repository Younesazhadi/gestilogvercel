# 🧪 Guide de Test Rapide - Admin
## Tester toutes les fonctionnalités en tant qu'Admin

Ce guide vous explique rapidement comment configurer et tester toutes les fonctionnalités en tant qu'admin.

---

## 🚀 Configuration Rapide (5 minutes)

### Étape 1 : Se connecter en Super Admin
1. Ouvrez `http://localhost:5173/login`
2. Connectez-vous avec les identifiants Super Admin

### Étape 2 : Activer toutes les fonctionnalités du plan
1. Allez dans **Plans** (menu de gauche)
2. Cliquez sur **"Modifier"** (icône crayon) sur un plan existant
   - OU créez un nouveau plan avec **"Nouveau Plan"**
3. **Important** : Cochez **"Sélectionner tout"** en haut de la section fonctionnalités
   - Cela active automatiquement toutes les fonctionnalités
4. Cliquez sur **"Modifier"** ou **"Créer"**

### Étape 3 : Assigner le plan à votre magasin
1. Allez dans **Magasins** (menu de gauche)
2. Cliquez sur votre magasin (ou créez-en un nouveau)
3. Sélectionnez le plan que vous venez de modifier/créer
4. Définissez une date d'expiration future
5. Sauvegardez

### Étape 4 : Se connecter en Admin
1. Déconnectez-vous du Super Admin
2. Connectez-vous avec les identifiants Admin de votre magasin
3. Vous devriez maintenant voir tous les menus disponibles

---

## ✅ Checklist de Test - Toutes les Fonctionnalités

### 📊 1. Dashboard
- [ ] Accéder à `/admin/dashboard`
- [ ] Vérifier les statistiques (CA, ventes, produits, etc.)
- [ ] Vérifier les graphiques
- [ ] Vérifier les alertes de stock

### 🛒 2. Ventes
- [ ] **Consulter les ventes** : `/admin/ventes`
- [ ] **Créer une vente via POS** : Cliquer sur "Nouvelle vente" → `/admin/pos`
  - [ ] Ajouter des produits au panier
  - [ ] Appliquer une remise
  - [ ] Finaliser la vente
  - [ ] Imprimer un ticket
- [ ] **Voir les détails d'une vente** : Cliquer sur une vente
- [ ] **Annuler une vente** : Depuis les détails d'une vente

### 📦 3. Produits
- [ ] **Consulter les produits** : `/admin/produits`
- [ ] **Créer un produit** : "Nouveau produit"
  - [ ] Remplir tous les champs (nom, prix, stock, etc.)
  - [ ] Uploader une image
  - [ ] Ajouter un code-barres
  - [ ] Assigner une catégorie
  - [ ] Sauvegarder
- [ ] **Modifier un produit** : Cliquer sur "Modifier" (icône crayon)
- [ ] **Supprimer un produit** : Cliquer sur "Supprimer" (icône poubelle)
- [ ] **Rechercher un produit** : Utiliser la barre de recherche
- [ ] **Voir les alertes de stock** : `/admin/produits/alertes/stock`

### 📊 4. Stock
- [ ] **Consulter les mouvements** : `/admin/stock`
- [ ] **Créer une entrée de stock** : "Nouvelle entrée"
  - [ ] Sélectionner un produit
  - [ ] Entrer la quantité
  - [ ] Ajouter un motif
  - [ ] Sauvegarder
- [ ] **Créer une sortie de stock** : "Nouvelle sortie"
- [ ] **Faire un ajustement** : "Nouvel ajustement"
- [ ] **Faire un inventaire** : "Nouvel inventaire"
- [ ] **Filtrer les mouvements** : Par date, type, produit

### 👥 5. Clients
- [ ] **Consulter les clients** : `/admin/clients`
- [ ] **Créer un client** : "Nouveau client"
  - [ ] Remplir les informations (nom, email, téléphone, adresse)
  - [ ] Sauvegarder
- [ ] **Modifier un client** : Cliquer sur "Modifier"
- [ ] **Voir les détails d'un client** : Cliquer sur un client
  - [ ] Voir l'historique des ventes
  - [ ] Voir le solde
- [ ] **Enregistrer un paiement** : Depuis les détails d'un client
- [ ] **Supprimer un client** : Cliquer sur "Supprimer"

### 🚚 6. Fournisseurs
- [ ] **Consulter les fournisseurs** : `/admin/fournisseurs`
- [ ] **Créer un fournisseur** : "Nouveau fournisseur"
  - [ ] Remplir les informations
  - [ ] Sauvegarder
- [ ] **Modifier un fournisseur** : Cliquer sur "Modifier"
- [ ] **Créer une commande fournisseur** : Depuis les détails d'un fournisseur
- [ ] **Voir l'historique des commandes** : Depuis les détails d'un fournisseur
- [ ] **Supprimer un fournisseur** : Cliquer sur "Supprimer"

### 👤 7. Utilisateurs
- [ ] **Consulter les utilisateurs** : `/admin/users`
- [ ] **Créer un utilisateur** : "Nouvel utilisateur"
  - [ ] Remplir les informations (nom, email, mot de passe)
  - [ ] **Cocher "Sélectionner tout"** dans les permissions
  - [ ] Sauvegarder
- [ ] **Modifier un utilisateur** : Cliquer sur "Modifier"
  - [ ] Modifier les permissions
  - [ ] Sauvegarder
- [ ] **Supprimer un utilisateur** : Cliquer sur "Supprimer"
- [ ] **Activer/Désactiver un utilisateur** : Via le formulaire de modification

### 📈 8. Rapports
- [ ] **Accéder aux rapports** : `/admin/rapports`
- [ ] **Rapport des ventes** : 
  - [ ] Sélectionner une période
  - [ ] Voir les ventes par catégorie
  - [ ] Voir les ventes par utilisateur
  - [ ] Exporter en Excel/PDF
- [ ] **Rapport financier** :
  - [ ] Voir le CA (Chiffre d'Affaires)
  - [ ] Voir les bénéfices
  - [ ] Voir la TVA
- [ ] **Rapport de stock** :
  - [ ] Voir la valeur du stock
  - [ ] Voir les mouvements
- [ ] **Top produits** : Voir les produits les plus vendus
- [ ] **Exporter les rapports** : Cliquer sur "Exporter"

### 📄 9. Documents
- [ ] **Accéder aux documents** : `/admin/documents`
- [ ] **Générer une facture** : 
  - [ ] Sélectionner une vente
  - [ ] Cliquer sur "Générer facture"
  - [ ] Vérifier l'impression
- [ ] **Générer un devis** :
  - [ ] Sélectionner une vente
  - [ ] Cliquer sur "Générer devis"
- [ ] **Générer un bon de livraison (BL)** :
  - [ ] Sélectionner une vente
  - [ ] Cliquer sur "Générer BL"
- [ ] **Imprimer un ticket** : Depuis le POS ou les détails d'une vente
- [ ] **Envoyer par email** : Cliquer sur l'icône email (si disponible)

### 💰 10. Caisse (POS)
- [ ] **Accéder au POS** : `/admin/pos`
- [ ] **Scanner un code-barres** : Utiliser le scanner (ou entrer manuellement)
- [ ] **Ajouter un produit au panier** : Cliquer sur un produit
- [ ] **Modifier la quantité** : Utiliser les boutons +/-
- [ ] **Appliquer une remise** : Entrer un pourcentage ou montant
- [ ] **Sélectionner un client** : Cliquer sur "Sélectionner client"
- [ ] **Choisir le type de document** : Ticket, Facture, Devis, BL
- [ ] **Finaliser la vente** : Cliquer sur "Valider"
- [ ] **Imprimer le ticket** : Automatique ou manuel
- [ ] **Nouvelle vente** : Cliquer sur "Nouvelle vente"

---

## 🎯 Scénarios de Test Complets

### Scénario 1 : Vente Complète
1. Créer un produit avec stock
2. Créer un client
3. Ouvrir le POS
4. Ajouter le produit au panier
5. Appliquer une remise
6. Sélectionner le client
7. Choisir "Facture"
8. Finaliser la vente
9. Vérifier que le stock a diminué
10. Vérifier que la vente apparaît dans la liste
11. Générer la facture
12. Vérifier le rapport de ventes

### Scénario 2 : Gestion de Stock
1. Créer un produit avec stock minimum
2. Faire une sortie de stock
3. Vérifier l'alerte de stock
4. Faire une entrée de stock
5. Faire un ajustement
6. Faire un inventaire
7. Vérifier les mouvements dans le rapport de stock

### Scénario 3 : Gestion d'Utilisateurs
1. Créer un utilisateur avec toutes les permissions
2. Se déconnecter
3. Se connecter avec l'utilisateur créé
4. Tester que l'utilisateur peut créer des ventes
5. Tester que l'utilisateur peut créer des produits
6. Modifier les permissions de l'utilisateur
7. Se reconnecter avec l'utilisateur
8. Vérifier que certaines fonctionnalités sont bloquées

### Scénario 4 : Rapports et Documents
1. Créer plusieurs ventes
2. Générer un rapport de ventes pour une période
3. Générer un rapport financier
4. Générer un rapport de stock
5. Exporter les rapports en Excel/PDF
6. Générer des factures pour plusieurs ventes
7. Générer des devis
8. Générer des bons de livraison

---

## 🔍 Points de Vérification

### Vérifier que tout fonctionne :
- ✅ Tous les menus sont visibles dans la sidebar
- ✅ Toutes les pages se chargent sans erreur
- ✅ Tous les formulaires peuvent être soumis
- ✅ Toutes les actions (créer, modifier, supprimer) fonctionnent
- ✅ Les permissions sont respectées
- ✅ Les rapports s'affichent correctement
- ✅ Les documents peuvent être générés
- ✅ Le POS fonctionne correctement
- ✅ Les alertes de stock fonctionnent
- ✅ Les recherches fonctionnent

### Vérifier les erreurs potentielles :
- ❌ Erreur 401 (Non authentifié) → Vérifier le token JWT
- ❌ Erreur 403 (Accès refusé) → Vérifier les permissions du plan
- ❌ Erreur 404 (Page introuvable) → Vérifier les routes
- ❌ Erreur 500 (Erreur serveur) → Vérifier les logs du backend

---

## 📝 Notes Importantes

1. **Plan "tout_inclus"** : Assurez-vous que cette option est cochée dans le plan pour activer toutes les fonctionnalités
2. **Permissions utilisateur** : Les permissions des utilisateurs sont indépendantes des fonctionnalités du plan
3. **Limites du plan** : Vérifiez les limites (nombre d'utilisateurs, nombre de produits) si vous rencontrez des erreurs
4. **Token JWT** : Si vous êtes déconnecté automatiquement, vérifiez la durée de vie du token dans `.env`

---

## 🚨 Dépannage Rapide

### Problème : Les menus ne s'affichent pas
**Solution** : Vérifiez que le plan a toutes les fonctionnalités activées (cochez "Sélectionner tout")

### Problème : Erreur 403 lors de la création
**Solution** : Vérifiez que la fonctionnalité correspondante est activée dans le plan

### Problème : Redirection vers login
**Solution** : 
- Vérifiez que le token JWT n'a pas expiré
- Vérifiez que vous êtes bien connecté en tant qu'admin
- Vérifiez les logs du backend pour voir l'erreur exacte

### Problème : Les données ne s'affichent pas
**Solution** :
- Vérifiez la console du navigateur (F12) pour les erreurs
- Vérifiez les logs du backend
- Vérifiez que la base de données contient des données

---

**Bon test ! 🎉**


