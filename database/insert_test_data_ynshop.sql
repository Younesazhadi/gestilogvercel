-- Script pour ajouter 5 clients et 10 produits au magasin "ynshop"
-- Exécuter ce script dans PostgreSQL

-- 1. Récupérer l'ID du magasin "ynshop"
DO $$
DECLARE
    magasin_id_var INT;
BEGIN
    -- Récupérer l'ID du magasin "ynshop"
    SELECT id INTO magasin_id_var FROM magasins WHERE LOWER(nom_magasin) = LOWER('ynshop');
    
    IF magasin_id_var IS NULL THEN
        RAISE EXCEPTION 'Magasin "ynshop" introuvable. Veuillez vérifier que le magasin existe.';
    END IF;
    
    RAISE NOTICE 'Magasin trouvé: ID = %', magasin_id_var;
    
    -- 2. Insérer 5 clients
    INSERT INTO clients (magasin_id, nom, telephone, email, adresse, ice, credit_autorise, solde, notes)
    VALUES
        (magasin_id_var, 'Ahmed Benali', '0612345678', 'ahmed.benali@email.com', '123 Rue Mohammed V, Casablanca', '123456789012345', 5000.00, 0.00, 'Client régulier'),
        (magasin_id_var, 'Fatima Alami', '0623456789', 'fatima.alami@email.com', '45 Avenue Hassan II, Rabat', '234567890123456', 3000.00, 0.00, 'Client VIP'),
        (magasin_id_var, 'Youssef Idrissi', '0634567890', 'youssef.idrissi@email.com', '78 Boulevard Zerktouni, Casablanca', '345678901234567', 10000.00, 0.00, 'Client entreprise'),
        (magasin_id_var, 'Aicha Bensaid', '0645678901', 'aicha.bensaid@email.com', '12 Rue Allal Ben Abdellah, Fès', '456789012345678', 2000.00, 0.00, 'Client occasionnel'),
        (magasin_id_var, 'Mohamed Tazi', '0656789012', 'mohamed.tazi@email.com', '56 Avenue Mohammed VI, Marrakech', '567890123456789', 7500.00, 0.00, 'Client fidèle')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '5 clients insérés avec succès';
    
    -- 3. Insérer 10 produits
    INSERT INTO produits (magasin_id, nom, code_barre, reference, categorie_id, description, prix_achat, prix_vente, stock_actuel, stock_min, unite, emplacement, actif)
    VALUES
        (magasin_id_var, 'Ordinateur Portable HP 15', '1234567890123', 'PROD-001', NULL, 'Ordinateur portable HP 15 pouces, 8GB RAM, 256GB SSD', 3500.00, 4500.00, 15, 5, 'unité', 'Rayon A1', true),
        (magasin_id_var, 'Smartphone Samsung Galaxy A54', '2345678901234', 'PROD-002', NULL, 'Smartphone Android 128GB, 6GB RAM', 2800.00, 3500.00, 25, 10, 'unité', 'Rayon B2', true),
        (magasin_id_var, 'Écouteurs Bluetooth Sony', '3456789012345', 'PROD-003', NULL, 'Écouteurs sans fil avec réduction de bruit', 450.00, 650.00, 50, 15, 'unité', 'Rayon C3', true),
        (magasin_id_var, 'Souris Logitech MX Master 3', '4567890123456', 'PROD-004', NULL, 'Souris sans fil ergonomique pour professionnels', 350.00, 550.00, 30, 10, 'unité', 'Rayon A2', true),
        (magasin_id_var, 'Clavier Mécanique RGB', '5678901234567', 'PROD-005', NULL, 'Clavier mécanique avec rétroéclairage RGB', 400.00, 600.00, 20, 8, 'unité', 'Rayon A2', true),
        (magasin_id_var, 'Webcam HD 1080p', '6789012345678', 'PROD-006', NULL, 'Webcam haute définition pour visioconférence', 250.00, 400.00, 35, 12, 'unité', 'Rayon B3', true),
        (magasin_id_var, 'Disque Dur Externe 1TB', '7890123456789', 'PROD-007', NULL, 'Disque dur externe USB 3.0, 1TB', 380.00, 550.00, 18, 6, 'unité', 'Rayon C2', true),
        (magasin_id_var, 'Câble HDMI 2.0 2m', '8901234567890', 'PROD-008', NULL, 'Câble HDMI haute vitesse 2 mètres', 45.00, 80.00, 100, 30, 'unité', 'Rayon D1', true),
        (magasin_id_var, 'Chargeur USB-C Rapide', '9012345678901', 'PROD-009', NULL, 'Chargeur rapide USB-C 65W avec câble', 120.00, 200.00, 40, 15, 'unité', 'Rayon D2', true),
        (magasin_id_var, 'Housse Protection Ordinateur', '0123456789012', 'PROD-010', NULL, 'Housse de protection 15 pouces, imperméable', 80.00, 150.00, 60, 20, 'unité', 'Rayon E1', true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '10 produits insérés avec succès';
    
    RAISE NOTICE 'Script terminé avec succès!';
END $$;

-- Vérification des données insérées
SELECT 'Clients insérés:' as info, COUNT(*) as nombre FROM clients WHERE magasin_id = (SELECT id FROM magasins WHERE LOWER(nom_magasin) = LOWER('ynshop'))
UNION ALL
SELECT 'Produits insérés:', COUNT(*) FROM produits WHERE magasin_id = (SELECT id FROM magasins WHERE LOWER(nom_magasin) = LOWER('ynshop'));






