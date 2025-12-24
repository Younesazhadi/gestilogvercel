# 🧪 Guide de Test Complet - Gestilog
## Comment accéder à toutes les fonctionnalités de l'application

Ce guide vous explique étape par étape comment configurer l'application pour tester toutes les fonctionnalités disponibles.

---

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Étape 1 : Connexion en tant que Super Admin](#étape-1--connexion-en-tant-que-super-admin)
3. [Étape 2 : Créer/Modifier un Plan avec toutes les fonctionnalités](#étape-2--créermodifier-un-plan-avec-toutes-les-fonctionnalités)
4. [Étape 3 : Créer un Magasin avec le Plan Complet](#étape-3--créer-un-magasin-avec-le-plan-complet)
5. [Étape 4 : Se connecter en tant qu'Admin du Magasin](#étape-4--se-connecter-en-tant-quadmin-du-magasin)
6. [Étape 5 : Créer des Utilisateurs avec toutes les Permissions](#étape-5--créer-des-utilisateurs-avec-toutes-les-permissions)
7. [Étape 6 : Tester toutes les Fonctionnalités](#étape-6--tester-toutes-les-fonctionnalités)

---

## 🔧 Prérequis

- L'application doit être démarrée (backend et frontend)
- Avoir accès à un compte **Super Admin** (créé lors de l'initialisation)
- Navigateur web moderne (Chrome, Firefox, Edge)

---

## 🔴 Étape 1 : Connexion en tant que Super Admin

### 1.1 Accéder à la page de connexion
- Ouvrez votre navigateur
- Accédez à `http://localhost:5173` (ou l'URL de votre frontend)
- Vous serez redirigé vers `/login`

### 1.2 Se connecter
- **Email** : `admin@gestilog.com` (ou l'email du super admin configuré)
- **Mot de passe** : Le mot de passe configuré lors de l'initialisation
- Cliquez sur **"Se connecter"**

### 1.3 Vérifier l'accès
- Vous devriez être redirigé vers `/super-admin/dashboard`
- Le menu de gauche devrait afficher :
  - Dashboard
  - Plans
  - Magasins
  - Paiements (si disponible)

---

## 📦 Étape 2 : Créer/Modifier un Plan avec toutes les fonctionnalités

### 2.1 Accéder à la gestion des Plans
- Dans le menu de gauche, cliquez sur **"Plans"**
- Vous verrez la liste des plans existants

### 2.2 Option A : Modifier un plan existant
1. Cliquez sur le bouton **"Modifier"** (icône crayon) d'un plan existant
2. Dans le formulaire, vous verrez toutes les fonctionnalités organisées par modules

### 2.3 Option B : Créer un nouveau plan
1. Cliquez sur le bouton **"Nouveau Plan"** (en haut à droite)
2. Remplissez les informations de base :
   - **Nom** : "Plan Complet Test"
   - **Prix mensuel** : 5000.00
   - **Nombre max d'utilisateurs** : 99
   - **Nombre max de produits** : Laissez vide (illimité)

### 2.4 Activer toutes les fonctionnalités
1. **En haut de la section fonctionnalités**, cochez **"Sélectionner tout"**
   - Cela sélectionnera automatiquement toutes les fonctionnalités
   
2. **OU** cochez manuellement chaque module :
   - Pour chaque module (Produits, Stock, Ventes, etc.), cochez **"Sélectionner tout"** à côté du nom du module
   
3. **Modules disponibles** :
   - 📦 **Module Produits** : consulter, créer, modifier, supprimer, modifier prix, upload images, code-barres, catégories
   - 📊 **Module Stock** : consulter, entrées, sorties, ajustements, inventaire, alertes
   - 🛒 **Module Ventes** : consulter, créer, modifier, supprimer, annuler, remises, POS, tickets, factures, devis, bons de livraison
   - 👥 **Module Clients** : consulter, créer, modifier, supprimer, crédit, paiements, historique
   - 🚚 **Module Fournisseurs** : consulter, créer, modifier, supprimer, commandes, historique
   - 👤 **Module Utilisateurs** : consulter, créer, modifier, supprimer, permissions
   - 📈 **Module Rapports** : basiques, avancés, ventes, financiers, stock, top produits, par catégorie, par utilisateur, graphiques, export
   - 📄 **Module Documents** : factures, devis, bons de livraison, tickets, impression, PDF
   - 📊 **Module Dashboard** : statistiques, CA, ventes, graphiques, alertes
   - 📁 **Module Catégories** : consulter, créer, modifier, supprimer, hiérarchie
   - ⚙️ **Fonctionnalités Avancées** : multi-magasins, API access, support prioritaire, upload images, code-barres scanner, export/import données, sauvegarde automatique, logs activité, notifications email/SMS, **tout_inclus**

4. **Important** : Assurez-vous que **"tout_inclus"** est coché (dans Fonctionnalités Avancées)
   - Cela donne accès à toutes les fonctionnalités sans vérification individuelle

### 2.5 Sauvegarder le plan
- Cliquez sur **"Créer"** ou **"Modifier"** selon le cas
- Un message de succès devrait apparaître

---

## 🏪 Étape 3 : Créer un Magasin avec le Plan Complet

### 3.1 Accéder à la gestion des Magasins
- Dans le menu de gauche, cliquez sur **"Magasins"**
- Vous verrez la liste des magasins existants

### 3.2 Créer un nouveau magasin
1. Cliquez sur le bouton **"Nouveau Magasin"** (en haut à droite)

2. Remplissez le formulaire simplifié :
   - **Nom du magasin** : "Magasin Test Complet"
   - **Téléphone** : "+212 6XX XXX XXX"
   - **Plan** : Sélectionnez le plan créé/modifié à l'étape 2
   - **Date d'expiration abonnement** : Sélectionnez une date future (ex: dans 1 an)
   - **Adresse** : "123 Rue Test, Casablanca, Maroc"

3. **Note** : L'email est généré automatiquement (format: `nom-magasin.timestamp@gestilog.local`)

4. Cliquez sur **"Créer"**

### 3.3 Vérifier la création
- Le magasin devrait apparaître dans la liste
- Un compte **Admin** est automatiquement créé pour ce magasin
- Les informations de connexion sont générées automatiquement

---

## 👨‍💼 Étape 4 : Se connecter en tant qu'Admin du Magasin

### 4.1 Récupérer les informations de connexion
- Dans la liste des magasins, cliquez sur le magasin créé
- Ou cliquez sur **"Voir détails"** (icône œil)
- Notez l'**email** du magasin (généré automatiquement)

### 4.2 Se déconnecter du Super Admin
- Cliquez sur votre profil en bas du menu de gauche
- Cliquez sur **"Déconnexion"**

### 4.3 Se connecter en tant qu'Admin
1. Sur la page de connexion, entrez :
   - **Email** : L'email du magasin (ex: `magasin-test-complet.1234567890@gestilog.local`)
   - **Mot de passe** : Le mot de passe par défaut (généralement `admin123` ou celui configuré)

2. Cliquez sur **"Se connecter"**

### 4.4 Vérifier l'accès Admin
- Vous devriez être redirigé vers `/admin/dashboard`
- Le menu de gauche devrait afficher tous les modules disponibles :
  - Dashboard
  - Ventes
  - Caisse (POS)
  - Produits
  - Stock
  - Clients
  - Fournisseurs
  - Utilisateurs
  - Rapports
  - Documents

---

## 👥 Étape 5 : Créer des Utilisateurs avec toutes les Permissions

### 5.1 Accéder à la gestion des Utilisateurs
- Dans le menu de gauche, cliquez sur **"Utilisateurs"**
- Vous verrez la liste des utilisateurs (vous-même en tant qu'admin)

### 5.2 Créer un nouvel utilisateur
1. Cliquez sur le bouton **"Nouvel Utilisateur"** (en haut à droite)

2. Remplissez le formulaire :
   - **Nom** : "Test"
   - **Prénom** : "User"
   - **Email** : "test.user@gestilog.com"
   - **Mot de passe** : "test123"
   - **Utilisateur actif** : Cochez la case

### 5.3 Accorder toutes les permissions
1. Dans la section **"Permissions"**, en haut, cochez **"Sélectionner tout"**
   - Cela sélectionnera toutes les permissions de tous les modules

2. **OU** cochez manuellement par module :
   - Pour chaque module (Ventes, Produits, Stock, etc.), cochez **"Sélectionner tout"** à côté du nom du module

3. **Modules de permissions disponibles** :
   - **Ventes** : consulter, créer, modifier, supprimer, remises, voir prix d'achat
   - **Produits** : consulter, créer, modifier, supprimer, modifier prix, importer/exporter
   - **Stock** : consulter, entrées, sorties, ajustements, inventaire
   - **Clients** : consulter, créer/modifier, voir soldes, paiements
   - **Fournisseurs** : consulter, gérer, commandes
   - **Rapports** : ventes, financiers, stock, exporter
   - **Documents** : factures, devis, BL, envoyer email

4. Cliquez sur **"Créer"**

### 5.4 Vérifier la création
- L'utilisateur devrait apparaître dans la liste
- Son rôle devrait être **"Utilisateur"** (badge bleu clair)

---

## ✅ Étape 6 : Tester toutes les Fonctionnalités

### 6.1 Se connecter avec l'utilisateur créé
1. Déconnectez-vous de l'admin
2. Connectez-vous avec l'utilisateur créé :
   - **Email** : `test.user@gestilog.com`
   - **Mot de passe** : `test123`

3. Vous devriez voir tous les menus disponibles selon les permissions accordées

### 6.2 Tester chaque module

#### 📊 Dashboard
- Accédez à `/dashboard`
- Vérifiez les statistiques, graphiques, alertes

#### 🛒 Ventes
- Accédez à `/ventes`
- Créez une nouvelle vente
- Consultez l'historique des ventes
- Testez les remises

#### 💰 Caisse (POS)
- Accédez à `/pos`
- Scannez ou sélectionnez des produits
- Finalisez une vente
- Imprimez un ticket

#### 📦 Produits
- Accédez à `/produits`
- Créez un nouveau produit
- Modifiez un produit existant
- Testez l'upload d'images
- Testez les codes-barres

#### 📊 Stock
- Accédez à `/stock`
- Créez une entrée de stock
- Créez une sortie de stock
- Faites un ajustement
- Lancez un inventaire

#### 👥 Clients
- Accédez à `/clients`
- Créez un nouveau client
- Consultez les soldes clients
- Enregistrez un paiement

#### 🚚 Fournisseurs
- Accédez à `/fournisseurs`
- Créez un nouveau fournisseur
- Créez une commande fournisseur

#### 📈 Rapports
- Accédez à `/rapports`
- Générez un rapport de ventes
- Générez un rapport financier
- Générez un rapport de stock
- Testez l'export (Excel, PDF)

#### 📄 Documents
- Accédez à `/documents`
- Générez une facture
- Générez un devis
- Générez un bon de livraison
- Testez l'impression

#### 👤 Utilisateurs (Admin seulement)
- Accédez à `/users`
- Créez/modifiez des utilisateurs
- Gérez les permissions

---

## 🔍 Checklist de Test Complète

Utilisez cette checklist pour vous assurer que tout fonctionne :

### Configuration
- [ ] Super Admin peut se connecter
- [ ] Plan créé avec toutes les fonctionnalités
- [ ] Magasin créé avec le plan complet
- [ ] Admin peut se connecter au magasin
- [ ] Utilisateur créé avec toutes les permissions

### Fonctionnalités
- [ ] Dashboard affiche les statistiques
- [ ] Ventes : créer, modifier, consulter
- [ ] POS : scanner produits, finaliser vente
- [ ] Produits : CRUD complet
- [ ] Stock : entrées, sorties, ajustements
- [ ] Clients : CRUD, soldes, paiements
- [ ] Fournisseurs : CRUD, commandes
- [ ] Rapports : génération et export
- [ ] Documents : factures, devis, BL
- [ ] Utilisateurs : gestion et permissions

### Permissions
- [ ] Utilisateur voit seulement les menus autorisés
- [ ] Utilisateur peut accéder aux fonctionnalités accordées
- [ ] Utilisateur ne peut pas accéder aux fonctionnalités non accordées

---

## 🐛 Dépannage

### Problème : Les menus ne s'affichent pas
- **Solution** : Vérifiez que le plan du magasin a toutes les fonctionnalités activées
- Vérifiez que `tout_inclus` est coché dans le plan

### Problème : L'utilisateur ne voit pas les fonctionnalités
- **Solution** : Vérifiez que les permissions sont bien accordées à l'utilisateur
- Vérifiez que l'utilisateur s'est déconnecté et reconnecté après la modification des permissions

### Problème : Erreur 403 (Forbidden)
- **Solution** : La fonctionnalité n'est pas activée dans le plan du magasin
- Ou l'utilisateur n'a pas la permission nécessaire

### Problème : Impossible de créer un utilisateur
- **Solution** : Vérifiez la limite d'utilisateurs du plan
- Vérifiez que vous êtes connecté en tant qu'admin (pas super admin)

---

## 📝 Notes Importantes

1. **Plan "tout_inclus"** : Cochez cette option pour activer toutes les fonctionnalités sans vérification individuelle
2. **Permissions utilisateur** : Les permissions sont spécifiques à chaque utilisateur et peuvent être modifiées à tout moment
3. **Plan du magasin** : Le plan détermine quelles fonctionnalités sont disponibles pour TOUS les utilisateurs du magasin
4. **Permissions utilisateur** : Les permissions déterminent ce que chaque utilisateur PEUT faire parmi les fonctionnalités disponibles du plan

---

## 🎯 Résumé Rapide

Pour tester toutes les fonctionnalités rapidement :

1. **Super Admin** → Créer un plan avec **"Sélectionner tout"** (toutes les fonctionnalités)
2. **Super Admin** → Créer un magasin avec ce plan
3. **Admin** → Se connecter au magasin
4. **Admin** → Créer un utilisateur avec **"Sélectionner tout"** (toutes les permissions)
5. **Utilisateur** → Se connecter et tester toutes les fonctionnalités

---

**Bon test ! 🚀**


