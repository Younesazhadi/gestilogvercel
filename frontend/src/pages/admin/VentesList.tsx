import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Eye, X, FileText, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vente } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { buildRoute } from '../../utils/routes';
import Pagination from '../../components/Pagination';

const VentesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [dateFilter, setDateFilter] = useState<'aujourdhui' | 'hier' | 'personnalise'>('aujourdhui');
  const [dateDebutCustom, setDateDebutCustom] = useState('');
  const [dateFinCustom, setDateFinCustom] = useState('');
  const [filters, setFilters] = useState({
    type_document: '',
    statut: '',
  });

  // Fonction pour formater une date en YYYY-MM-DD (locale)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fonction pour obtenir les dates selon le filtre
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateFilter === 'aujourdhui') {
      return {
        date_debut: formatDateLocal(today),
        date_fin: formatDateLocal(tomorrow), // Exclure demain (utilisé comme date de fin exclusive)
      };
    } else if (dateFilter === 'hier') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        date_debut: formatDateLocal(yesterday),
        date_fin: formatDateLocal(today), // Exclure aujourd'hui
      };
    } else {
      return {
        date_debut: dateDebutCustom,
        date_fin: dateFinCustom ? formatDateLocal(new Date(new Date(dateFinCustom).getTime() + 24 * 60 * 60 * 1000)) : '',
      };
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, dateFilter, dateDebutCustom, dateFinCustom]);

  useEffect(() => {
    fetchVentes();
  }, [search, filters, currentPage, dateFilter, dateDebutCustom, dateFinCustom]);

  const fetchVentes = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      const params: any = {
        search,
        page: currentPage,
        limit: 15,
        ...filters,
      };
      
      // Toujours envoyer les dates si elles sont définies
      if (dateRange.date_debut) {
        params.date_debut = dateRange.date_debut;
      }
      if (dateRange.date_fin) {
        params.date_fin = dateRange.date_fin;
      }
      
      const response = await axios.get('/admin/ventes', { params });
      setVentes(response.data.ventes);
      if (response.data.pagination) {
        console.log('Pagination data:', response.data.pagination);
        setPagination(response.data.pagination);
      } else {
        // Fallback si pas de pagination dans la réponse
        console.warn('No pagination data in response');
        setPagination({
          page: currentPage,
          limit: 50,
          total: response.data.ventes?.length || 0,
          totalPages: 1,
        });
      }
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnuler = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette opération ?')) return;

    try {
      await axios.put(`/admin/ventes/${id}/annuler`, { motif: 'Annulation manuelle' });
      toast.success('Opération annulée');
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
        <h1 className="text-3xl font-bold text-gray-800">Opérations</h1>
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
            <option value="paiement_credit">Paiement crédit</option>
            <option value="paiement_cheque">Paiement chèque</option>
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

          {/* Filtres de date */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDateFilter('aujourdhui')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateFilter === 'aujourdhui'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateFilter('hier')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateFilter === 'hier'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hier
            </button>
            <button
              onClick={() => setDateFilter('personnalise')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateFilter === 'personnalise'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Personnalisé
            </button>
          </div>
          
          {dateFilter === 'personnalise' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateDebutCustom}
                onChange={(e) => setDateDebutCustom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Date début"
              />
              <span className="text-gray-500">au</span>
              <input
                type="date"
                value={dateFinCustom}
                onChange={(e) => setDateFinCustom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Date fin"
              />
            </div>
          )}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ventes.map((vente) => {
              const modePaiement = (vente as any).mode_paiement || 'non spécifié';
              const getPaiementLabel = (mode: string) => {
                const labels: Record<string, string> = {
                  'especes': 'Espèces',
                  'carte': 'Carte',
                  'cheque': 'Chèque',
                  'virement': 'Virement',
                  'credit': 'Crédit',
                };
                return labels[mode] || mode;
              };
              
              return (
                <tr key={vente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{vente.numero_vente}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    vente.type_document === 'paiement_credit'
                      ? 'bg-purple-100 text-purple-800'
                      : vente.type_document === 'paiement_cheque'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {vente.type_document === 'paiement_credit' 
                      ? 'Paiement crédit' 
                      : vente.type_document === 'paiement_cheque'
                      ? 'Paiement chèque'
                      : vente.type_document}
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
                        modePaiement === 'credit'
                          ? 'bg-red-100 text-red-800'
                          : modePaiement === 'especes'
                          ? 'bg-green-100 text-green-800'
                          : modePaiement === 'carte'
                          ? 'bg-blue-100 text-blue-800'
                          : modePaiement === 'cheque'
                          ? 'bg-yellow-100 text-yellow-800'
                          : modePaiement === 'virement'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getPaiementLabel(modePaiement)}
                    </span>
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
              );
            })}
          </tbody>
        </table>
        {pagination.totalPages !== undefined && pagination.totalPages > 0 && (
          <Pagination
            currentPage={pagination.page || currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit || 15}
          />
        )}
      </div>
    </div>
  );
};

export default VentesList;
