import { Router } from 'express';
import {
  getRapportVentes,
  getVentesParCategorie,
  getVentesParUtilisateur,
  getRapportFinancier,
  getRapportStock,
  getTopProduits,
} from '../controllers/rapportsController';
import { authenticate } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/multiTenant';
import { loadUserPermissions, checkPermission } from '../middleware/permissions';

const router = Router();

router.use(authenticate);
router.use(enforceTenantIsolation);
router.use(loadUserPermissions);

// Toutes les routes de rapports nécessitent la permission de consulter les rapports
router.get('/ventes', checkPermission('rapports', 'ventes'), getRapportVentes);
router.get('/ventes/categories', checkPermission('rapports', 'ventes'), getVentesParCategorie);
router.get('/ventes/utilisateurs', checkPermission('rapports', 'ventes'), getVentesParUtilisateur);
router.get('/financier', checkPermission('rapports', 'financiers'), getRapportFinancier);
router.get('/stock', checkPermission('rapports', 'stock'), getRapportStock);
router.get('/top-produits', checkPermission('rapports', 'ventes'), getTopProduits);

export default router;

