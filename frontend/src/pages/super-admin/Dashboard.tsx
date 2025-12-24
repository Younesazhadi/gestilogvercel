import { useEffect, useState } from 'react';
import axios from 'axios';
import { Store, DollarSign, AlertTriangle, TrendingUp, Clock, XCircle } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Rafraîchir les stats toutes les 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
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

  // Extraire les statistiques des magasins par statut
  const magasinsActifs = stats?.magasins?.find((m: any) => m.statut === 'actif')?.count || 0;
  const magasinsSuspendus = stats?.magasins?.find((m: any) => m.statut === 'suspendu')?.count || 0;
  const magasinsExpires = stats?.magasins?.find((m: any) => m.statut === 'expire')?.count || 0;

  // Fonction pour calculer les jours restants
  const getDaysRemaining = (expirationDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiration = new Date(expirationDate);
    expiration.setHours(0, 0, 0, 0);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Super Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
            <Clock className="h-12 w-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Déjà expirés</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.expired?.length || 0}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Abonnements qui expirent bientôt */}
      {stats?.expirations && stats.expirations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Rappels d'expiration (7 prochains jours)
            </h2>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              {stats.expirations.length} abonnement(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Magasin</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Date expiration</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Jours restants</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.expirations.map((exp: any) => {
                  const joursRestants = exp.jours_restants || getDaysRemaining(exp.date_expiration_abonnement);
                  const isUrgent = joursRestants <= 3;
                  return (
                    <tr key={exp.id} className={`border-b hover:bg-gray-50 ${isUrgent ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-medium">{exp.nom_magasin}</td>
                      <td className="p-3 text-gray-600">{exp.email}</td>
                      <td className="p-3">{new Date(exp.date_expiration_abonnement).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          joursRestants <= 1 
                            ? 'bg-red-100 text-red-800' 
                            : joursRestants <= 3 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {joursRestants === 0 ? 'Expire aujourd\'hui' : `${joursRestants} jour(s)`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium capitalize">
                          {exp.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Abonnements déjà expirés */}
      {stats?.expired && stats.expired.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Abonnements expirés
            </h2>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {stats.expired.length} abonnement(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Magasin</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Date expiration</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Jours écoulés</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.expired.map((exp: any) => {
                  const joursEcoules = exp.jours_expires || Math.abs(getDaysRemaining(exp.date_expiration_abonnement));
                  return (
                    <tr key={exp.id} className="border-b hover:bg-gray-50 bg-red-50">
                      <td className="p-3 font-medium">{exp.nom_magasin}</td>
                      <td className="p-3 text-gray-600">{exp.email}</td>
                      <td className="p-3">{new Date(exp.date_expiration_abonnement).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {joursEcoules} jour(s) écoulé(s)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          exp.statut === 'expire' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exp.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

