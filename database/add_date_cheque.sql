-- Ajouter le champ date_cheque à la table ventes
ALTER TABLE ventes
ADD COLUMN IF NOT EXISTS date_cheque DATE;

-- Ajouter le champ statut_cheque pour gérer l'état du chèque
ALTER TABLE ventes
ADD COLUMN IF NOT EXISTS statut_cheque VARCHAR(20) DEFAULT NULL; -- 'en_attente', 'depose', 'paye', 'impaye'

COMMENT ON COLUMN ventes.date_cheque IS 'Date du chèque pour les paiements par chèque';
COMMENT ON COLUMN ventes.statut_cheque IS 'Statut du chèque: en_attente, depose, paye, impaye';

-- Index pour faciliter les recherches de chèques
CREATE INDEX IF NOT EXISTS idx_ventes_date_cheque ON ventes(date_cheque) WHERE mode_paiement = 'cheque';
CREATE INDEX IF NOT EXISTS idx_ventes_statut_cheque ON ventes(statut_cheque) WHERE mode_paiement = 'cheque';

-- NOTE: Si vous avez déjà exécuté le script avec la table rappels_cheques,
-- utilisez le script rollback_date_cheque.sql pour l'annuler

