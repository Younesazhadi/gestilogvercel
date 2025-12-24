# Script PowerShell pour pousser le projet vers GitHub
# Exécutez ce script dans PowerShell : .\push-to-github.ps1

Write-Host "=== Script de push vers GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Git est installé
try {
    $gitVersion = git --version
    Write-Host "✓ Git trouvé: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git n'est pas installé!" -ForegroundColor Red
    Write-Host "Veuillez installer Git depuis https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Aller dans le dossier du projet
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "Dossier du projet: $projectPath" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Git est déjà initialisé
if (Test-Path ".git") {
    Write-Host "✓ Repository Git déjà initialisé" -ForegroundColor Green
} else {
    Write-Host "Initialisation du repository Git..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erreur lors de l'initialisation" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Repository Git initialisé" -ForegroundColor Green
}

Write-Host ""

# Vérifier le remote
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "Remote actuel: $remoteUrl" -ForegroundColor Cyan
    $changeRemote = Read-Host "Voulez-vous changer le remote? (o/n)"
    if ($changeRemote -eq "o" -or $changeRemote -eq "O") {
        git remote remove origin
        git remote add origin https://github.com/YASSINEHARRAT/gestilog.git
        Write-Host "✓ Remote mis à jour" -ForegroundColor Green
    }
} else {
    Write-Host "Ajout du remote GitHub..." -ForegroundColor Yellow
    git remote add origin https://github.com/YASSINEHARRAT/gestilog.git
    Write-Host "✓ Remote ajouté" -ForegroundColor Green
}

Write-Host ""

# Ajouter tous les fichiers
Write-Host "Ajout des fichiers..." -ForegroundColor Yellow
git add .
Write-Host "✓ Fichiers ajoutés" -ForegroundColor Green

Write-Host ""

# Vérifier s'il y a des changements à committer
$status = git status --porcelain
if ($status) {
    Write-Host "Création du commit..." -ForegroundColor Yellow
    $commitMessage = Read-Host "Message de commit (ou appuyez sur Entrée pour utiliser le message par défaut)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Initial commit: Gestilog - SaaS de Gestion de Stock"
    }
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erreur lors du commit" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Commit créé" -ForegroundColor Green
} else {
    Write-Host "Aucun changement à committer" -ForegroundColor Yellow
}

Write-Host ""

# Renommer la branche en main si nécessaire
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Renommage de la branche en 'main'..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✓ Branche renommée en 'main'" -ForegroundColor Green
}

Write-Host ""

# Pousser vers GitHub
Write-Host "Poussage vers GitHub..." -ForegroundColor Yellow
Write-Host "Note: Vous devrez vous authentifier avec votre token GitHub" -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Projet poussé avec succès vers GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/YASSINEHARRAT/gestilog" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Erreur lors du push" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions possibles:" -ForegroundColor Yellow
    Write-Host "1. Vérifiez votre authentification GitHub" -ForegroundColor White
    Write-Host "2. Créez un Personal Access Token sur GitHub" -ForegroundColor White
    Write-Host "3. Utilisez le token comme mot de passe lors de l'authentification" -ForegroundColor White
}

