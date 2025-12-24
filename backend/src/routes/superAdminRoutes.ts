import { Router } from 'express';
import {
  getMagasins,
  getMagasin,
  createMagasin,
  updateMagasin,
  deleteMagasin,
  createAdminForMagasin,
  getMagasinStatsForDeletion,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPaiements,
  createPaiement,
  getSuperAdminStats,
  updateSubscriptionsStatus,
} from '../controllers/superAdminController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent l'authentification et le rôle super_admin
router.use(authenticate);
router.use(requireSuperAdmin);

// Statistiques
router.get('/stats', getSuperAdminStats);

// Abonnements
router.post('/subscriptions/update-status', updateSubscriptionsStatus);

// Magasins
router.get('/magasins', getMagasins);
router.get('/magasins/:id', getMagasin);
router.get('/magasins/:id/stats-deletion', getMagasinStatsForDeletion);
router.post('/magasins', createMagasin);
router.put('/magasins/:id', updateMagasin);
router.delete('/magasins/:id', deleteMagasin);
router.post('/magasins/:id/admin', createAdminForMagasin);

// Plans
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// Paiements
router.get('/paiements', getPaiements);
router.post('/paiements', createPaiement);

export default router;

