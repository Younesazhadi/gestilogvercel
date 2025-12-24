-- Script pour RESTAURER les montants des ventes d'aujourd'hui (sauf celles du 28/12/2025)
-- Ce script recalcule les montants depuis les lignes_vente

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION
-- ============================================

-- Voir les ventes d'aujourd'hui qui ont été mises à 0 (sauf 28/12)
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ht,
    v.montant_tva,
    v.montant_ttc,
    COUNT(lv.id) as nb_lignes
FROM ventes v
LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND DATE(v.date_vente) != '2025-12-28'  -- Exclure le 28/12
  AND v.statut = 'valide'
GROUP BY v.id, v.numero_vente, v.type_document, v.date_vente, 
         v.montant_ht, v.montant_tva, v.montant_ttc
ORDER BY v.date_vente;

-- Voir les montants calculés depuis les lignes_vente
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    COALESCE(SUM(lv.prix_unitaire * lv.quantite * (1 - lv.remise/100)), 0) as montant_ht_calcule,
    COALESCE(SUM(lv.prix_unitaire * lv.quantite * (1 - lv.remise/100) * lv.tva/100), 0) as montant_tva_calcule,
    COALESCE(SUM(lv.montant_total), 0) as montant_ttc_calcule
FROM ventes v
LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND DATE(v.date_vente) != '2025-12-28'  -- Exclure le 28/12
  AND v.statut = 'valide'
GROUP BY v.id, v.numero_vente, v.type_document
ORDER BY v.numero_vente;

-- ============================================
-- ÉTAPE 2 : RESTAURATION
-- ============================================

BEGIN;

-- Restaurer les montants pour les ventes normales (avec lignes de vente)
UPDATE ventes v
SET 
    montant_ht = COALESCE((
        SELECT SUM(lv.prix_unitaire * lv.quantite * (1 - lv.remise/100))
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0),
    montant_tva = COALESCE((
        SELECT SUM(lv.prix_unitaire * lv.quantite * (1 - lv.remise/100) * lv.tva/100)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0),
    montant_ttc = COALESCE((
        SELECT SUM(lv.montant_total)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0)
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND DATE(v.date_vente) != '2025-12-28'  -- Exclure le 28/12
  AND v.statut = 'valide'
  AND v.type_document != 'paiement_credit'  -- Les paiements de crédit ont un montant spécifique
  AND v.type_document != 'paiement_cheque';  -- Les paiements de chèques ont un montant spécifique

-- Pour les paiements de crédit, restaurer le montant_ttc depuis les lignes_vente
UPDATE ventes v
SET 
    montant_ttc = COALESCE((
        SELECT SUM(lv.montant_total)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0)
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND DATE(v.date_vente) != '2025-12-28'  -- Exclure le 28/12
  AND v.statut = 'valide'
  AND v.type_document = 'paiement_credit';

-- Pour les paiements de chèques, restaurer le montant_ttc depuis les lignes_vente
UPDATE ventes v
SET 
    montant_ht = COALESCE((
        SELECT SUM(lv.prix_unitaire * lv.quantite * (1 - lv.remise/100))
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0),
    montant_tva = COALESCE((
        SELECT SUM(lv.prix_unitaire * lv.quantite * (1 - lv.remise/100) * lv.tva/100)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0),
    montant_ttc = COALESCE((
        SELECT SUM(lv.montant_total)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0)
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND DATE(v.date_vente) != '2025-12-28'  -- Exclure le 28/12
  AND v.statut = 'valide'
  AND v.type_document = 'paiement_cheque';

-- Vérification : Voir le CA restauré (sauf 28/12)
SELECT 
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_restaure
FROM ventes
WHERE DATE(date_vente) = CURRENT_DATE
  AND DATE(date_vente) != '2025-12-28'  -- Exclure le 28/12
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- Vérifier que le 28/12 reste à 0
SELECT 
    COUNT(*) as nb_ventes_28_12,
    COALESCE(SUM(montant_ttc), 0) as ca_28_12
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide';

-- Pour annuler : ROLLBACK;
-- Pour confirmer : COMMIT;

-- COMMIT; -- Décommentez pour confirmer

