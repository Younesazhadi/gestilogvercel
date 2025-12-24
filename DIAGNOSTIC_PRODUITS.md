# Guide de Diagnostic - Problème d'affichage des produits

## 🔍 Étapes de diagnostic

### 1. Vérifier la base de données

Exécutez le script de test :
```bash
cd backend
npm run test-produits
```

Ce script va :
- Vérifier la connexion à la base de données
- Lister tous les magasins
- Compter les produits par magasin
- Lister les utilisateurs et leurs magasins associés

### 2. Vérifier dans pgAdmin

Connectez-vous à votre base de données et exécutez :

```sql
-- Vérifier les magasins
SELECT id, nom_magasin, email, statut FROM magasins;

-- Vérifier les produits
SELECT id, nom, magasin_id, stock_actuel FROM produits;

-- Vérifier les utilisateurs et leurs magasins
SELECT u.id, u.nom, u.email, u.role, u.magasin_id, m.nom_magasin
FROM users u
LEFT JOIN magasins m ON u.magasin_id = m.id;
```

### 3. Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez :
- Les erreurs dans l'onglet "Console"
- Les requêtes réseau dans l'onglet "Network"
- Vérifiez la requête vers `/admin/produits` et sa réponse

### 4. Vérifier les logs du backend

Dans le terminal où tourne le backend, vérifiez :
- Les erreurs SQL
- Les requêtes exécutées
- Les paramètres passés

## 🛠️ Solutions courantes

### Problème 1 : Aucun produit dans la base de données

**Solution :** Créer des produits de test

```sql
-- Remplacer MAGASIN_ID par l'ID de votre magasin
INSERT INTO produits (magasin_id, nom, prix_vente, stock_actuel, stock_min, unite)
VALUES 
  (MAGASIN_ID, 'Produit Test 1', 100.00, 50, 10, 'unité'),
  (MAGASIN_ID, 'Produit Test 2', 200.00, 30, 5, 'unité'),
  (MAGASIN_ID, 'Produit Test 3', 150.00, 20, 5, 'unité');
```

### Problème 2 : L'utilisateur n'est pas associé à un magasin

**Solution :** Vérifier et corriger l'association

```sql
-- Vérifier l'utilisateur
SELECT id, email, role, magasin_id FROM users WHERE email = 'votre-email@example.com';

-- Associer l'utilisateur à un magasin (remplacer USER_ID et MAGASIN_ID)
UPDATE users SET magasin_id = MAGASIN_ID WHERE id = USER_ID;
```

### Problème 3 : Le magasin n'est pas actif

**Solution :** Activer le magasin

```sql
UPDATE magasins SET statut = 'actif' WHERE id = MAGASIN_ID;
```

### Problème 4 : Erreur SQL dans la requête

**Solution :** Vérifier les logs du backend pour voir l'erreur exacte

## 📝 Test manuel de l'API

Testez directement l'API avec curl ou Postman :

```bash
# Remplacer TOKEN par votre token JWT
curl -X GET "http://localhost:5000/api/admin/produits" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## ✅ Vérifications à faire

1. ✅ L'utilisateur est bien connecté
2. ✅ L'utilisateur a un `magasin_id` (sauf super admin)
3. ✅ Le magasin existe et est actif
4. ✅ Il y a des produits dans la base avec le bon `magasin_id`
5. ✅ Pas d'erreurs dans la console du navigateur
6. ✅ Pas d'erreurs dans les logs du backend

