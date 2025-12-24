import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Magasin } from '../../types';

interface MagasinFormData {
  nom_magasin: string;
  adresse: string;
  telephone: string;
  plan_id: number | null;
  date_expiration_abonnement: string;
}

const MagasinsList = () => {
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<MagasinFormData>();

  useEffect(() => {
    fetchMagasins();
    fetchPlans();
  }, [search]);

  const fetchMagasins = async () => {
    try {
      const response = await axios.get('/super-admin/magasins', {
        params: { search, page: 1, limit: 50 },
      });
      setMagasins(response.data.magasins);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/super-admin/plans');
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Erreur chargement plans:', error);
    }
  };

  const onSubmit = async (data: MagasinFormData) => {
    try {
      // Générer un email unique basé sur le nom du magasin
      const emailBase = data.nom_magasin
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '')
        .substring(0, 30); // Limiter la longueur
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000);
      const email = `${emailBase}.${timestamp}${randomSuffix}@gestilog.local`;
      
      await axios.post('/super-admin/magasins', {
        nom_magasin: data.nom_magasin,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        plan_id: data.plan_id || null,
        date_expiration_abonnement: data.date_expiration_abonnement || null,
        email: email, // Email généré automatiquement (requis par la base de données)
      });
      toast.success('Magasin créé avec succès');
      setShowModal(false);
      reset();
      fetchMagasins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDelete = async (magasin: Magasin) => {
    try {
      // Récupérer les statistiques avant suppression
      const statsResponse = await axios.get(`/super-admin/magasins/${magasin.id}/stats-deletion`);
      const stats = statsResponse.data.statistiques;
      const totalElements = statsResponse.data.total_elements;

      // Afficher une confirmation avec les statistiques
      const message = `Êtes-vous sûr de vouloir supprimer le magasin "${magasin.nom_magasin}" ?\n\n` +
        `Cette action supprimera définitivement :\n` +
        `• ${stats.utilisateurs} utilisateur(s)\n` +
        `• ${stats.produits} produit(s)\n` +
        `• ${stats.categories} catégorie(s)\n` +
        `• ${stats.clients} client(s)\n` +
        `• ${stats.fournisseurs} fournisseur(s)\n` +
        `• ${stats.ventes} vente(s)\n` +
        `• ${stats.paiements} paiement(s)\n` +
        `• ${stats.commandes} commande(s)\n` +
        `• ${stats.mouvements_stock} mouvement(s) de stock\n` +
        `• ${stats.logs} log(s)\n\n` +
        `Total: ${totalElements} élément(s) seront supprimés.\n\n` +
        `Cette action est irréversible !`;

      if (!window.confirm(message)) {
        return;
      }

      // Supprimer le magasin
      await axios.delete(`/super-admin/magasins/${magasin.id}`);
      
      toast.success(
        `Magasin supprimé avec succès. ${totalElements} élément(s) supprimé(s).`,
        { duration: 5000 }
      );
      
      fetchMagasins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Magasins</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau magasin</span>
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date expiration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {magasins.map((magasin) => {
              const getExpirationStatus = () => {
                if (!magasin.date_expiration_abonnement) return null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiration = new Date(magasin.date_expiration_abonnement);
                expiration.setHours(0, 0, 0, 0);
                const diffTime = expiration.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                  return { text: `${Math.abs(diffDays)} jour(s) écoulé(s)`, color: 'text-red-600', bg: 'bg-red-50' };
                } else if (diffDays === 0) {
                  return { text: 'Expire aujourd\'hui', color: 'text-red-600', bg: 'bg-red-50' };
                } else if (diffDays <= 7) {
                  return { text: `${diffDays} jour(s) restant(s)`, color: 'text-orange-600', bg: 'bg-orange-50' };
                } else {
                  return { text: `${diffDays} jour(s) restant(s)`, color: 'text-gray-600', bg: 'bg-gray-50' };
                }
              };

              const expirationStatus = getExpirationStatus();

              return (
                <tr key={magasin.id} className={`hover:bg-gray-50 ${expirationStatus?.bg || ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{magasin.nom_magasin}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{magasin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        magasin.statut === 'actif'
                          ? 'bg-green-100 text-green-800'
                          : magasin.statut === 'suspendu'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {magasin.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {magasin.date_expiration_abonnement ? (
                      <div>
                        <div className="text-sm">{new Date(magasin.date_expiration_abonnement).toLocaleDateString('fr-FR')}</div>
                        {expirationStatus && (
                          <div className={`text-xs ${expirationStatus.color} mt-1`}>
                            {expirationStatus.text}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Non défini</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(magasin.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/super-admin/magasins/${magasin.id}`}
                        className="text-primary hover:underline"
                      >
                        Voir détails
                      </Link>
                      <button
                        onClick={() => handleDelete(magasin)}
                        className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                        title="Supprimer le magasin"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm">Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Nouveau magasin</h2>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du magasin *
                  </label>
                  <input
                    {...register('nom_magasin', { required: 'Nom requis' })}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: Magasin Casablanca"
                  />
                  {errors.nom_magasin && (
                    <p className="mt-1 text-sm text-danger">{errors.nom_magasin.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    {...register('telephone')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: +212 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan
                  </label>
                  <select
                    {...register('plan_id', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Sélectionner un plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nom} - {plan.prix_mensuel} MAD/mois
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration abonnement
                  </label>
                  <input
                    {...register('date_expiration_abonnement')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <textarea
                    {...register('adresse')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Adresse complète du magasin"
                  />
                </div>
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
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                >
                  Créer le magasin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagasinsList;
