import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const logActivity = async (
  req: AuthRequest,
  action: string,
  entite: string | null = null,
  entiteId: number | null = null,
  details: Record<string, any> | null = null
) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    await pool.query(
      `INSERT INTO logs_activite (magasin_id, user_id, action, entite, entite_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user?.magasinId || null,
        req.user?.userId || null,
        action,
        entite,
        entiteId,
        details ? JSON.stringify(details) : null,
        Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      ]
    );
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log:', error);
    // Ne pas bloquer la requête en cas d'erreur de log
  }
};

