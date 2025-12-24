-- Script pour corriger l'erreur de transaction
-- Si vous avez une erreur "la transaction est annulée", exécutez d'abord ROLLBACK

-- ============================================
-- ÉTAPE 1 : ANNULER LA TRANSACTION EN COURS
-- ============================================

ROLLBACK;

-- ============================================
-- ÉTAPE 2 : VÉRIFIER L'ÉTAT ACTUEL
-- ============================================

-- Voir les ventes d'aujourd'hui et leurs montants
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ht,
    v.montant_tva,
    v.montant_ttc,
    v.statut
FROM ventes v
WHERE DATE(v.date_vente) = CURRENT_DATE
ORDER BY v.date_vente;

-- Voir le CA actuel du jour
SELECT 
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
-- ÉTAPE 3 : RESTAURER LES MONTANTS (sauf 28/12)
-- ============================================

BEGIN;

-- Restaurer les montants depuis les lignes_vente
UPDATE ventes v
SET 
    montant_ht = COALESCE((
        SELECT SUM(lv.prix_unitaire * lv.quantite * (1 - COALESCE(lv.remise, 0)/100))
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0),
    montant_tva = COALESCE((
        SELECT SUM(lv.prix_unitaire * lv.quantite * (1 - COALESCE(lv.remise, 0)/100) * COALESCE(lv.tva, 0)/100)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0),
    montant_ttc = COALESCE((
        SELECT SUM(lv.montant_total)
        FROM lignes_vente lv
        WHERE lv.vente_id = v.id
    ), 0)
WHERE DATE(v.date_vente) = CURRENT_DATE
  AND DATE(v.date_vente) != '2025-12-28'
  AND v.statut = 'valide';

-- Vérifier le résultat
SELECT 
    'Ventes d\'aujourd\'hui (sauf 28/12)' as description,
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_restaure
FROM ventes
WHERE DATE(date_vente) = CURRENT_DATE
  AND DATE(date_vente) != '2025-12-28'
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- Si tout est correct, confirmer
COMMIT;

