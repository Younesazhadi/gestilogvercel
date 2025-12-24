# Guide pour pousser le projet vers GitHub

## Option 1 : Utiliser GitHub Desktop (Recommandé - Plus facile)

1. **Télécharger GitHub Desktop** (si pas déjà installé)
   - Allez sur https://desktop.github.com/
   - Téléchargez et installez GitHub Desktop

2. **Ouvrir le projet dans GitHub Desktop**
   - Ouvrez GitHub Desktop
   - Cliquez sur "File" > "Add Local Repository"
   - Naviguez vers le dossier `gestilog-main`
   - Si Git n'est pas initialisé, GitHub Desktop vous proposera de l'initialiser

3. **Publier vers GitHub**
   - Cliquez sur "Publish repository"
   - Sélectionnez votre compte GitHub
   - Le nom du repository sera "gestilog"
   - Cochez "Keep this code private" (votre repo est privé)
   - Cliquez sur "Publish Repository"

## Option 2 : Utiliser la ligne de commande Git

### Prérequis
- Git doit être installé : https://git-scm.com/download/win

### Étapes

1. **Ouvrir PowerShell ou Terminal dans le dossier du projet**
   ```powershell
   cd C:\Users\yassi\Downloads\gestilog-main\gestilog-main
   ```

2. **Initialiser Git (si pas déjà fait)**
   ```bash
   git init
   ```

3. **Ajouter tous les fichiers**
   ```bash
   git add .
   ```

4. **Créer le premier commit**
   ```bash
   git commit -m "Initial commit: Gestilog - SaaS de Gestion de Stock"
   ```

5. **Renommer la branche en main (si nécessaire)**
   ```bash
   git branch -M main
   ```

6. **Ajouter le remote GitHub**
   ```bash
   git remote add origin https://github.com/YASSINEHARRAT/gestilog.git
   ```

7. **Pousser vers GitHub**
   ```bash
   git push -u origin main
   ```

   **Note** : Vous devrez vous authentifier avec votre token GitHub ou vos identifiants.

## Option 3 : Utiliser l'interface GitHub (Pour un nouveau projet)

Si le repository est vide sur GitHub :

1. **Aller sur votre repository GitHub**
   - https://github.com/YASSINEHARRAT/gestilog

2. **Suivre les instructions affichées sur GitHub**
   - GitHub vous montre les commandes à exécuter
   - Copiez et exécutez-les dans votre terminal

## Authentification GitHub

Si vous rencontrez des problèmes d'authentification :

1. **Créer un Personal Access Token (PAT)**
   - Allez sur GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Cliquez sur "Generate new token (classic)"
   - Donnez-lui un nom (ex: "gestilog-push")
   - Sélectionnez les scopes : `repo` (tous les droits sur les repositories)
   - Copiez le token généré

2. **Utiliser le token lors du push**
   - Quand Git vous demande le mot de passe, utilisez le token au lieu de votre mot de passe

## Fichiers à vérifier avant de pousser

Assurez-vous que ces fichiers sensibles ne sont PAS dans le repository :
- `.env` (déjà dans .gitignore ✅)
- `node_modules/` (déjà dans .gitignore ✅)
- Fichiers de configuration avec mots de passe

## Après le premier push

Pour les prochains changements :
```bash
git add .
git commit -m "Description de vos changements"
git push
```

## Résolution de problèmes

### Erreur : "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YASSINEHARRAT/gestilog.git
```

### Erreur : "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Vérifier le remote
```bash
git remote -v
```

