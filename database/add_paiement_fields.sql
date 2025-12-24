-- Ajouter les champs pour la référence de paiement et le montant payé
ALTER TABLE ventes 
ADD COLUMN IF NOT EXISTS reference_paiement VARCHAR(100),
ADD COLUMN IF NOT EXISTS montant_paye DECIMAL(10,2);

-- Commentaires pour documentation
COMMENT ON COLUMN ventes.reference_paiement IS 'Référence du paiement (numéro de chèque, transaction, etc.)';
COMMENT ON COLUMN ventes.montant_paye IS 'Montant payé pour les ventes à crédit (reste = montant_ttc - montant_paye)';


