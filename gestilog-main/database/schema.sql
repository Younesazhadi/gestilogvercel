-- Schema de base de données pour Gestilog
-- PostgreSQL

-- Table des plans/packs
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  prix_mensuel DECIMAL(10,2) NOT NULL,
  nb_utilisateurs_max INT NOT NULL,
  nb_produits_max INT,
  fonctionnalites JSONB,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des magasins (clients)
CREATE TABLE IF NOT EXISTS magasins (
  id SERIAL PRIMARY KEY,
  nom_magasin VARCHAR(255) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  ice VARCHAR(50),
  rc VARCHAR(50),
  plan_id INT REFERENCES plans(id),
  statut VARCHAR(20) DEFAULT 'actif', -- actif, suspendu, expire
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration_abonnement TIMESTAMP,
  notes TEXT
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE, -- NULL pour super admin
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- super_admin, admin, user
  permissions JSONB, -- pour les utilisateurs normaux
  actif BOOLEAN DEFAULT true,
  derniere_connexion TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(magasin_id, email)
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL,
  date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  methode_paiement VARCHAR(50),
  statut VARCHAR(20) DEFAULT 'en_attente', -- paye, en_attente, echoue
  periode_debut DATE,
  periode_fin DATE,
  reference VARCHAR(100),
  notes TEXT
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INT REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(magasin_id, nom)
);

-- Table des produits
CREATE TABLE IF NOT EXISTS produits (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  code_barre VARCHAR(100),
  reference VARCHAR(100),
  categorie_id INT REFERENCES categories(id),
  description TEXT,
  prix_achat DECIMAL(10,2),
  prix_vente DECIMAL(10,2) NOT NULL,
  stock_actuel DECIMAL(10,2) DEFAULT 0,
  stock_min DECIMAL(10,2) DEFAULT 0,
  unite VARCHAR(20) DEFAULT 'unité', -- unité, kg, litre, etc.
  emplacement VARCHAR(100),
  image_url VARCHAR(500),
  date_peremption DATE,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour produits
CREATE INDEX IF NOT EXISTS idx_produits_magasin_code_barre ON produits(magasin_id, code_barre);
CREATE INDEX IF NOT EXISTS idx_produits_magasin_nom ON produits(magasin_id, nom);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  contact_nom VARCHAR(100),
  telephone VARCHAR(20),
  email VARCHAR(255),
  adresse TEXT,
  ice VARCHAR(50),
  ville VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(255),
  adresse TEXT,
  ice VARCHAR(50),
  credit_autorise DECIMAL(10,2) DEFAULT 0,
  solde DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  produit_id INT REFERENCES produits(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- entree, sortie, ajustement, inventaire
  quantite DECIMAL(10,2) NOT NULL,
  prix_unitaire DECIMAL(10,2),
  fournisseur_id INT REFERENCES fournisseurs(id),
  reference_doc VARCHAR(100), -- n° BL, facture, etc.
  user_id INT REFERENCES users(id),
  date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motif TEXT
);

-- Index pour mouvements_stock
CREATE INDEX IF NOT EXISTS idx_mouvements_magasin_produit ON mouvements_stock(magasin_id, produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_magasin_date ON mouvements_stock(magasin_id, date_mouvement);

-- Table des ventes
CREATE TABLE IF NOT EXISTS ventes (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  numero_vente VARCHAR(50) NOT NULL,
  type_document VARCHAR(20) DEFAULT 'ticket', -- ticket, facture, devis, bl
  client_id INT REFERENCES clients(id),
  user_id INT REFERENCES users(id),
  date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  montant_ht DECIMAL(10,2),
  montant_tva DECIMAL(10,2),
  montant_ttc DECIMAL(10,2) NOT NULL,
  remise DECIMAL(10,2) DEFAULT 0,
  mode_paiement VARCHAR(50), -- especes, carte, cheque, credit, virement
  statut VARCHAR(20) DEFAULT 'valide', -- valide, annule, brouillon
  notes TEXT,
  UNIQUE(magasin_id, numero_vente)
);

-- Index pour ventes
CREATE INDEX IF NOT EXISTS idx_ventes_magasin_numero ON ventes(magasin_id, numero_vente);
CREATE INDEX IF NOT EXISTS idx_ventes_magasin_date ON ventes(magasin_id, date_vente);

-- Table des lignes de vente
CREATE TABLE IF NOT EXISTS lignes_vente (
  id SERIAL PRIMARY KEY,
  vente_id INT REFERENCES ventes(id) ON DELETE CASCADE,
  produit_id INT REFERENCES produits(id),
  designation VARCHAR(255) NOT NULL,
  quantite DECIMAL(10,2) NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  tva DECIMAL(5,2) DEFAULT 0,
  remise DECIMAL(10,2) DEFAULT 0,
  montant_total DECIMAL(10,2) NOT NULL
);

-- Table des bons de commande fournisseurs
CREATE TABLE IF NOT EXISTS commandes_fournisseurs (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  numero_commande VARCHAR(50) NOT NULL,
  fournisseur_id INT REFERENCES fournisseurs(id),
  user_id INT REFERENCES users(id),
  date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_livraison_prevue DATE,
  statut VARCHAR(20) DEFAULT 'en_attente', -- en_attente, livree, annulee
  montant_total DECIMAL(10,2),
  notes TEXT,
  UNIQUE(magasin_id, numero_commande)
);

-- Table des lignes de commande fournisseur
CREATE TABLE IF NOT EXISTS lignes_commande (
  id SERIAL PRIMARY KEY,
  commande_id INT REFERENCES commandes_fournisseurs(id) ON DELETE CASCADE,
  produit_id INT REFERENCES produits(id),
  designation VARCHAR(255) NOT NULL,
  quantite DECIMAL(10,2) NOT NULL,
  prix_unitaire DECIMAL(10,2),
  montant_total DECIMAL(10,2)
);

-- Table de logs d'activité
CREATE TABLE IF NOT EXISTS logs_activite (
  id SERIAL PRIMARY KEY,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entite VARCHAR(50), -- produit, vente, client, etc.
  entite_id INT,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour logs_activite
CREATE INDEX IF NOT EXISTS idx_logs_magasin_date ON logs_activite(magasin_id, created_at);

-- Insertion des plans par défaut
-- Pack 1: Basique - 2,000 DH (fonctionnalités limitées)
-- Pack 2: Standard - 3,000 DH (fonctionnalités moyennes)
-- Pack 3: Premium - 4,000 DH (toutes les fonctionnalités)
INSERT INTO plans (nom, prix_mensuel, nb_utilisateurs_max, nb_produits_max, fonctionnalites) VALUES
('Basique', 2000.00, 2, 500, '{"rapports_basiques": true, "alertes_stock": true}'),
('Standard', 3000.00, 5, 2000, '{"rapports_basiques": true, "rapports_avances": true, "alertes_stock": true, "gestion_fournisseurs": true, "factures": true}'),
('Premium', 4000.00, 99, NULL, '{"rapports_basiques": true, "rapports_avances": true, "alertes_stock": true, "gestion_fournisseurs": true, "factures": true, "multi_magasins": true, "api_access": true, "support_prioritaire": true, "tout_inclus": true}')
ON CONFLICT DO NOTHING;

-- Créer un super admin par défaut (mot de passe: admin123 - À CHANGER EN PRODUCTION)
-- Le mot de passe doit être hashé avec bcrypt
-- INSERT INTO users (nom, prenom, email, mot_de_passe, role) VALUES
-- ('Super', 'Admin', 'admin@gestilog.com', '$2b$10$...', 'super_admin');

