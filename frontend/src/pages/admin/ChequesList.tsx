import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, CheckCircle, XCircle, Clock, Calendar, Filter, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

interface Cheque {
  id: number;
  numero_vente: string;
  reference_paiement: string;
  date_cheque: string;
  montant_ttc: number;
  statut_cheque: string;
  date_vente: string;
  type_document?: string;
  client_nom: string | null;
  client_id: number | null;
}

const ChequesList = () => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'aujourdhui' | 'hier' | 'personnalise'>('aujourdhui');
  const [dateDebutCustom, setDateDebutCustom] = useState('');
  const [dateFinCustom, setDateFinCustom] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
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
        date_fin: formatDateLocal(tomorrow),
      };
    } else if (dateFilter === 'hier') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        date_debut: formatDateLocal(yesterday),
        date_fin: formatDateLocal(today),
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
  }, [search, statutFilter, dateFilter, dateDebutCustom, dateFinCustom]);

  useEffect(() => {
    fetchCheques();
  }, [search, statutFilter, currentPage, dateFilter, dateDebutCustom, dateFinCustom]);

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      const params: any = {
        search,
        statut: statutFilter || undefined,
        page: currentPage,
        limit: 15,
      };
      
      // Toujours envoyer les dates si elles sont définies
      if (dateRange.date_debut) {
        params.date_debut = dateRange.date_debut;
      }
      if (dateRange.date_fin) {
        params.date_fin = dateRange.date_fin;
      }
      
      const response = await axios.get('/admin/cheques', { params });
      setCheques(response.data.cheques || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Erreur chargement chèques:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const marquerStatut = async (chequeId: number, nouveauStatut: string) => {
    try {
      await axios.patch(`/admin/cheques/${chequeId}/statut`, {
        statut: nouveauStatut,
      });
      toast.success('Statut mis à jour avec succès');
      fetchCheques();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      en_attente: {
        label: 'En attente',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      depose: {
        label: 'Déposé',
        className: 'bg-blue-100 text-blue-800',
        icon: Calendar,
      },
      paye: {
        label: 'Payé',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      impaye: {
        label: 'Impayé',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
    };
    return badges[statut] || { label: statut, className: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const isPretPourDepot = (dateCheque: string) => {
    const date = new Date(dateCheque);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date <= aujourdhui;
  };

  const chequesPretDepot = cheques.filter(
    (c) => c.statut_cheque === 'en_attente' && isPretPourDepot(c.date_cheque)
  );

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Chèques</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total chèques</p>
              <p className="text-2xl font-bold text-gray-800">{cheques.length}</p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">En attente</p>
              <p className="text-2xl font-bold text-yellow-800">
                {cheques.filter((c) => c.statut_cheque === 'en_attente').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Prêts pour dépôt</p>
              <p className="text-2xl font-bold text-blue-800">{chequesPretDepot.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Payés</p>
              <p className="text-2xl font-bold text-green-800">
                {cheques.filter((c) => c.statut_cheque === 'paye').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro de chèque ou vente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="depose">Déposé</option>
            <option value="paye">Payé</option>
            <option value="impaye">Impayé</option>
          </select>
        </div>
        </div>
        
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

      {/* Liste des chèques */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Numéro chèque
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date chèque
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cheques.map((cheque) => {
              const statutBadge = getStatutBadge(cheque.statut_cheque);
              const Icon = statutBadge.icon;
              const pretDepot = cheque.statut_cheque === 'en_attente' && isPretPourDepot(cheque.date_cheque);

              return (
                <tr
                  key={cheque.id}
                  className={pretDepot ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cheque.reference_paiement}</div>
                    {cheque.type_document === 'paiement_credit' && (
                      <div className="text-xs text-purple-600 font-medium mt-1">Paiement crédit</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cheque.numero_vente}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(cheque.date_vente).toLocaleDateString()}
                    </div>
                    {cheque.type_document === 'paiement_credit' && (
                      <div className="text-xs text-purple-600 mt-1">Paiement crédit</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cheque.client_nom || 'Non renseigné'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(cheque.date_cheque).toLocaleDateString()}
                    </div>
                    {pretDepot && (
                      <div className="text-xs text-yellow-600 font-medium mt-1">⚠️ Prêt pour dépôt</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {Number(cheque.montant_ttc).toFixed(2)} MAD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 w-fit ${statutBadge.className}`}>
                      <Icon className="h-3 w-3" />
                      <span>{statutBadge.label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {cheque.statut_cheque === 'en_attente' && (
                        <button
                          onClick={() => marquerStatut(cheque.id, 'depose')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Marquer déposé
                        </button>
                      )}
                      {cheque.statut_cheque === 'depose' && (
                        <>
                          <button
                            onClick={() => marquerStatut(cheque.id, 'paye')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Payé
                          </button>
                          <button
                            onClick={() => marquerStatut(cheque.id, 'impaye')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Impayé
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {cheques.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun chèque trouvé</p>
          </div>
        )}
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

export default ChequesList;

