import pool from '../config/database';

export const updateExpiredSubscriptions = async () => {
  try {
    const result = await pool.query(
      `UPDATE magasins
       SET statut = 'expire'
       WHERE date_expiration_abonnement < CURRENT_DATE
       AND statut != 'expire'
       RETURNING id, nom_magasin, date_expiration_abonnement, statut`
    );
    if (result.rows.length > 0) {
      console.log(`[CRON] ${result.rows.length} abonnements expirés mis à jour.`);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des abonnements expirés:', error);
  }
};

export const getExpiringSubscriptions = async (days: number) => {
  const result = await pool.query(
    `SELECT id, nom_magasin, email, date_expiration_abonnement
     FROM magasins
     WHERE date_expiration_abonnement BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * $1
     AND statut = 'actif'
     ORDER BY date_expiration_abonnement ASC`,
    [days]
  );
  return result.rows;
};

export const getExpiredSubscriptions = async () => {
  const result = await pool.query(
    `SELECT id, nom_magasin, email, date_expiration_abonnement, statut
     FROM magasins
     WHERE date_expiration_abonnement < CURRENT_DATE
     AND statut != 'suspendu'
     ORDER BY date_expiration_abonnement DESC`
  );
  return result.rows;
};

