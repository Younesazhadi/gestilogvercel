import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../pages/user/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import ProduitsList from '../pages/admin/ProduitsList';
import ProduitForm from '../pages/admin/ProduitForm';
import VentesList from '../pages/admin/VentesList';
import VenteDetails from '../pages/admin/VenteDetails';
import POS from '../pages/admin/POS';
import StockMouvements from '../pages/admin/StockMouvements';
import ClientsList from '../pages/admin/ClientsList';
import FournisseursList from '../pages/admin/FournisseursList';
import Rapports from '../pages/admin/Rapports';
import Documents from '../pages/admin/Documents';

const UserLayout = () => {
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const planFeatures = user?.planFeatures || {};

  // Debug: Log permissions to see what we're working with
  if (user?.role === 'user') {
    console.log('User permissions:', permissions);
    console.log('Plan features:', planFeatures);
  }

  // Mapping entre les menus et les permissions requises
  const allMenuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: 'LayoutDashboard',
      requiredPermission: null // Toujours accessible
    },
    { 
      path: '/ventes', 
      label: 'Opérations', 
      icon: 'ShoppingCart',
      requiredPermission: 'ventes.consulter'
    },
    { 
      path: '/pos', 
      label: 'Caisse', 
      icon: 'CashRegister',
      requiredPermission: 'ventes.creer' // Pour utiliser le POS, il faut pouvoir créer des ventes
    },
    { 
      path: '/produits', 
      label: 'Produits', 
      icon: 'Package',
      requiredPermission: 'produits.consulter'
    },
    { 
      path: '/stock', 
      label: 'Stock', 
      icon: 'Warehouse',
      requiredPermission: 'stock.consulter'
    },
    { 
      path: '/clients', 
      label: 'Clients', 
      icon: 'Users',
      requiredPermission: 'clients.consulter'
    },
    { 
      path: '/fournisseurs', 
      label: 'Fournisseurs', 
      icon: 'Truck',
      requiredPermission: 'fournisseurs.consulter'
    },
    { 
      path: '/rapports', 
      label: 'Rapports', 
      icon: 'BarChart',
      requiredPermission: 'rapports.consulter'
    },
    { 
      path: '/documents', 
      label: 'Documents', 
      icon: 'FileText',
      requiredPermission: 'documents.generer'
    },
  ];

  // Filtrer les menus selon les permissions de l'utilisateur
  // Si l'utilisateur est admin ou super_admin, tout est accessible
  // Sinon, vérifier chaque permission requise
  const menuItems = allMenuItems.filter(item => {
    // Admin et super_admin ont accès à tout
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return true;
    }

    // Dashboard toujours accessible
    if (item.path === '/dashboard' || !item.requiredPermission) {
      return true;
    }

    // Vérifier la permission requise
    const hasPermission = permissions[item.requiredPermission] === true;
    
    // Vérifier aussi si la fonctionnalité du plan est activée
    // (car même avec la permission, si le plan ne l'a pas, on ne peut pas l'utiliser)
    let hasPlanFeature = true;
    if (item.requiredPermission === 'ventes.consulter' || item.requiredPermission === 'ventes.creer') {
      hasPlanFeature = planFeatures.ventes_consulter === true || planFeatures.ventes_pos === true || planFeatures.tout_inclus === true;
    } else if (item.requiredPermission === 'produits.consulter') {
      hasPlanFeature = planFeatures.produits_consulter === true || planFeatures.tout_inclus === true;
    } else if (item.requiredPermission === 'stock.consulter') {
      hasPlanFeature = planFeatures.stock_consulter === true || planFeatures.tout_inclus === true;
    } else if (item.requiredPermission === 'clients.consulter') {
      hasPlanFeature = planFeatures.clients_consulter === true || planFeatures.tout_inclus === true;
    } else if (item.requiredPermission === 'fournisseurs.consulter') {
      hasPlanFeature = planFeatures.fournisseurs_consulter === true || planFeatures.tout_inclus === true;
    } else if (item.requiredPermission === 'rapports.consulter') {
      hasPlanFeature = planFeatures.rapports_basiques === true || planFeatures.rapports_avances === true || planFeatures.tout_inclus === true;
    } else if (item.requiredPermission === 'documents.generer') {
      // Vérifier les fonctionnalités des documents (factures, devis, BL, tickets)
      const hasDocuments = planFeatures.documents_factures === true || 
                          planFeatures.documents_devis === true || 
                          planFeatures.documents_bons_livraison === true ||
                          planFeatures.documents_tickets === true;
      
      // Vérifier les fonctionnalités des chèques
      const hasCheques = planFeatures.documents_cheques_consulter === true ||
                        planFeatures.documents_cheques_deposer === true ||
                        planFeatures.documents_cheques_payer === true ||
                        planFeatures.documents_cheques_impayer === true;
      
      // Afficher le menu Documents si au moins un sous-module est activé
      hasPlanFeature = hasDocuments || hasCheques || planFeatures.tout_inclus === true;
    }

    return hasPermission && hasPlanFeature;
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="produits" element={<ProduitsList />} />
          <Route path="produits/nouveau" element={<ProduitForm />} />
          <Route path="produits/:id/edit" element={<ProduitForm />} />
          <Route path="ventes" element={<VentesList />} />
          <Route path="ventes/:id" element={<VenteDetails />} />
          <Route path="pos" element={<POS />} />
          <Route path="stock" element={<StockMouvements />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="fournisseurs" element={<FournisseursList />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="documents" element={<Documents />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default UserLayout;

