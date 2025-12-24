-- Script pour supprimer UNIQUEMENT les paiements de chèques (paiement_cheque) du 28/12/2025
-- ATTENTION : Cette opération est irréversible !
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter ce script

BEGIN;

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION (Exécutez d'abord pour voir ce qui sera supprimé)
-- ============================================

-- Afficher les paiements de chèques qui seront supprimés
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ttc,
    v.reference_paiement as numero_cheque,
    v.date_cheque,
    v.statut_cheque,
    c.nom as client_nom,
    COUNT(lv.id) as nb_lignes
FROM ventes v
LEFT JOIN clients c ON v.client_id = c.id
LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document = 'paiement_cheque'
GROUP BY v.id, v.numero_vente, v.type_document, v.date_vente, 
         v.montant_ttc, v.reference_paiement, v.date_cheque, 
         v.statut_cheque, c.nom
ORDER BY v.date_vente;

-- Compter le nombre de paiements de chèques à supprimer
SELECT COUNT(*) as nb_paiements_cheque_a_supprimer
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- Vérifier le montant total des paiements de chèques à supprimer
SELECT 
    COUNT(*) as nb_paiements,
    COALESCE(SUM(montant_ttc), 0) as montant_total
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- ============================================
-- ÉTAPE 2 : SUPPRESSION (Décommentez après vérification)
-- ============================================

-- Supprimer les lignes de vente associées aux paiements de chèques
DELETE FROM lignes_vente
WHERE vente_id IN (
    SELECT id 
    FROM ventes 
    WHERE DATE(date_vente) = '2025-12-28'
      AND type_document = 'paiement_cheque'
);

-- Supprimer les paiements de chèques
DELETE FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- Vérification finale
SELECT 
    COUNT(*) as paiements_cheque_restants_28_12_2025,
    COALESCE(SUM(montant_ttc), 0) as montant_restant
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- Afficher le résultat
SELECT 'Suppression des paiements de chèques terminée' as message;

-- Pour annuler les modifications, utilisez : ROLLBACK;
-- Pour confirmer les modifications, utilisez : COMMIT;

-- COMMIT; -- Décommentez cette ligne pour confirmer la suppression

