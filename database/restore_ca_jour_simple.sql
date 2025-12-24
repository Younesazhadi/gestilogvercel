-- Script SIMPLE pour restaurer les montants des ventes d'aujourd'hui (sauf 28/12/2025)
-- Exécutez cette requête dans pgAdmin Query Tool

BEGIN;

-- Restaurer les montants depuis les lignes_vente pour toutes les ventes d'aujourd'hui (sauf 28/12)
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
  AND DATE(v.date_vente) != '2025-12-28'  -- Exclure le 28/12
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

SELECT 
    'Ventes du 28/12/2025' as description,
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_28_12
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide';

-- COMMIT; -- Décommentez pour confirmer
-- ROLLBACK; -- Utilisez pour annuler

