import { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package, Users, CreditCard, Calendar, ArrowUp, ArrowDown, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">CA du jour</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.ca?.jour?.total || 0).toFixed(2)} MAD
              </p>
              <div className="flex items-center mt-1">
                {stats?.ca?.hier !== undefined && stats?.ca?.hier > 0 && stats?.ca?.jour?.total !== undefined && (
                  <>
                    {stats.ca.jour.total > stats.ca.hier ? (
                      <ArrowUp className="h-4 w-4 text-success mr-1" />
                    ) : stats.ca.jour.total < stats.ca.hier ? (
                      <ArrowDown className="h-4 w-4 text-danger mr-1" />
                    ) : null}
                    <p className={`text-xs ${stats.ca.jour.total > stats.ca.hier ? 'text-success' : stats.ca.jour.total < stats.ca.hier ? 'text-danger' : 'text-gray-500'}`}>
                      {stats.ca.hier > 0 
                        ? `${((stats.ca.jour.total - stats.ca.hier) / stats.ca.hier * 100).toFixed(1)}% vs hier`
                        : 'Nouveau'}
                    </p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.ca?.jour?.nb_ventes || 0} opérations
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">CA de la semaine</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.ca?.semaine || 0).toFixed(2)} MAD
              </p>
              {stats?.ca?.semaine_derniere !== undefined && stats?.ca?.semaine_derniere > 0 && stats?.ca?.semaine !== undefined && (
                <p className={`text-xs mt-1 ${stats.ca.semaine > stats.ca.semaine_derniere ? 'text-success' : stats.ca.semaine < stats.ca.semaine_derniere ? 'text-danger' : 'text-gray-500'}`}>
                  {stats.ca.semaine > stats.ca.semaine_derniere ? '+' : ''}
                  {((stats.ca.semaine - stats.ca.semaine_derniere) / stats.ca.semaine_derniere * 100).toFixed(1)}% vs semaine dernière
                </p>
              )}
            </div>
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
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
            <div className="flex-1">
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

      {/* Cartes supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Crédits en attente</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.credits?.total || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.credits?.nb_clients || 0} client(s)
              </p>
            </div>
            <Users className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Chèques en attente</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.cheques?.en_attente?.montant || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.cheques?.en_attente?.nb || 0} chèque(s)
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Prêts pour dépôt</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.cheques?.pret_depot?.montant || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.cheques?.pret_depot?.nb || 0} chèque(s)
              </p>
            </div>
            <Calendar className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Top produits (jour)</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats?.top_produits_jour?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                produits vendus aujourd'hui
              </p>
            </div>
            <Package className="h-12 w-12 text-primary" />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Évolution des opérations (7 jours)</h2>
          {(() => {
            // Calculer le maximum du CA dans les données
            const evolutionData = stats?.evolution || [];
            const maxCA = evolutionData.length > 0 
              ? Math.max(...evolutionData.map((d: any) => parseFloat(d.ca) || 0))
              : 0;
            const yAxisMax = maxCA > 0 ? Math.ceil(maxCA * 1.1) : 'auto';
            
            return (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={evolutionData} 
                  margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    domain={[0, yAxisMax]}
                    allowDataOverflow={false}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      }
                      return value.toString();
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any) => `${Number(value).toFixed(2)} MAD`}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ca" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 produits du mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.top_produits || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantite_vendue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphiques supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Modes de paiement (Aujourd'hui)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.modes_paiement || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  const modeNames: Record<string, string> = {
                    'especes': 'Espèces',
                    'carte': 'Carte',
                    'cheque': 'Chèque',
                    'virement': 'Virement',
                    'credit': 'Crédit',
                    'non_specifie': 'Non spécifié'
                  };
                  return `${modeNames[name] || name}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {(stats?.modes_paiement || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} MAD`} />
              <Legend formatter={(value: string) => {
                const modeNames: Record<string, string> = {
                  'especes': 'Espèces',
                  'carte': 'Carte',
                  'cheque': 'Chèque',
                  'virement': 'Virement',
                  'credit': 'Crédit',
                  'non_specifie': 'Non spécifié'
                };
                return modeNames[value] || value;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 produits du jour</h2>
          {stats?.top_produits_jour && stats.top_produits_jour.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.top_produits_jour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantite_vendue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Aucune vente aujourd'hui
            </div>
          )}
        </div>
      </div>

      {/* Alertes et Notifications */}
      {(stats?.alertes?.rupture > 0 || stats?.alertes?.seuil_minimum > 0 || stats?.alertes?.peremption > 0 || 
        stats?.credits?.clients_credit_eleve > 0 || stats?.cheques?.pret_depot?.nb > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Alertes et Notifications</h2>
          <div className="space-y-2">
            {stats.alertes.rupture > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <span className="text-sm">
                  <strong>{stats.alertes.rupture}</strong> produit(s) en rupture de stock
                </span>
              </div>
            )}
            {stats.alertes.seuil_minimum > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm">
                  <strong>{stats.alertes.seuil_minimum}</strong> produit(s) sous le seuil minimum
                </span>
              </div>
            )}
            {stats.alertes.peremption > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm">
                  <strong>{stats.alertes.peremption}</strong> produit(s) périment dans 30 jours
                </span>
              </div>
            )}
            {stats?.credits?.clients_credit_eleve > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm">
                  <strong>{stats.credits.clients_credit_eleve}</strong> client(s) avec crédit élevé (&gt;80% du crédit autorisé)
                </span>
              </div>
            )}
            {stats?.cheques?.pret_depot?.nb > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm">
                  <strong>{stats.cheques.pret_depot.nb}</strong> chèque(s) prêt(s) pour dépôt ({Number(stats.cheques.pret_depot.montant).toFixed(2)} MAD)
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
