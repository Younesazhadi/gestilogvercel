import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AdminDashboard from '../pages/admin/Dashboard';
import ProduitsList from '../pages/admin/ProduitsList';
import ProduitForm from '../pages/admin/ProduitForm';
import VentesList from '../pages/admin/VentesList';
import VenteDetails from '../pages/admin/VenteDetails';
import POS from '../pages/admin/POS';
import StockMouvements from '../pages/admin/StockMouvements';
import ClientsList from '../pages/admin/ClientsList';
import FournisseursList from '../pages/admin/FournisseursList';
import UsersList from '../pages/admin/UsersList';
import Rapports from '../pages/admin/Rapports';
import Documents from '../pages/admin/Documents';

import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();
  const planFeatures = user?.planFeatures || {};

  // Mapping entre les menus et les fonctionnalités requises
  const allMenuItems = [
    { 
      path: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: 'LayoutDashboard',
      requiredFeature: 'dashboard_statistiques' // Toujours accessible
    },
    { 
      path: '/admin/ventes', 
      label: 'Opérations', 
      icon: 'ShoppingCart',
      requiredFeature: 'ventes_consulter'
    },
    { 
      path: '/admin/pos', 
      label: 'Caisse', 
      icon: 'CashRegister',
      requiredFeature: 'ventes_pos'
    },
    { 
      path: '/admin/produits', 
      label: 'Produits', 
      icon: 'Package',
      requiredFeature: 'produits_consulter'
    },
    { 
      path: '/admin/stock', 
      label: 'Stock', 
      icon: 'Warehouse',
      requiredFeature: 'stock_consulter'
    },
    { 
      path: '/admin/clients', 
      label: 'Clients', 
      icon: 'Users',
      requiredFeature: 'clients_consulter'
    },
    { 
      path: '/admin/fournisseurs', 
      label: 'Fournisseurs', 
      icon: 'Truck',
      requiredFeature: 'fournisseurs_consulter'
    },
    { 
      path: '/admin/users', 
      label: 'Utilisateurs', 
      icon: 'Users',
      requiredFeature: 'utilisateurs_consulter'
    },
    { 
      path: '/admin/rapports', 
      label: 'Rapports', 
      icon: 'BarChart',
      requiredFeature: 'rapports_basiques' // Rapports basiques ou avancés
    },
    { 
      path: '/admin/documents', 
      label: 'Documents', 
      icon: 'FileText',
      requiredFeature: 'documents_factures' // Factures ou autres documents
    },
  ];

  // Filtrer les menus selon les fonctionnalités du plan
  // Si tout_inclus est activé, tout est accessible
  // Sinon, vérifier chaque fonctionnalité requise
  const menuItems = allMenuItems.filter(item => {
    if (planFeatures.tout_inclus) {
      return true; // Tout inclus = tout accessible
    }
    
    // Dashboard toujours accessible
    if (item.path === '/admin/dashboard') {
      return true;
    }

    // Vérifier la fonctionnalité requise
    const requiredFeature = item.requiredFeature;
    if (!requiredFeature) {
      return true;
    }

    // Vérifier si la fonctionnalité est activée
    // Support des fonctionnalités multiples (rapports_basiques OU rapports_avances)
    if (requiredFeature === 'rapports_basiques') {
      return planFeatures.rapports_basiques || planFeatures.rapports_avances;
    }
    
    if (requiredFeature === 'documents_factures') {
      return planFeatures.documents_factures || planFeatures.documents_devis || planFeatures.documents_bons_livraison;
    }

    return planFeatures[requiredFeature] === true;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="produits" element={<ProduitsList />} />
          <Route path="produits/nouveau" element={<ProduitForm />} />
          <Route path="produits/:id/edit" element={<ProduitForm />} />
          <Route path="ventes" element={<VentesList />} />
          <Route path="ventes/:id" element={<VenteDetails />} />
          <Route path="pos" element={<POS />} />
          <Route path="stock" element={<StockMouvements />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="fournisseurs" element={<FournisseursList />} />
          <Route path="users" element={<UsersList />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="documents" element={<Documents />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;

