-- Script FINAL pour supprimer les paiements de chèques (paiement_cheque) du 28/12/2025
-- Exécutez ce script dans pgAdmin Query Tool

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION (Exécutez d'abord pour voir ce qui sera supprimé)
-- ============================================

-- Voir les paiements de chèques du 28/12/2025
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ttc,
    v.reference_paiement as numero_cheque,
    v.date_cheque,
    v.statut_cheque,
    c.nom as client_nom
FROM ventes v
LEFT JOIN clients c ON v.client_id = c.id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document = 'paiement_cheque'
ORDER BY v.date_vente;

-- Compter combien seront supprimés
SELECT COUNT(*) as nb_a_supprimer
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- ============================================
-- ÉTAPE 2 : SUPPRESSION (Exécutez après vérification)
-- ============================================

BEGIN;

-- Supprimer les lignes de vente associées
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
    COUNT(*) as restants,
    'Si 0, la suppression a réussi' as message
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- IMPORTANT : Décommentez la ligne suivante pour CONFIRMER la suppression
-- COMMIT;

-- Si vous voulez ANNULER, utilisez :
-- ROLLBACK;

