import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Package, ArrowDown, ArrowUp, Edit, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { MouvementStock, Produit } from '../../types';

interface MouvementFormData {
  produit_id: number;
  quantite: number;
  prix_unitaire?: number;
  fournisseur_id?: number;
  reference_doc?: string;
  motif: string;
}

const StockMouvements = () => {
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [typeMouvement, setTypeMouvement] = useState<'entree' | 'sortie' | 'ajustement'>('entree');
  const [filters, setFilters] = useState({
    produit_id: '',
    type: '',
    date_debut: '',
    date_fin: '',
  });
  const { register, handleSubmit, formState: { errors }, reset } = useForm<MouvementFormData>();

  useEffect(() => {
    fetchMouvements();
    fetchProduits();
  }, [filters]);

  const fetchMouvements = async () => {
    try {
      const response = await axios.get('/admin/stock/mouvements', {
        params: {
          page: 1,
          limit: 50,
          ...filters,
        },
      });
      setMouvements(response.data.mouvements);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const response = await axios.get('/admin/produits', {
        params: { page: 1, limit: 1000 },
      });
      setProduits(response.data.produits);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const onSubmit = async (data: MouvementFormData) => {
    try {
      const endpoint = typeMouvement === 'entree' 
        ? '/admin/stock/entree'
        : typeMouvement === 'sortie'
        ? '/admin/stock/sortie'
        : '/admin/stock/ajustement';

      const payload = typeMouvement === 'ajustement'
        ? { nouveau_stock: data.quantite, motif: data.motif }
        : { ...data, quantite: Math.abs(data.quantite) };

      await axios.post(endpoint, {
        produit_id: data.produit_id,
        ...payload,
      });

      toast.success('Mouvement enregistré avec succès');
      setShowModal(false);
      reset();
      fetchMouvements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mouvements de stock</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setTypeMouvement('entree');
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-success text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <ArrowDown className="h-5 w-5" />
            <span>Entrée</span>
          </button>
          <button
            onClick={() => {
              setTypeMouvement('sortie');
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-warning text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            <ArrowUp className="h-5 w-5" />
            <span>Sortie</span>
          </button>
          <button
            onClick={() => {
              setTypeMouvement('ajustement');
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Edit className="h-5 w-5" />
            <span>Ajustement</span>
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.produit_id}
          onChange={(e) => setFilters({ ...filters, produit_id: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Tous les produits</option>
          {produits.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Tous les types</option>
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
          <option value="ajustement">Ajustement</option>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mouvements.map((mouvement) => (
              <tr key={mouvement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(mouvement.date_mouvement).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(mouvement as any).produit_nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      mouvement.type === 'entree'
                        ? 'bg-green-100 text-green-800'
                        : mouvement.type === 'sortie'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {mouvement.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {mouvement.type === 'sortie' ? '-' : '+'}{Math.abs(mouvement.quantite)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mouvement.prix_unitaire ? `${Number(mouvement.prix_unitaire).toFixed(2)} MAD` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {mouvement.motif || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {typeMouvement === 'entree' && 'Entrée de stock'}
                {typeMouvement === 'sortie' && 'Sortie de stock'}
                {typeMouvement === 'ajustement' && 'Ajustement de stock'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit *
                </label>
                <select
                  {...register('produit_id', { required: 'Produit requis', valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionner un produit</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (Stock: {p.stock_actuel})
                    </option>
                  ))}
                </select>
                {errors.produit_id && (
                  <p className="mt-1 text-sm text-danger">{errors.produit_id.message}</p>
                )}
              </div>

              {typeMouvement === 'ajustement' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau stock *
                  </label>
                  <input
                    {...register('quantite', { required: 'Stock requis', valueAsNumber: true, min: 0 })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité *
                  </label>
                  <input
                    {...register('quantite', { required: 'Quantité requise', valueAsNumber: true, min: 0.01 })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {typeMouvement === 'entree' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix unitaire (MAD)
                    </label>
                    <input
                      {...register('prix_unitaire', { valueAsNumber: true, min: 0 })}
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Référence document
                    </label>
                    <input
                      {...register('reference_doc')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif {typeMouvement !== 'entree' && '*'}
                </label>
                <textarea
                  {...register('motif', { required: typeMouvement !== 'entree' ? 'Motif requis' : false })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.motif && (
                  <p className="mt-1 text-sm text-danger">{errors.motif.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    reset();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-white rounded-lg ${
                    typeMouvement === 'entree'
                      ? 'bg-success hover:bg-green-700'
                      : typeMouvement === 'sortie'
                      ? 'bg-warning hover:bg-orange-700'
                      : 'bg-primary hover:bg-blue-700'
                  }`}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMouvements;
