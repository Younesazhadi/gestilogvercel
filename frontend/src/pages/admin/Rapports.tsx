import { useState } from 'react';
import axios from 'axios';
import { FileText, DollarSign, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Rapports = () => {
  const [activeTab, setActiveTab] = useState<'ventes' | 'financier' | 'stock'>('ventes');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [ventesParCategorie, setVentesParCategorie] = useState<any[]>([]);
  const [ventesParUtilisateur, setVentesParUtilisateur] = useState<any[]>([]);
  const [topProduits, setTopProduits] = useState<any[]>([]);

  const fetchRapportVentes = async () => {
    setLoading(true);
    try {
      const [ventesRes, categoriesRes, usersRes, produitsRes] = await Promise.all([
        axios.get('/admin/rapports/ventes', {
          params: { date_debut: dateDebut || undefined, date_fin: dateFin || undefined, group_by: 'jour' },
        }),
        axios.get('/admin/rapports/ventes/categories', {
          params: { date_debut: dateDebut || undefined, date_fin: dateFin || undefined },
        }),
        axios.get('/admin/rapports/ventes/utilisateurs', {
          params: { date_debut: dateDebut || undefined, date_fin: dateFin || undefined },
        }),
        axios.get('/admin/rapports/top-produits', {
          params: { date_debut: dateDebut || undefined, date_fin: dateFin || undefined, limit: 10 },
        }),
      ]);
      setData(ventesRes.data);
      setVentesParCategorie(categoriesRes.data.data || []);
      setVentesParUtilisateur(usersRes.data.data || []);
      setTopProduits(produitsRes.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchRapportFinancier = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/rapports/financier', {
        params: { date_debut: dateDebut || undefined, date_fin: dateFin || undefined },
      });
      setData(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchRapportStock = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/admin/rapports/stock');
      setData(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = () => {
    if (activeTab === 'ventes') {
      fetchRapportVentes();
    } else if (activeTab === 'financier') {
      fetchRapportFinancier();
    } else {
      fetchRapportStock();
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Rapports</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => {
            setActiveTab('ventes');
            setData(null);
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'ventes'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="inline h-5 w-5 mr-2" />
          Ventes
        </button>
        <button
          onClick={() => {
            setActiveTab('financier');
            setData(null);
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'financier'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign className="inline h-5 w-5 mr-2" />
          Financier
        </button>
        <button
          onClick={() => {
            setActiveTab('stock');
            setData(null);
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stock'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="inline h-5 w-5 mr-2" />
          Stock
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Générer le rapport'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des rapports */}
      {data && (
        <div className="space-y-6">
          {activeTab === 'ventes' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Évolution des ventes</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periode" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total_ttc" stroke="#3B82F6" name="CA TTC" />
                    <Line type="monotone" dataKey="nb_ventes" stroke="#10B981" name="Nombre de ventes" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ventesParCategorie.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Ventes par catégorie</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ventesParCategorie}
                          dataKey="ca_total"
                          nameKey="categorie"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {ventesParCategorie.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {ventesParUtilisateur.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Ventes par utilisateur</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ventesParUtilisateur}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="utilisateur" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ca_total" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {topProduits.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 produits</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Produit</th>
                          <th className="text-right p-2">Quantité vendue</th>
                          <th className="text-right p-2">CA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProduits.map((produit, index) => (
                          <tr key={produit.id} className="border-b">
                            <td className="p-2">
                              <span className="font-medium">{index + 1}. {produit.nom}</span>
                            </td>
                            <td className="p-2 text-right">{produit.quantite_vendue}</td>
                            <td className="p-2 text-right font-bold">{parseFloat(produit.ca_produit).toFixed(2)} MAD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'financier' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm">CA Total</p>
                <p className="text-2xl font-bold text-gray-800">{Number(data.ca?.total_ttc || 0).toFixed(2)} MAD</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm">Coût d'achat</p>
                <p className="text-2xl font-bold text-gray-800">{Number(data.cout_achat || 0).toFixed(2)} MAD</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm">Marge brute</p>
                <p className="text-2xl font-bold text-success">{Number(data.marge_brute || 0).toFixed(2)} MAD</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm">Taux de marge</p>
                <p className="text-2xl font-bold text-primary">{Number(data.taux_marge || 0).toFixed(2)}%</p>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Valeur totale du stock</h3>
                <p className="text-3xl font-bold text-primary">{Number(data.valeur_totale || 0).toFixed(2)} MAD</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Statistiques</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">Produits en rupture: <span className="font-bold text-danger">{data.produits_rupture || 0}</span></p>
                  <p className="text-gray-600">Produits à rotation lente: <span className="font-bold text-warning">{data.produits_rotation_lente || 0}</span></p>
                </div>
              </div>
              {data.par_categorie && data.par_categorie.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Stock par catégorie</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.par_categorie}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categorie" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="valeur" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!data && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Sélectionnez une période et cliquez sur "Générer le rapport"</p>
        </div>
      )}
    </div>
  );
};

export default Rapports;

