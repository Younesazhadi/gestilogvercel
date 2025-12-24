import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/multiTenant';
import { 
  loadUserPermissions,
  canViewProduits,
  canCreateProduits,
  canModifyProduits,
  canDeleteProduits,
  canViewStock,
  canCreateEntrees,
  canCreateSorties,
  canCreateAjustements,
  canViewVentes,
  canCreateVentes,
  canModifyVentes,
  canDeleteVentes,
  checkPermission
} from '../middleware/permissions';

// Contrôleurs
import * as produitsController from '../controllers/produitsController';
import * as stockController from '../controllers/stockController';
import * as ventesController from '../controllers/ventesController';
import * as clientsController from '../controllers/clientsController';
import * as fournisseursController from '../controllers/fournisseursController';
import * as usersController from '../controllers/usersController';
import * as dashboardController from '../controllers/dashboardController';
import * as chequesController from '../controllers/chequesController';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);
router.use(enforceTenantIsolation);
router.use(loadUserPermissions);

// Dashboard
router.get('/dashboard', dashboardController.getAdminDashboard);

// Produits
router.get('/produits', canViewProduits, produitsController.getProduits);
router.get('/produits/:id', canViewProduits, produitsController.getProduit);
router.post('/produits', canCreateProduits, produitsController.createProduit);
router.put('/produits/:id', canModifyProduits, produitsController.updateProduit);
router.delete('/produits/:id', canDeleteProduits, produitsController.deleteProduit);
router.get('/produits/alertes/stock', canViewStock, produitsController.getAlertes);

// Stock
router.post('/stock/entree', canCreateEntrees, stockController.createEntreeStock);
router.post('/stock/sortie', canCreateSorties, stockController.createSortieStock);
router.post('/stock/ajustement', canCreateAjustements, stockController.createAjustementStock);
router.get('/stock/mouvements', canViewStock, stockController.getMouvements);

// Ventes
router.get('/ventes', canViewVentes, ventesController.getVentes);
router.get('/ventes/:id', canViewVentes, ventesController.getVente);
router.post('/ventes', canCreateVentes, ventesController.createVente);
router.put('/ventes/:id/annuler', canDeleteVentes, ventesController.annulerVente);

// Clients
router.get('/clients', checkPermission('clients', 'consulter'), clientsController.getClients);
router.get('/clients/:id', checkPermission('clients', 'consulter'), clientsController.getClient);
router.post('/clients', checkPermission('clients', 'gerer'), clientsController.createClient);
router.put('/clients/:id', checkPermission('clients', 'gerer'), clientsController.updateClient);
router.delete('/clients/:id', requireAdmin, clientsController.deleteClient); // Seul admin peut supprimer
router.post('/clients/:id/paiement', checkPermission('clients', 'paiements'), clientsController.enregistrerPaiement);
router.post('/clients/:id/paiement-credit', checkPermission('clients', 'paiements'), clientsController.payerCreditClient);

// Fournisseurs
router.get('/fournisseurs', checkPermission('fournisseurs', 'consulter'), fournisseursController.getFournisseurs);
router.get('/fournisseurs/:id', checkPermission('fournisseurs', 'consulter'), fournisseursController.getFournisseur);
router.post('/fournisseurs', checkPermission('fournisseurs', 'gerer'), fournisseursController.createFournisseur);
router.put('/fournisseurs/:id', checkPermission('fournisseurs', 'gerer'), fournisseursController.updateFournisseur);
router.delete('/fournisseurs/:id', requireAdmin, fournisseursController.deleteFournisseur); // Seul admin peut supprimer

// Utilisateurs (employés) - Seul admin peut gérer
router.get('/users', requireAdmin, usersController.getUsers);
router.get('/users/:id', requireAdmin, usersController.getUser);
router.post('/users', requireAdmin, usersController.createUser);
router.put('/users/:id', requireAdmin, usersController.updateUser);
router.delete('/users/:id', requireAdmin, usersController.deleteUser);

// Chèques
router.get('/cheques', canViewVentes, chequesController.getCheques);
router.patch('/cheques/:id/statut', canModifyVentes, chequesController.updateStatutCheque);

export default router;

