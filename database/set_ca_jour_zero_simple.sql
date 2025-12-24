-- Requête SIMPLE pour mettre le CA du jour à 0
-- Exécutez cette requête dans pgAdmin Query Tool

BEGIN;

-- Mettre tous les montants à 0 pour les ventes d'aujourd'hui
UPDATE ventes
SET 
    montant_ht = 0,
    montant_tva = 0,
    montant_ttc = 0
WHERE DATE(date_vente) = CURRENT_DATE
  AND statut = 'valide';

-- Vérifier que le CA est maintenant 0
SELECT 
    COALESCE(SUM(montant_ttc), 0) as ca_du_jour
FROM ventes
WHERE DATE(date_vente) = CURRENT_DATE
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

-- COMMIT; -- Décommentez pour confirmer
-- ROLLBACK; -- Utilisez pour annuler

