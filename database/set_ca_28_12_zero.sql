-- Script pour mettre le CA du 28/12/2025 à 0
-- Exécutez cette requête dans pgAdmin Query Tool

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION (Optionnel)
-- ============================================

-- Voir les ventes du 28/12/2025 qui seront modifiées
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ht,
    v.montant_tva,
    v.montant_ttc,
    v.mode_paiement,
    v.statut
FROM ventes v
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.statut = 'valide'
ORDER BY v.date_vente;

-- Voir le CA actuel du 28/12/2025
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_actuel_28_12
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- ============================================
-- ÉTAPE 2 : MISE À ZÉRO (Exécutez cette partie)
-- ============================================

-- Mettre tous les montants à 0 pour les ventes du 28/12/2025
UPDATE ventes
SET 
    montant_ht = 0,
    montant_tva = 0,
    montant_ttc = 0
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide';

-- Vérification : Le CA devrait maintenant être 0
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_28_12_apres
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

