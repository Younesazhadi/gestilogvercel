# Guide d'Installation de la Base de Données - Étape 2

## 📋 Vue d'ensemble

L'étape 2 consiste à créer toutes les tables nécessaires dans votre base de données PostgreSQL en exécutant le fichier `schema.sql`.

Ce fichier contient :
- ✅ Toutes les tables (plans, magasins, users, produits, ventes, etc.)
- ✅ Les relations entre les tables (clés étrangères)
- ✅ Les index pour optimiser les performances
- ✅ Les plans par défaut (Basic, Standard, Premium)

## 🎯 Prérequis

Avant de commencer, assurez-vous d'avoir :
1. ✅ PostgreSQL installé et démarré
2. ✅ Une base de données `gestilog` créée (voir étape 1)
3. ✅ Les droits d'accès à cette base de données

## 📝 Méthode 1 : Via la ligne de commande (psql)

### Windows (PowerShell ou CMD)

```bash
# Si PostgreSQL est dans votre PATH
psql -U votre_nom_utilisateur -d gestilog -f database/schema.sql

# Exemple avec l'utilisateur "postgres"
psql -U postgres -d gestilog -f database/schema.sql
```

### Linux / Mac

```bash
# Depuis la racine du projet
psql -U votre_nom_utilisateur -d gestilog -f database/schema.sql

# Ou avec le chemin complet
psql -U postgres -d gestilog -f /chemin/vers/gestilog/database/schema.sql
```

### Si vous devez entrer le mot de passe

```bash
# PostgreSQL vous demandera le mot de passe
psql -U postgres -d gestilog -f database/schema.sql
# Entrez votre mot de passe quand demandé
```

## 📝 Méthode 2 : Via pgAdmin (Interface graphique)

1. **Ouvrir pgAdmin** (interface graphique de PostgreSQL)

2. **Se connecter au serveur PostgreSQL**
   - Clic droit sur "Servers" → "Create" → "Server"
   - Entrez vos identifiants

3. **Sélectionner la base de données `gestilog`**
   - Développez votre serveur
   - Développez "Databases"
   - Clic droit sur `gestilog` → "Query Tool"

4. **Ouvrir le fichier schema.sql**
   - Dans Query Tool, cliquez sur l'icône "Open File" (📁)
   - Naviguez vers `database/schema.sql`
   - Ouvrez le fichier

5. **Exécuter le script**
   - Cliquez sur le bouton "Execute" (▶️) ou appuyez sur F5
   - Attendez la fin de l'exécution

6. **Vérifier**
   - Dans le panneau de gauche, développez `gestilog` → "Schemas" → "public" → "Tables"
   - Vous devriez voir toutes les tables créées :
     - plans
     - magasins
     - users
     - produits
     - ventes
     - etc.

## 📝 Méthode 3 : Via DBeaver (Alternative)

1. **Ouvrir DBeaver** et se connecter à PostgreSQL

2. **Sélectionner la base de données `gestilog`**

3. **Ouvrir le fichier SQL**
   - Menu "SQL Editor" → "Open SQL script"
   - Sélectionnez `database/schema.sql`

4. **Exécuter**
   - Cliquez sur "Execute SQL script" (Ctrl+Alt+X)
   - Ou sélectionnez tout le contenu et exécutez (F5)

## 📝 Méthode 4 : Via VS Code (Extension PostgreSQL)

1. **Installer l'extension PostgreSQL** dans VS Code

2. **Se connecter à PostgreSQL** via l'extension

3. **Ouvrir `database/schema.sql`** dans VS Code

4. **Exécuter**
   - Sélectionnez la base de données `gestilog` dans la barre d'outils
   - Clic droit sur le fichier → "Execute Query"
   - Ou utilisez le raccourci clavier

## ✅ Vérification de l'installation

Après l'exécution, vérifiez que tout s'est bien passé :

### 1. Vérifier les tables créées

```sql
-- Dans psql ou pgAdmin Query Tool
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Vous devriez voir :
- categories
- clients
- commandes_fournisseurs
- fournisseurs
- lignes_commande
- lignes_vente
- logs_activite
- magasins
- mouvements_stock
- paiements
- plans
- produits
- users
- ventes

### 2. Vérifier les plans par défaut

```sql
SELECT * FROM plans;
```

Vous devriez voir 3 plans :
- Basic (200 MAD/mois, 2 utilisateurs, 1000 produits)
- Standard (350 MAD/mois, 5 utilisateurs, 5000 produits)
- Premium (600 MAD/mois, 99 utilisateurs, produits illimités)

### 3. Vérifier les contraintes

```sql
-- Vérifier les clés étrangères
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

## ⚠️ Résolution des problèmes courants

### Erreur : "relation already exists"

**Cause** : Les tables existent déjà.

**Solution** :
```sql
-- Option 1 : Supprimer et recréer (ATTENTION : supprime toutes les données)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Puis réexécutez schema.sql
```

### Erreur : "permission denied"

**Cause** : Vous n'avez pas les droits nécessaires.

**Solution** :
```sql
-- Se connecter en tant que superutilisateur (postgres)
-- Puis donner les droits
GRANT ALL PRIVILEGES ON DATABASE gestilog TO votre_utilisateur;
```

### Erreur : "database does not exist"

**Cause** : La base de données n'a pas été créée.

**Solution** :
```sql
-- Créer la base de données d'abord
CREATE DATABASE gestilog;
```

### Erreur : "could not connect to server"

**Cause** : PostgreSQL n'est pas démarré.

**Solution** :
- **Windows** : Démarrer le service PostgreSQL depuis les Services
- **Linux** : `sudo systemctl start postgresql`
- **Mac** : `brew services start postgresql`

## 🎯 Prochaines étapes

Une fois l'étape 2 terminée avec succès :

1. ✅ Vérifiez que toutes les tables sont créées
2. ✅ Vérifiez que les 3 plans sont présents
3. ✅ Passez à l'étape 3 : Configuration Backend
4. ✅ Créez votre premier super admin (étape 4)

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [DBeaver Documentation](https://dbeaver.com/docs/)

