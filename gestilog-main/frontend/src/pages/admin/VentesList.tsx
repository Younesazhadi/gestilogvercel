import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Eye, X, FileText, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vente } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { buildRoute } from '../../utils/routes';

const VentesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type_document: '',
    statut: '',
    date_debut: '',
    date_fin: '',
  });

  useEffect(() => {
    fetchVentes();
  }, [search, filters]);

  const fetchVentes = async () => {
    try {
      const response = await axios.get('/admin/ventes', {
        params: {
          search,
          page: 1,
          limit: 50,
          ...filters,
        },
      });
      setVentes(response.data.ventes);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnuler = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette vente ?')) return;

    try {
      await axios.put(`/admin/ventes/${id}/annuler`, { motif: 'Annulation manuelle' });
      toast.success('Vente annulée');
      fetchVentes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ventes</h1>
        <button
          onClick={() => navigate(buildRoute(user?.role, '/pos'))}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Receipt className="h-5 w-5" />
          <span>Nouvelle vente</span>
        </button>
      </div>

      <div className="mb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro de vente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.type_document}
            onChange={(e) => setFilters({ ...filters, type_document: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="ticket">Ticket</option>
            <option value="facture">Facture</option>
            <option value="devis">Devis</option>
            <option value="bl">Bon de livraison</option>
          </select>

          <select
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="valide">Valide</option>
            <option value="annule">Annulé</option>
            <option value="brouillon">Brouillon</option>
          </select>

          <input
            type="date"
            value={filters.date_debut}
            onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Date début"
          />

          <input
            type="date"
            value={filters.date_fin}
            onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Date fin"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ventes.map((vente) => (
              <tr key={vente.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{vente.numero_vente}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {vente.type_document}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(vente.date_vente).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(vente as any).client_nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  {Number(vente.montant_ttc).toFixed(2)} MAD
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      vente.statut === 'valide'
                        ? 'bg-green-100 text-green-800'
                        : vente.statut === 'annule'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {vente.statut}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate(`/admin/ventes/${vente.id}`)}
                      className="text-primary hover:text-blue-700"
                      title="Voir détails"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {vente.statut === 'valide' && (
                      <button
                        onClick={() => handleAnnuler(vente.id)}
                        className="text-danger hover:text-red-700"
                        title="Annuler"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentesList;
