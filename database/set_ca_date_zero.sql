-- Script pour mettre le CA d'une date spécifique à 0
-- Remplacez '2025-12-28' par la date souhaitée
-- ATTENTION : Cette opération est irréversible !

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION
-- ============================================

-- Voir les ventes de la date qui seront modifiées
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ht,
    v.montant_tva,
    v.montant_ttc,
    v.mode_paiement,
    v.statut,
    c.nom as client_nom
FROM ventes v
LEFT JOIN clients c ON v.client_id = c.id
WHERE DATE(v.date_vente) = '2025-12-28'  -- ⚠️ CHANGEZ LA DATE ICI
  AND v.statut = 'valide'
ORDER BY v.date_vente;

-- Voir le CA actuel de cette date
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_actuel
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'  -- ⚠️ CHANGEZ LA DATE ICI
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- ============================================
-- ÉTAPE 2 : MISE À ZÉRO
-- ============================================

BEGIN;

-- Mettre tous les montants à 0 pour les ventes de cette date
UPDATE ventes
SET 
    montant_ht = 0,
    montant_tva = 0,
    montant_ttc = 0
WHERE DATE(date_vente) = '2025-12-28'  -- ⚠️ CHANGEZ LA DATE ICI
  AND statut = 'valide';

-- Vérification : Le CA devrait maintenant être 0
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_apres_modification
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'  -- ⚠️ CHANGEZ LA DATE ICI
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- Pour annuler : ROLLBACK;
-- Pour confirmer : COMMIT;

-- COMMIT; -- Décommentez cette ligne pour confirmer

