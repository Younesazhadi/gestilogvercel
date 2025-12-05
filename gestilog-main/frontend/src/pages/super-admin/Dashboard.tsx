import { useEffect, useState } from 'react';
import axios from 'axios';
import { Store, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/super-admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  const magasinsActifs = stats?.magasins?.find((m: any) => m.statut === 'actif')?.count || 0;
  const magasinsSuspendus = stats?.magasins?.find((m: any) => m.statut === 'suspendu')?.count || 0;
  const magasinsExpires = stats?.magasins?.find((m: any) => m.statut === 'expire')?.count || 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Super Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Magasins Actifs</p>
              <p className="text-2xl font-bold text-gray-800">{magasinsActifs}</p>
            </div>
            <Store className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Revenus Mois</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats?.revenus?.mois_actuel?.toFixed(2) || 0} MAD
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Suspendus</p>
              <p className="text-2xl font-bold text-gray-800">{magasinsSuspendus}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Expirations (7j)</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.expirations?.length || 0}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-danger" />
          </div>
        </div>
      </div>

      {stats?.expirations && stats.expirations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Abonnements qui expirent bientôt</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Magasin</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Date expiration</th>
                </tr>
              </thead>
              <tbody>
                {stats.expirations.map((exp: any) => (
                  <tr key={exp.id} className="border-b">
                    <td className="p-2">{exp.nom_magasin}</td>
                    <td className="p-2">{exp.email}</td>
                    <td className="p-2">{new Date(exp.date_expiration_abonnement).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

