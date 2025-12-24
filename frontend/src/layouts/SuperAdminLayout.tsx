import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import MagasinsList from '../pages/super-admin/MagasinsList';
import MagasinDetails from '../pages/super-admin/MagasinDetails';
import PlansList from '../pages/super-admin/PlansList';
import PaiementsList from '../pages/super-admin/PaiementsList';

const SuperAdminLayout = () => {
  const menuItems = [
    { path: '/super-admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/super-admin/magasins', label: 'Magasins', icon: 'Store' },
    { path: '/super-admin/plans', label: 'Plans', icon: 'Package' },
    { path: '/super-admin/paiements', label: 'Paiements', icon: 'CreditCard' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="magasins" element={<MagasinsList />} />
          <Route path="magasins/:id" element={<MagasinDetails />} />
          <Route path="plans" element={<PlansList />} />
          <Route path="paiements" element={<PaiementsList />} />
          <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default SuperAdminLayout;

