import bcrypt from 'bcrypt';
import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
  const email = process.argv[2] || 'admin@gestilog.com';
  const password = process.argv[3] || 'admin123';
  const nom = process.argv[4] || 'Super';
  const prenom = process.argv[5] || 'Admin';

  // Vérifier que DATABASE_URL est défini
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erreur: DATABASE_URL n\'est pas défini dans les variables d\'environnement.');
    console.error('💡 Créez un fichier .env dans le dossier backend/ avec:');
    console.error('   DATABASE_URL=postgresql://user:password@localhost:5432/gestilog');
    process.exit(1);
  }

  try {
    // Vérifier si un super admin existe déjà
    const existing = await pool.query(
      "SELECT id FROM users WHERE role = 'super_admin'"
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Un super admin existe déjà.');
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le super admin
    const result = await pool.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, role)
       VALUES ($1, $2, $3, $4, 'super_admin')
       RETURNING id, nom, prenom, email, role`,
      [nom, prenom, email, hashedPassword]
    );

    console.log('✅ Super admin créé avec succès !');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('❌ Erreur: Cet email est déjà utilisé.');
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
      console.error('❌ Erreur: Impossible de se connecter à la base de données.');
      console.error('💡 Vérifiez que:');
      console.error('   1. PostgreSQL est démarré');
      console.error('   2. La base de données existe');
      console.error('   3. Le DATABASE_URL dans .env est correct');
      console.error('   Erreur détaillée:', error.message);
    } else {
      console.error('❌ Erreur:', error.message);
      if (error.stack) {
        console.error('Stack:', error.stack);
      }
    }
  } finally {
    await pool.end();
  }
};

createSuperAdmin();

