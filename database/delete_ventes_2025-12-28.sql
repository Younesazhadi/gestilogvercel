-- Script pour supprimer les opérations (ventes) du 28/12/2025
-- ATTENTION : Cette opération est irréversible !
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter ce script

BEGIN;

-- Afficher d'abord les ventes qui seront supprimées (pour vérification)
SELECT 
    v.id,
    v.numero_vente,
    v.type_document,
    v.date_vente,
    v.montant_ttc,
    v.mode_paiement,
    c.nom as client_nom,
    COUNT(lv.id) as nb_lignes
FROM ventes v
LEFT JOIN clients c ON v.client_id = c.id
LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
WHERE DATE(v.date_vente) = '2025-12-28'
GROUP BY v.id, v.numero_vente, v.type_document, v.date_vente, v.montant_ttc, v.mode_paiement, c.nom
ORDER BY v.date_vente;

-- Vérifier le nombre de ventes à supprimer
SELECT COUNT(*) as nb_ventes_a_supprimer
FROM ventes
WHERE DATE(date_vente) = '2025-12-28';

-- IMPORTANT : Restaurer le stock pour les ventes qui ne sont pas des devis
-- et qui ne sont pas des paiements (paiement_credit, paiement_cheque)
UPDATE produits p
SET stock_actuel = p.stock_actuel + lv.quantite,
    updated_at = CURRENT_TIMESTAMP
FROM lignes_vente lv
JOIN ventes v ON lv.vente_id = v.id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document != 'devis'
  AND v.type_document != 'paiement_credit'
  AND v.type_document != 'paiement_cheque'
  AND v.statut = 'valide'
  AND lv.produit_id IS NOT NULL
  AND lv.produit_id = p.id;

-- Restaurer le crédit client pour les ventes à crédit
UPDATE clients c
SET solde = c.solde - (v.montant_ttc - COALESCE(v.montant_paye, 0))
FROM ventes v
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.mode_paiement = 'credit'
  AND v.statut = 'valide'
  AND v.client_id = c.id
  AND v.client_id IS NOT NULL;

-- Restaurer le crédit client pour les paiements de crédit (remettre le montant au solde)
UPDATE clients c
SET solde = c.solde + v.montant_ttc
FROM ventes v
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document = 'paiement_credit'
  AND v.statut = 'valide'
  AND v.client_id = c.id
  AND v.client_id IS NOT NULL;

-- Supprimer les lignes de vente
DELETE FROM lignes_vente
WHERE vente_id IN (
    SELECT id FROM ventes WHERE DATE(date_vente) = '2025-12-28'
);

-- Supprimer les mouvements de stock associés (si nécessaire)
DELETE FROM mouvements_stock
WHERE motif LIKE '%Vente%'
  AND date_mouvement::date = '2025-12-28';

-- Supprimer les ventes
DELETE FROM ventes
WHERE DATE(date_vente) = '2025-12-28';

-- Afficher le résultat
SELECT 'Suppression terminée' as message;

-- Pour annuler les modifications, utilisez : ROLLBACK;
-- Pour confirmer les modifications, utilisez : COMMIT;

-- COMMIT; -- Décommentez cette ligne pour confirmer la suppression

