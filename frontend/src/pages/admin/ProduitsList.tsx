import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Produit } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { buildRoute } from '../../utils/routes';
import Pagination from '../../components/Pagination';

const ProduitsList = () => {
  const { user } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchProduits();
  }, [search, currentPage]);

  const fetchProduits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/admin/produits', {
        params: { search, page: currentPage, limit: 15 },
      });
      setProduits(response.data.produits || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      if (!response.data.produits || response.data.produits.length === 0) {
        setError('Aucun produit trouvé. Créez votre premier produit pour commencer.');
      }
    } catch (error: any) {
      console.error('Erreur chargement produits:', error);
      console.error('Détails erreur:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des produits';
      setError(errorMessage);
      toast.error(errorMessage);
      setProduits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      await axios.delete(`/admin/produits/${id}`);
      toast.success('Produit supprimé');
      fetchProduits();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Produits</h1>
        <Link
          to={buildRoute(user?.role, '/produits/nouveau')}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau produit</span>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, code-barres, référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des produits...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">{error}</p>
          {error.includes('Aucun produit') && (
            <Link
              to={buildRoute(user?.role, '/produits/nouveau')}
              className="inline-block mt-4 text-primary hover:underline"
            >
              Créer votre premier produit
            </Link>
          )}
        </div>
      ) : produits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          <Link
            to={buildRoute(user?.role, '/produits/nouveau')}
            className="inline-block mt-4 text-primary hover:underline"
          >
            Créer votre premier produit
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code-barres</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix vente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock min</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produits.map((produit) => (
                <tr key={produit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {produit.image_url ? (
                        <img
                          src={produit.image_url}
                          alt={produit.nom}
                          className="h-12 w-12 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{produit.nom}</p>
                        {produit.reference && (
                          <p className="text-sm text-gray-500">Ref: {produit.reference}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {produit.code_barre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {Number(produit.prix_vente).toFixed(2)} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        produit.stock_actuel <= 0
                          ? 'bg-red-100 text-red-800'
                          : produit.stock_actuel <= produit.stock_min
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {produit.stock_actuel} {produit.unite}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {produit.stock_min} {produit.unite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <Link
                        to={buildRoute(user?.role, `/produits/${produit.id}/edit`)}
                        className="text-primary hover:text-blue-700"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(produit.id)}
                        className="text-danger hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
      )}
    </div>
  );
};

export default ProduitsList;
