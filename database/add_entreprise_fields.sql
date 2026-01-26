-- Ajout des champs supplémentaires pour les informations de l'entreprise
-- Exécuter ce script pour ajouter les colonnes manquantes à la table magasins

ALTER TABLE magasins
ADD COLUMN IF NOT EXISTS proprietaire VARCHAR(255),
ADD COLUMN IF NOT EXISTS activites TEXT,
ADD COLUMN IF NOT EXISTS ville VARCHAR(100),
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(20),
ADD COLUMN IF NOT EXISTS telephone_fixe VARCHAR(20),
ADD COLUMN IF NOT EXISTS telephone_gsm VARCHAR(20),
ADD COLUMN IF NOT EXISTS patent VARCHAR(50),
ADD COLUMN IF NOT EXISTS if_fiscal VARCHAR(50),
ADD COLUMN IF NOT EXISTS cnss VARCHAR(50),
ADD COLUMN IF NOT EXISTS compte_bancaire VARCHAR(100);

-- Commentaires pour documentation
COMMENT ON COLUMN magasins.proprietaire IS 'Propriétaire / Gérant de l''entreprise';
COMMENT ON COLUMN magasins.activites IS 'Description des activités de l''entreprise';
COMMENT ON COLUMN magasins.ville IS 'Ville de l''entreprise';
COMMENT ON COLUMN magasins.code_postal IS 'Code postal';
COMMENT ON COLUMN magasins.telephone_fixe IS 'Téléphone fixe';
COMMENT ON COLUMN magasins.telephone_gsm IS 'Téléphone GSM';
COMMENT ON COLUMN magasins.patent IS 'Numéro de patente';
COMMENT ON COLUMN magasins.if_fiscal IS 'Identification Fiscale';
COMMENT ON COLUMN magasins.cnss IS 'Numéro CNSS';
COMMENT ON COLUMN magasins.compte_bancaire IS 'Compte bancaire';


