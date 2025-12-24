-- Script SIMPLE pour restaurer les montants (sans transaction pour éviter les erreurs)
-- Exécutez cette requête ligne par ligne dans pgAdmin

-- 1. D'abord, annuler toute transaction en cours
ROLLBACK;

-- 2. Vérifier l'état actuel
SELECT 
    DATE(date_vente) as date,
    COUNT(*) as nb_ventes,
    COALESCE(SUM(montant_ttc), 0) as ca_total
FROM ventes
WHERE DATE(date_vente) >= CURRENT_DATE - INTERVAL '1 day'
  AND statut = 'valide'
GROUP BY DATE(date_vente)
ORDER BY date;

-- 3. Restaurer les montants (sans transaction, exécution directe)
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

-- 4. Vérifier le résultat
SELECT 
    'CA d\'aujourd\'hui (sauf 28/12)' as description,
    COALESCE(SUM(montant_ttc), 0) as ca
FROM ventes
WHERE DATE(date_vente) = CURRENT_DATE
  AND DATE(date_vente) != '2025-12-28'
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

