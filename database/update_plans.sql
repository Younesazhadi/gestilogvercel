-- Script pour garder uniquement les 3 plans: 2000, 3000, 4000 DH
-- Supprime tous les autres plans

-- Étape 1: Voir les plans existants et les magasins qui les utilisent
SELECT p.id, p.nom, p.prix_mensuel, COUNT(m.id) as nb_magasins
FROM plans p
LEFT JOIN magasins m ON m.plan_id = p.id
GROUP BY p.id, p.nom, p.prix_mensuel
ORDER BY p.prix_mensuel;

-- Étape 2: Migrer les magasins qui utilisent des anciens plans vers les nouveaux plans
-- Si un magasin utilise un plan qui n'est pas 2000, 3000 ou 4000, on le migre vers Basique (2000)
UPDATE magasins
SET plan_id = (SELECT id FROM plans WHERE prix_mensuel = 2000.00 LIMIT 1)
WHERE plan_id IS NOT NULL 
AND plan_id NOT IN (SELECT id FROM plans WHERE prix_mensuel IN (2000.00, 3000.00, 4000.00));

-- Étape 3: S'assurer qu'on a exactement 3 plans avec les bons prix
-- Supprimer les doublons et garder seulement un plan par prix

-- Supprimer les plans avec prix 2000 qui ne sont pas le premier
DELETE FROM plans 
WHERE prix_mensuel = 2000.00 
AND id NOT IN (SELECT id FROM plans WHERE prix_mensuel = 2000.00 ORDER BY id LIMIT 1);

-- Supprimer les plans avec prix 3000 qui ne sont pas le premier
DELETE FROM plans 
WHERE prix_mensuel = 3000.00 
AND id NOT IN (SELECT id FROM plans WHERE prix_mensuel = 3000.00 ORDER BY id LIMIT 1);

-- Supprimer les plans avec prix 4000 qui ne sont pas le premier
DELETE FROM plans 
WHERE prix_mensuel = 4000.00 
AND id NOT IN (SELECT id FROM plans WHERE prix_mensuel = 4000.00 ORDER BY id LIMIT 1);

-- Étape 4: Mettre à jour les 3 plans pour avoir les bons noms et fonctionnalités
-- Plan Basique (2000 DH)
UPDATE plans 
SET 
  nom = 'Basique',
  prix_mensuel = 2000.00,
  nb_utilisateurs_max = 2,
  nb_produits_max = 500,
  fonctionnalites = '{"rapports_basiques": true, "alertes_stock": true}'::jsonb,
  actif = true
WHERE prix_mensuel = 2000.00;

-- Plan Standard (3000 DH)
UPDATE plans 
SET 
  nom = 'Standard',
  prix_mensuel = 3000.00,
  nb_utilisateurs_max = 5,
  nb_produits_max = 2000,
  fonctionnalites = '{"rapports_basiques": true, "rapports_avances": true, "alertes_stock": true, "gestion_fournisseurs": true, "factures": true}'::jsonb,
  actif = true
WHERE prix_mensuel = 3000.00;

-- Plan Premium (4000 DH)
UPDATE plans 
SET 
  nom = 'Premium',
  prix_mensuel = 4000.00,
  nb_utilisateurs_max = 99,
  nb_produits_max = NULL,
  fonctionnalites = '{"rapports_basiques": true, "rapports_avances": true, "alertes_stock": true, "gestion_fournisseurs": true, "factures": true, "multi_magasins": true, "api_access": true, "support_prioritaire": true, "tout_inclus": true}'::jsonb,
  actif = true
WHERE prix_mensuel = 4000.00;

-- Étape 5: Créer les plans s'ils n'existent pas
INSERT INTO plans (nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, fonctionnalites, actif)
SELECT 'Basique', 2000.00, 2, 500, '{"rapports_basiques": true, "alertes_stock": true}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE prix_mensuel = 2000.00);

INSERT INTO plans (nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, fonctionnalites, actif)
SELECT 'Standard', 3000.00, 5, 2000, '{"rapports_basiques": true, "rapports_avances": true, "alertes_stock": true, "gestion_fournisseurs": true, "factures": true}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE prix_mensuel = 3000.00);

INSERT INTO plans (nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, fonctionnalites, actif)
SELECT 'Premium', 4000.00, 99, NULL, '{"rapports_basiques": true, "rapports_avances": true, "alertes_stock": true, "gestion_fournisseurs": true, "factures": true, "multi_magasins": true, "api_access": true, "support_prioritaire": true, "tout_inclus": true}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE prix_mensuel = 4000.00);

-- Étape 6: Supprimer TOUS les autres plans (ceux qui ne sont pas 2000, 3000 ou 4000)
DELETE FROM plans 
WHERE prix_mensuel NOT IN (2000.00, 3000.00, 4000.00);

-- Étape 7: Vérifier le résultat final
SELECT id, nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, actif
FROM plans 
ORDER BY prix_mensuel;

-- Vérifier qu'on a exactement 3 plans
SELECT COUNT(*) as nombre_de_plans FROM plans;
