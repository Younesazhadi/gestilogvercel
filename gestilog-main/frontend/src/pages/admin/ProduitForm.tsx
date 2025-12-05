import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildRoute } from '../../utils/routes';
import { formatDateForInput } from '../../utils/dateUtils';

interface ProduitFormData {
  nom: string;
  code_barre: string;
  reference: string;
  categorie_id: number | null;
  description: string;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  stock_min: number;
  unite: string;
  emplacement: string;
  date_peremption: string;
  actif: boolean;
}

const ProduitForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingProduit, setLoadingProduit] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProduitFormData>({
    defaultValues: {
      nom: '',
      code_barre: '',
      reference: '',
      categorie_id: null,
      description: '',
      prix_achat: 0,
      prix_vente: 0,
      stock_actuel: 0,
      stock_min: 0,
      unite: 'unité',
      emplacement: '',
      date_peremption: '',
      actif: true,
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchProduit();
    }
  }, [id, isEdit]);

  const fetchProduit = async () => {
    if (!id) return;
    
    setLoadingProduit(true);
    setError(null);
    
    try {
      console.log('Fetching produit with id:', id);
      const response = await axios.get(`/admin/produits/${id}`);
      console.log('Produit response:', response.data);
      
      const produit = response.data.produit;
      if (!produit) {
        throw new Error('Produit non trouvé dans la réponse');
      }
      
      Object.keys(produit).forEach((key) => {
        if (key === 'date_peremption' && produit[key]) {
          setValue(key as keyof ProduitFormData, formatDateForInput(produit[key]));
        } else {
          setValue(key as keyof ProduitFormData, produit[key]);
        }
      });
      
      setLoadingProduit(false);
    } catch (error: any) {
      console.error('Erreur fetchProduit:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      setLoadingProduit(false);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement du produit';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Si erreur 401, l'intercepteur gérera la redirection vers login
      // Ne pas rediriger immédiatement pour permettre à l'utilisateur de voir l'erreur
      if (error.response?.status === 401) {
        // L'intercepteur axios redirigera vers /login
        return;
      }
      
      // Pour les autres erreurs, rediriger après un délai pour que l'utilisateur voie le message
      setTimeout(() => {
        navigate(buildRoute(user?.role, '/produits'));
      }, 2000);
    }
  };

  const onSubmit = async (data: ProduitFormData) => {
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/admin/produits/${id}`, data);
        toast.success('Produit modifié avec succès');
      } else {
        await axios.post('/admin/produits', data);
        toast.success('Produit créé avec succès');
      }
      navigate(buildRoute(user?.role, '/produits'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduit) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement du produit...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && isEdit) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate(buildRoute(user?.role, '/produits'))}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour à la liste</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate(buildRoute(user?.role, '/produits'))}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate(buildRoute(user?.role, '/produits'))}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Retour à la liste</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du produit *
            </label>
            <input
              {...register('nom', { required: 'Nom requis' })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.nom && <p className="mt-1 text-sm text-danger">{errors.nom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code-barres
            </label>
            <input
              {...register('code_barre')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence
            </label>
            <input
              {...register('reference')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unité de mesure
            </label>
            <select
              {...register('unite')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="unité">Unité</option>
              <option value="kg">Kilogramme</option>
              <option value="g">Gramme</option>
              <option value="litre">Litre</option>
              <option value="ml">Millilitre</option>
              <option value="m">Mètre</option>
              <option value="cm">Centimètre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix d'achat (MAD)
            </label>
            <input
              {...register('prix_achat', { valueAsNumber: true, min: 0 })}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix de vente (MAD) *
            </label>
            <input
              {...register('prix_vente', { required: 'Prix de vente requis', valueAsNumber: true, min: 0 })}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.prix_vente && <p className="mt-1 text-sm text-danger">{errors.prix_vente.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock actuel
            </label>
            <input
              {...register('stock_actuel', { valueAsNumber: true, min: 0 })}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock minimum
            </label>
            <input
              {...register('stock_min', { valueAsNumber: true, min: 0 })}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emplacement
            </label>
            <input
              {...register('emplacement')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de péremption
            </label>
            <input
              {...register('date_peremption')}
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            {...register('actif')}
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">Produit actif</label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(buildRoute(user?.role, '/produits'))}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProduitForm;
