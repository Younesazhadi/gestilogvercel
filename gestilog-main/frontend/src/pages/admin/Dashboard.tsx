import { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CA du jour</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.ca?.jour?.total || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.ca?.jour?.nb_ventes || 0} ventes
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CA de la semaine</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.ca?.semaine || 0).toFixed(2)} MAD
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CA du mois</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.ca?.mois || 0).toFixed(2)} MAD
              </p>
            </div>
            <ShoppingCart className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Alertes stock</p>
              <p className="text-2xl font-bold text-gray-800">
                {(stats?.alertes?.rupture || 0) + (stats?.alertes?.seuil_minimum || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.alertes?.rupture || 0} rupture, {stats?.alertes?.seuil_minimum || 0} seuil
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-danger" />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Évolution des ventes (7 jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.evolution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ca" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 produits du mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.top_produits || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantite_vendue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertes */}
      {(stats?.alertes?.rupture > 0 || stats?.alertes?.seuil_minimum > 0 || stats?.alertes?.peremption > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Alertes importantes</h2>
          <div className="space-y-2">
            {stats.alertes.rupture > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <span className="text-sm">
                  <strong>{stats.alertes.rupture}</strong> produit(s) en rupture de stock
                </span>
              </div>
            )}
            {stats.alertes.seuil_minimum > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm">
                  <strong>{stats.alertes.seuil_minimum}</strong> produit(s) sous le seuil minimum
                </span>
              </div>
            )}
            {stats.alertes.peremption > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm">
                  <strong>{stats.alertes.peremption}</strong> produit(s) périment dans 30 jours
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
