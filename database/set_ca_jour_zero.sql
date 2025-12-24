-- Script pour mettre le CA du jour à 0
-- Cette requête met tous les montants (HT, TVA, TTC) à 0 pour les ventes d'aujourd'hui
-- ATTENTION : Cette opération est irréversible !
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION (Exécutez d'abord)
-- ============================================

-- Voir les ventes d'aujourd'hui qui seront modifiées
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
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND v.statut = 'valide'
ORDER BY v.date_vente;

-- Voir le CA actuel du jour
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_actuel
FROM ventes
WHERE DATE(date_vente) = CURRENT_DATE
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- ============================================
-- ÉTAPE 2 : MISE À ZÉRO (Exécutez après vérification)
-- ============================================

BEGIN;

-- Mettre tous les montants à 0 pour les ventes d'aujourd'hui
UPDATE ventes
SET 
    montant_ht = 0,
    montant_tva = 0,
    montant_ttc = 0
WHERE DATE(date_vente) = CURRENT_DATE
  AND statut = 'valide';

-- Vérification : Le CA devrait maintenant être 0
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_apres_modification
FROM ventes
WHERE DATE(date_vente) = CURRENT_DATE
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- Pour annuler : ROLLBACK;
-- Pour confirmer : COMMIT;

-- COMMIT; -- Décommentez cette ligne pour confirmer

