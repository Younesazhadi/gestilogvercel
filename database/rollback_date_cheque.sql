-- Script de rollback pour annuler les modifications liées aux chèques

-- Supprimer les index de la table rappels_cheques
DROP INDEX IF EXISTS idx_rappels_cheques_statut;
DROP INDEX IF EXISTS idx_rappels_cheques_date_rappel;
DROP INDEX IF EXISTS idx_rappels_cheques_client;
DROP INDEX IF EXISTS idx_rappels_cheques_magasin;

-- Supprimer la table rappels_cheques
DROP TABLE IF EXISTS rappels_cheques;

-- Supprimer les index liés à date_cheque dans la table ventes
DROP INDEX IF EXISTS idx_ventes_date_cheque;
DROP INDEX IF EXISTS idx_ventes_statut_cheque;

-- Supprimer le champ statut_cheque de la table ventes
ALTER TABLE ventes
DROP COLUMN IF EXISTS statut_cheque;

-- Supprimer le champ date_cheque de la table ventes
ALTER TABLE ventes
DROP COLUMN IF EXISTS date_cheque;






