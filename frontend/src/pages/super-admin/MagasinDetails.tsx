import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Edit, UserPlus, DollarSign, Package, ShoppingCart, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Magasin } from '../../types';
import { formatDateForInput } from '../../utils/dateUtils';

interface MagasinFormData {
  nom_magasin: string;
  adresse: string;
  telephone: string;
  email: string;
  ice: string;
  rc: string;
  plan_id: number | null;
  statut: string;
  date_expiration_abonnement: string;
  notes: string;
}

interface AdminFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

const MagasinDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [magasin, setMagasin] = useState<Magasin | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [statistiques, setStatistiques] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  const { register: registerMagasin, handleSubmit: handleSubmitMagasin, formState: { errors: errorsMagasin }, setValue: setValueMagasin } = useForm<MagasinFormData>();
  const { register: registerAdmin, handleSubmit: handleSubmitAdmin, formState: { errors: errorsAdmin }, reset: resetAdmin } = useForm<AdminFormData>();

  useEffect(() => {
    if (id) {
      fetchMagasin();
      fetchPlans();
    }
  }, [id]);

  const fetchMagasin = async () => {
    try {
      const response = await axios.get(`/super-admin/magasins/${id}`);
      setMagasin(response.data.magasin);
      setStatistiques(response.data.statistiques);
      
      // Pré-remplir le formulaire
      const m = response.data.magasin;
      setValueMagasin('nom_magasin', m.nom_magasin);
      setValueMagasin('adresse', m.adresse || '');
      setValueMagasin('telephone', m.telephone || '');
      setValueMagasin('email', m.email);
      setValueMagasin('ice', m.ice || '');
      setValueMagasin('rc', m.rc || '');
      setValueMagasin('plan_id', m.plan_id);
      setValueMagasin('statut', m.statut);
      setValueMagasin('date_expiration_abonnement', formatDateForInput(m.date_expiration_abonnement));
      setValueMagasin('notes', m.notes || '');
    } catch (error) {
      console.error('Erreur chargement magasin:', error);
      toast.error('Erreur lors du chargement');
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

  const onSubmitEdit = async (data: MagasinFormData) => {
    try {
      await axios.put(`/super-admin/magasins/${id}`, data);
      toast.success('Magasin modifié avec succès');
      setShowEditModal(false);
      fetchMagasin();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const onSubmitAdmin = async (data: AdminFormData) => {
    try {
      await axios.post(`/super-admin/magasins/${id}/admin`, {
        magasin_id: parseInt(id!),
        ...data,
      });
      toast.success('Admin créé avec succès');
      setShowAdminModal(false);
      resetAdmin();
      fetchMagasin();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDelete = async () => {
    if (!magasin || !id) return;

    try {
      // Récupérer les statistiques avant suppression
      const statsResponse = await axios.get(`/super-admin/magasins/${id}/stats-deletion`);
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
      await axios.delete(`/super-admin/magasins/${id}`);
      
      toast.success(
        `Magasin supprimé avec succès. ${totalElements} élément(s) supprimé(s).`,
        { duration: 5000 }
      );
      
      // Rediriger vers la liste des magasins
      navigate('/super-admin/magasins');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!magasin) {
    return <div className="p-8">Magasin introuvable</div>;
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/super-admin/magasins')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Retour à la liste</span>
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{magasin.nom_magasin}</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Edit className="h-5 w-5" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center space-x-2 bg-success text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <UserPlus className="h-5 w-5" />
            <span>Créer Admin</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Trash2 className="h-5 w-5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-800">{statistiques?.nb_utilisateurs || 0}</p>
            </div>
            <UserPlus className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Produits</p>
              <p className="text-2xl font-bold text-gray-800">{statistiques?.nb_produits || 0}</p>
            </div>
            <Package className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ventes</p>
              <p className="text-2xl font-bold text-gray-800">{statistiques?.nb_ventes || 0}</p>
            </div>
            <ShoppingCart className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CA Total</p>
              <p className="text-2xl font-bold text-gray-800">
                {parseFloat(statistiques?.ca_total || 0).toFixed(2)} MAD
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-success" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Informations générales</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nom du magasin</p>
              <p className="font-medium">{magasin.nom_magasin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{magasin.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium">{magasin.telephone || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-medium">{magasin.adresse || 'Non renseignée'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ICE</p>
              <p className="font-medium">{magasin.ice || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">RC</p>
              <p className="font-medium">{magasin.rc || 'Non renseigné'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Abonnement</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <span
                className={`inline-block px-3 py-1 text-sm rounded-full ${
                  magasin.statut === 'actif'
                    ? 'bg-green-100 text-green-800'
                    : magasin.statut === 'suspendu'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {magasin.statut}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium">{(magasin as any).plan_nom || 'Aucun plan'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de création</p>
              <p className="font-medium">{new Date(magasin.date_creation).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date d'expiration</p>
              <p className="font-medium">
                {magasin.date_expiration_abonnement
                  ? new Date(magasin.date_expiration_abonnement).toLocaleDateString()
                  : 'Non définie'}
              </p>
            </div>
            {magasin.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium">{magasin.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Modifier */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Modifier le magasin</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitMagasin(onSubmitEdit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du magasin *
                  </label>
                  <input
                    {...registerMagasin('nom_magasin', { required: 'Nom requis' })}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errorsMagasin.nom_magasin && (
                    <p className="mt-1 text-sm text-danger">{errorsMagasin.nom_magasin.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...registerMagasin('email', {
                      required: 'Email requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide',
                      },
                    })}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errorsMagasin.email && (
                    <p className="mt-1 text-sm text-danger">{errorsMagasin.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    {...registerMagasin('telephone')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan
                  </label>
                  <select
                    {...registerMagasin('plan_id', { valueAsNumber: true })}
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
                    Statut
                  </label>
                  <select
                    {...registerMagasin('statut')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="actif">Actif</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="expire">Expiré</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration abonnement
                  </label>
                  <input
                    {...registerMagasin('date_expiration_abonnement')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ICE
                  </label>
                  <input
                    {...registerMagasin('ice')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RC
                  </label>
                  <input
                    {...registerMagasin('rc')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  {...registerMagasin('adresse')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  {...registerMagasin('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Créer Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Créer un administrateur</h2>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  resetAdmin();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdmin(onSubmitAdmin)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  {...registerAdmin('nom', { required: 'Nom requis' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errorsAdmin.nom && (
                  <p className="mt-1 text-sm text-danger">{errorsAdmin.nom.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  {...registerAdmin('prenom')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  {...registerAdmin('email', {
                    required: 'Email requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide',
                    },
                  })}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errorsAdmin.email && (
                  <p className="mt-1 text-sm text-danger">{errorsAdmin.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  {...registerAdmin('password', {
                    required: 'Mot de passe requis',
                    minLength: {
                      value: 6,
                      message: 'Minimum 6 caractères',
                    },
                  })}
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errorsAdmin.password && (
                  <p className="mt-1 text-sm text-danger">{errorsAdmin.password.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    resetAdmin();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-success text-white rounded-lg hover:bg-green-700"
                >
                  Créer l'admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagasinDetails;
