import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const testProduits = async () => {
  try {
    // Tester la connexion
    const testConnection = await pool.query('SELECT NOW()');
    console.log('✅ Connexion DB OK:', testConnection.rows[0]);

    // Lister tous les magasins
    const magasins = await pool.query('SELECT id, nom_magasin, email FROM magasins');
    console.log('\n📦 Magasins trouvés:', magasins.rows.length);
    magasins.rows.forEach((m) => {
      console.log(`  - ${m.nom_magasin} (ID: ${m.id}, Email: ${m.email})`);
    });

    // Pour chaque magasin, compter les produits
    for (const magasin of magasins.rows) {
      const produits = await pool.query(
        'SELECT COUNT(*) as count FROM produits WHERE magasin_id = $1',
        [magasin.id]
      );
      console.log(`  Produits pour ${magasin.nom_magasin}: ${produits.rows[0].count}`);
    }

    // Lister tous les produits
    const tousProduits = await pool.query('SELECT id, nom, magasin_id FROM produits LIMIT 10');
    console.log('\n📦 Produits trouvés (premiers 10):', tousProduits.rows.length);
    tousProduits.rows.forEach((p) => {
      console.log(`  - ${p.nom} (Magasin ID: ${p.magasin_id})`);
    });

    // Lister les utilisateurs
    const users = await pool.query('SELECT id, nom, email, role, magasin_id FROM users');
    console.log('\n👥 Utilisateurs trouvés:', users.rows.length);
    users.rows.forEach((u) => {
      console.log(`  - ${u.nom} (${u.email}) - Role: ${u.role} - Magasin ID: ${u.magasin_id}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await pool.end();
  }
};

testProduits();

