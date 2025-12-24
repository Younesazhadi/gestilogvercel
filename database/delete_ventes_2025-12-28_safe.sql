-- Script SÉCURISÉ pour supprimer les opérations (ventes) du 28/12/2025
-- Ce script affiche d'abord les données avant de supprimer
-- Exécutez d'abord les requêtes SELECT pour vérifier, puis décommentez les DELETE

-- ============================================
-- ÉTAPE 1 : VÉRIFICATION (Exécutez d'abord)
-- ============================================

-- Afficher toutes les ventes du 28/12/2025 avec leurs détails
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
    c.nom as client_nom,
    COUNT(lv.id) as nb_lignes,
    SUM(lv.quantite) as total_quantite
FROM ventes v
LEFT JOIN clients c ON v.client_id = c.id
LEFT JOIN lignes_vente lv ON v.id = lv.vente_id
WHERE DATE(v.date_vente) = '2025-12-28'
GROUP BY v.id, v.numero_vente, v.type_document, v.date_vente, 
         v.montant_ht, v.montant_tva, v.montant_ttc, v.mode_paiement, 
         v.statut, c.nom
ORDER BY v.date_vente;

-- Compter le nombre de ventes à supprimer
SELECT COUNT(*) as nb_ventes_a_supprimer
FROM ventes
WHERE DATE(date_vente) = '2025-12-28';

-- Compter le nombre de lignes de vente à supprimer
SELECT COUNT(*) as nb_lignes_a_supprimer
FROM lignes_vente
WHERE vente_id IN (
    SELECT id FROM ventes WHERE DATE(date_vente) = '2025-12-28'
);

-- Afficher les produits qui seront affectés (stock restauré)
SELECT 
    p.id,
    p.nom,
    p.stock_actuel as stock_actuel,
    SUM(lv.quantite) as quantite_a_restaurer,
    (p.stock_actuel + SUM(lv.quantite)) as nouveau_stock
FROM produits p
JOIN lignes_vente lv ON p.id = lv.produit_id
JOIN ventes v ON lv.vente_id = v.id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document != 'devis'
  AND v.type_document != 'paiement_credit'
  AND v.type_document != 'paiement_cheque'
  AND v.statut = 'valide'
GROUP BY p.id, p.nom, p.stock_actuel
ORDER BY p.nom;

-- Afficher les clients qui seront affectés (crédit restauré)
SELECT 
    c.id,
    c.nom,
    c.solde as solde_actuel,
    CASE 
        WHEN v.mode_paiement = 'credit' THEN -(v.montant_ttc - COALESCE(v.montant_paye, 0))
        WHEN v.type_document = 'paiement_credit' THEN v.montant_ttc
        ELSE 0
    END as modification_solde
FROM clients c
JOIN ventes v ON c.id = v.client_id
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.statut = 'valide'
  AND (
    v.mode_paiement = 'credit' 
    OR v.type_document = 'paiement_credit'
  )
ORDER BY c.nom;

-- ============================================
-- ÉTAPE 2 : SUPPRESSION (Décommentez après vérification)
-- ============================================

BEGIN;

-- 1. Restaurer le stock pour les ventes normales (pas devis, pas paiements)
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

-- 2. Restaurer le crédit client pour les ventes à crédit
UPDATE clients c
SET solde = c.solde - (v.montant_ttc - COALESCE(v.montant_paye, 0))
FROM ventes v
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.mode_paiement = 'credit'
  AND v.statut = 'valide'
  AND v.client_id = c.id
  AND v.client_id IS NOT NULL;

-- 3. Restaurer le crédit client pour les paiements de crédit (remettre le montant au solde)
UPDATE clients c
SET solde = c.solde + v.montant_ttc
FROM ventes v
WHERE DATE(v.date_vente) = '2025-12-28'
  AND v.type_document = 'paiement_credit'
  AND v.statut = 'valide'
  AND v.client_id = c.id
  AND v.client_id IS NOT NULL;

-- 4. Supprimer les lignes de vente
DELETE FROM lignes_vente
WHERE vente_id IN (
    SELECT id FROM ventes WHERE DATE(date_vente) = '2025-12-28'
);

-- 5. Supprimer les mouvements de stock associés
DELETE FROM mouvements_stock
WHERE motif LIKE '%Vente%'
  AND DATE(date_mouvement) = '2025-12-28';

-- 6. Supprimer les ventes
DELETE FROM ventes
WHERE DATE(date_vente) = '2025-12-28';

-- Vérification finale
SELECT 'Suppression terminée' as message,
       COUNT(*) as ventes_restantes_28_12_2025
FROM ventes
WHERE DATE(date_vente) = '2025-12-28';

-- Pour annuler : ROLLBACK;
-- Pour confirmer : COMMIT;

-- COMMIT; -- Décommentez cette ligne pour confirmer la suppression

