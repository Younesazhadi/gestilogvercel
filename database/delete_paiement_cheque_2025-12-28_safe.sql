-- Script SÉCURISÉ pour supprimer UNIQUEMENT les paiements de chèques (paiement_cheque) du 28/12/2025
-- Ce script affiche d'abord les données avant de supprimer
-- Exécutez d'abord les requêtes SELECT pour vérifier, puis décommentez les DELETE

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION (Exécutez d'abord)
-- ============================================

-- Afficher tous les paiements de chèques du 28/12/2025 avec leurs détails
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ht,
    v.montant_tva,
    v.montant_ttc,
    v.reference_paiement as numero_cheque,
    v.date_cheque,
    v.statut_cheque,
    v.mode_paiement,
    v.statut,
    c.nom as client_nom,
    c.telephone as client_telephone,
    COUNT(lv.id) as nb_lignes,
    STRING_AGG(lv.designation, ', ') as lignes_vente
FROM ventes v
LEFT JOIN clients c ON v.client_id = c.id
LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document = 'paiement_cheque'
GROUP BY v.id, v.numero_vente, v.type_document, v.date_vente, 
         v.montant_ht, v.montant_tva, v.montant_ttc, 
         v.reference_paiement, v.date_cheque, v.statut_cheque,
         v.mode_paiement, v.statut, c.nom, c.telephone
ORDER BY v.date_vente;

-- Compter le nombre de paiements de chèques à supprimer
SELECT 
    COUNT(*) as nb_paiements_cheque_a_supprimer,
    COALESCE(SUM(montant_ttc), 0) as montant_total_a_supprimer
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND type_document = 'paiement_cheque';

-- Compter le nombre de lignes de vente à supprimer
SELECT COUNT(*) as nb_lignes_a_supprimer
FROM lignes_vente
WHERE vente_id IN (
    SELECT id 
    FROM ventes 
    WHERE DATE(date_vente) = '2025-12-28'
      AND type_document = 'paiement_cheque'
);

-- Afficher les détails des lignes de vente qui seront supprimées
SELECT 
    lv.id,
    lv.vente_id,
    v.numero_vente,
    lv.designation,
    lv.quantite,
    lv.prix_unitaire,
    lv.montant_total
FROM lignes_vente lv
JOIN ventes v ON lv.vente_id = v.id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document = 'paiement_cheque'
ORDER BY v.numero_vente, lv.id;

-- Vérifier s'il y a d'autres types de ventes le 28/12/2025 (pour information)
SELECT 
    type_document,
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as montant_total
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
GROUP BY type_document
ORDER BY type_document;

-- ============================================
-- ÉTAPE 2 : SUPPRESSION (Décommentez après vérification)
-- ============================================

BEGIN;

-- 1. Supprimer les lignes de vente associées aux paiements de chèques
DELETE FROM lignes_vente
WHERE vente_id IN (
    SELECT id 
    FROM ventes 
    WHERE DATE(date_vente) = '2025-12-28'
      AND type_document = 'paiement_cheque'
);

-- 2. Supprimer les paiements de chèques
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

-- Afficher toutes les ventes restantes du 28/12/2025 (pour vérification)
SELECT 
    type_document,
    COUNT(*) as nb_ventes_restantes,
    COALESCE(SUM(montant_ttc), 0) as montant_total
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
GROUP BY type_document
ORDER BY type_document;

-- Pour annuler : ROLLBACK;
-- Pour confirmer : COMMIT;

-- COMMIT; -- Décommentez cette ligne pour confirmer la suppression

