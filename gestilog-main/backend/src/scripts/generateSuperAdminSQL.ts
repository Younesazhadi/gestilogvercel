import bcrypt from 'bcrypt';

/**
 * Script pour générer le SQL d'insertion d'un super admin
 * Usage: npm run generate-super-admin-sql [email] [password] [nom] [prenom]
 */
const generateSuperAdminSQL = async () => {
  const email = process.argv[2] || 'admin@gestilog.com';
  const password = process.argv[3] || 'admin123';
  const nom = process.argv[4] || 'Super';
  const prenom = process.argv[5] || 'Admin';

  try {
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer le SQL
    const sql = `-- Super Admin Account
-- Email: ${email}
-- Password: ${password}
-- ⚠️  IMPORTANT: Changez le mot de passe après la première connexion !

INSERT INTO users (nom, prenom, email, mot_de_passe, role)
VALUES ('${nom}', '${prenom}', '${email}', '${hashedPassword}', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Vérifier la création
SELECT id, nom, prenom, email, role, created_at 
FROM users 
WHERE email = '${email}';`;

    console.log('\n📋 SQL à exécuter dans votre base de données:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n💡 Instructions:');
    console.log('   1. Connectez-vous à votre base de données PostgreSQL');
    console.log('   2. Copiez et exécutez le SQL ci-dessus');
    console.log('   3. Vérifiez que le compte a été créé avec la requête SELECT');
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !\n');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

generateSuperAdminSQL();




