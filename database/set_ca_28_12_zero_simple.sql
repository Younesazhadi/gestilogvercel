-- Requête SIMPLE pour mettre le CA du 28/12/2025 à 0
-- Copiez-collez dans pgAdmin Query Tool et exécutez

-- Mettre tous les montants à 0 pour le 28/12/2025
UPDATE ventes
SET 
    montant_ht = 0,
    montant_tva = 0,
    montant_ttc = 0
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide';

-- Vérifier que le CA est maintenant 0
SELECT 
    COALESCE(SUM(montant_ttc), 0) as ca_28_12
FROM ventes
WHERE DATE(date_vente) = '2025-12-28'
  AND statut = 'valide'
  AND (
    type_document = 'paiement_cheque'
    OR (type_document = 'paiement_credit' AND mode_paiement != 'cheque')
    OR (mode_paiement IS NULL OR (mode_paiement != 'credit' AND mode_paiement != 'cheque'))
  );

