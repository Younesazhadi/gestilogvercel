import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, X, CreditCard, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface Paiement {
  id: number;
  magasin_id: number;
  nom_magasin: string;
  montant: number;
  date_paiement: string;
  methode_paiement: string;
  statut: 'paye' | 'en_attente' | 'echoue';
  periode_debut: string | null;
  periode_fin: string | null;
  reference: string | null;
  notes: string | null;
}

interface PaiementFormData {
  magasin_id: number;
  montant: number;
  methode_paiement: string;
  statut: 'paye' | 'en_attente' | 'echoue';
  periode_debut: string;
  periode_fin: string;
  reference: string;
  notes: string;
}

const PaiementsList = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [magasins, setMagasins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    magasin_id: '',
    statut: '',
    periode_debut: '',
    periode_fin: '',
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PaiementFormData>({
    defaultValues: {
      magasin_id: 0,
      montant: 0,
      methode_paiement: 'virement',
      statut: 'paye',
      periode_debut: '',
      periode_fin: '',
      reference: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchPaiements();
    fetchMagasins();
  }, [filters]);

  const fetchPaiements = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 100 };
      
      if (filters.magasin_id) params.magasin_id = filters.magasin_id;
      if (filters.statut) params.statut = filters.statut;
      if (filters.periode_debut) params.periode_debut = filters.periode_debut;
      if (filters.periode_fin) params.periode_fin = filters.periode_fin;

      const response = await axios.get('/super-admin/paiements', { params });
      setPaiements(response.data.paiements || []);
    } catch (error: any) {
      console.error('Erreur chargement paiements:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMagasins = async () => {
    try {
      const response = await axios.get('/super-admin/magasins', {
        params: { page: 1, limit: 100 },
      });
      setMagasins(response.data.magasins || []);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const onSubmit = async (data: PaiementFormData) => {
    try {
      await axios.post('/super-admin/paiements', {
        ...data,
        magasin_id: data.magasin_id || null,
        periode_debut: data.periode_debut || null,
        periode_fin: data.periode_fin || null,
        reference: data.reference || null,
        notes: data.notes || null,
      });
      toast.success('Paiement enregistré avec succès');
      setShowModal(false);
      reset();
      fetchPaiements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'paye':
        return 'bg-green-100 text-green-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'echoue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'paye':
        return 'Payé';
      case 'en_attente':
        return 'En attente';
      case 'echoue':
        return 'Échoué';
      default:
        return statut;
    }
  };

  const totalPaiements = paiements.reduce((sum, p) => sum + parseFloat(p.montant.toString()), 0);
  const totalPayes = paiements
    .filter(p => p.statut === 'paye')
    .reduce((sum, p) => sum + parseFloat(p.montant.toString()), 0);

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Paiements</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Paiement</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Paiements</p>
              <p className="text-2xl font-bold text-gray-800">{paiements.length}</p>
            </div>
            <CreditCard className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Montant Total</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalPaiements.toFixed(2)} MAD
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-success" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Montant Payé</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalPayes.toFixed(2)} MAD
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Magasin
            </label>
            <select
              value={filters.magasin_id}
              onChange={(e) => setFilters({ ...filters, magasin_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tous les magasins</option>
              {magasins.map((magasin) => (
                <option key={magasin.id} value={magasin.id}>
                  {magasin.nom_magasin}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
              <option value="echoue">Échoué</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={filters.periode_debut}
              onChange={(e) => setFilters({ ...filters, periode_debut: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={filters.periode_fin}
              onChange={(e) => setFilters({ ...filters, periode_fin: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        {(filters.magasin_id || filters.statut || filters.periode_debut || filters.periode_fin) && (
          <button
            onClick={() => setFilters({ magasin_id: '', statut: '', periode_debut: '', periode_fin: '' })}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste des paiements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {paiements.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun paiement trouvé</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-primary hover:underline"
            >
              Enregistrer votre premier paiement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Magasin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Méthode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {paiement.nom_magasin}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {Number(paiement.montant).toFixed(2)} MAD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">
                      {paiement.methode_paiement || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatutColor(paiement.statut)}`}
                    >
                      {getStatutLabel(paiement.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {paiement.periode_debut && paiement.periode_fin
                        ? `${new Date(paiement.periode_debut).toLocaleDateString('fr-FR')} - ${new Date(paiement.periode_fin).toLocaleDateString('fr-FR')}`
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {paiement.reference || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Nouveau Paiement</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Magasin *
                </label>
                <select
                  {...register('magasin_id', { required: 'Le magasin est requis', valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="0">Sélectionner un magasin</option>
                  {magasins.map((magasin) => (
                    <option key={magasin.id} value={magasin.id}>
                      {magasin.nom_magasin}
                    </option>
                  ))}
                </select>
                {errors.magasin_id && (
                  <p className="text-danger text-xs mt-1">{errors.magasin_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (MAD) *
                  </label>
                  <input
                    {...register('montant', {
                      required: 'Le montant est requis',
                      valueAsNumber: true,
                      min: { value: 0.01, message: 'Le montant doit être positif' },
                    })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.montant && (
                    <p className="text-danger text-xs mt-1">{errors.montant.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de paiement *
                  </label>
                  <select
                    {...register('methode_paiement', { required: 'La méthode est requise' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  {...register('statut', { required: 'Le statut est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="paye">Payé</option>
                  <option value="en_attente">En attente</option>
                  <option value="echoue">Échoué</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période début
                  </label>
                  <input
                    {...register('periode_debut')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période fin
                  </label>
                  <input
                    {...register('periode_fin')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence
                </label>
                <input
                  {...register('reference')}
                  type="text"
                  placeholder="Numéro de référence (facture, chèque, etc.)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Notes supplémentaires..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
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

export default PaiementsList;
