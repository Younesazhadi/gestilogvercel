-- ============================================
-- SCHÉMA POUR LA FONCTIONNALITÉ MULTI-MAGASINS
-- ============================================
-- Cette fonctionnalité permet à un utilisateur (admin) de gérer plusieurs magasins
-- Uniquement disponible pour les plans avec la fonctionnalité "multi_magasins"

-- Table de liaison entre utilisateurs et magasins (many-to-many)
-- Un utilisateur peut être associé à plusieurs magasins
CREATE TABLE IF NOT EXISTS users_magasins (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'admin', -- admin, user (rôle dans ce magasin spécifique)
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, magasin_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_magasins_user ON users_magasins(user_id);
CREATE INDEX IF NOT EXISTS idx_users_magasins_magasin ON users_magasins(magasin_id);

-- Table pour stocker le magasin actif de l'utilisateur (session)
-- Cette table peut être utilisée pour stocker la préférence de l'utilisateur
-- ou on peut utiliser localStorage côté frontend
CREATE TABLE IF NOT EXISTS user_magasin_actif (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  magasin_id INT REFERENCES magasins(id) ON DELETE CASCADE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonction pour vérifier si un utilisateur a accès à un magasin
CREATE OR REPLACE FUNCTION user_has_access_to_magasin(
  p_user_id INT,
  p_magasin_id INT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin a accès à tout
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'super_admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si l'utilisateur a accès direct (magasin_id dans users)
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND magasin_id = p_magasin_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si l'utilisateur a accès via users_magasins
  IF EXISTS (
    SELECT 1 FROM users_magasins 
    WHERE user_id = p_user_id 
    AND magasin_id = p_magasin_id 
    AND actif = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Vue pour obtenir tous les magasins accessibles par un utilisateur
CREATE OR REPLACE VIEW v_user_magasins AS
SELECT DISTINCT
  u.id as user_id,
  m.id as magasin_id,
  m.nom_magasin,
  m.email as magasin_email,
  m.statut,
  m.plan_id,
  p.nom as plan_nom,
  CASE 
    WHEN u.magasin_id = m.id THEN 'principal'
    ELSE 'secondaire'
  END as type_acces,
  um.role as role_dans_magasin
FROM users u
LEFT JOIN magasins m ON (
  u.magasin_id = m.id OR 
  EXISTS (SELECT 1 FROM users_magasins um2 WHERE um2.user_id = u.id AND um2.magasin_id = m.id AND um2.actif = true)
)
LEFT JOIN users_magasins um ON um.user_id = u.id AND um.magasin_id = m.id
LEFT JOIN plans p ON m.plan_id = p.id
WHERE u.role != 'super_admin' OR m.id IS NOT NULL;




