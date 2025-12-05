import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, User, X, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface User {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  role: string;
  permissions: Record<string, boolean> | null;
  actif: boolean;
  derniere_connexion: string | null;
  created_at: string;
}

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  actif: boolean;
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<UserFormData>();

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users', {
        params: { search, page: 1, limit: 50 },
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValue('nom', user.nom);
    setValue('prenom', user.prenom || '');
    setValue('email', user.email);
    setValue('actif', user.actif);
    setPermissions(user.permissions || {});
    setShowModal(true);
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      const payload: any = {
        ...data,
        permissions,
      };

      // Ne pas envoyer le mot de passe si vide (modification)
      if (editingUser && !data.password) {
        delete payload.password;
      }

      if (editingUser) {
        await axios.put(`/admin/users/${editingUser.id}`, payload);
        toast.success('Utilisateur modifié avec succès');
      } else {
        if (!data.password) {
          toast.error('Le mot de passe est requis pour un nouvel utilisateur');
          return;
        }
        await axios.post('/admin/users', payload);
        toast.success('Utilisateur créé avec succès');
      }
      setShowModal(false);
      setEditingUser(null);
      reset();
      setPermissions({});
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await axios.delete(`/admin/users/${id}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const togglePermission = (module: string, action: string) => {
    const key = `${module}.${action}`;
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  // Sélectionner/désélectionner toutes les permissions
  const toggleAllPermissions = () => {
    const allPermissions: Record<string, boolean> = {};
    let allSelected = true;

    // Vérifier si toutes les permissions sont déjà sélectionnées
    permissionModules.forEach((module) => {
      module.actions.forEach((action) => {
        const key = `${module.module}.${action.key}`;
        if (!permissions[key]) {
          allSelected = false;
        }
      });
    });

    // Si toutes sont sélectionnées, tout désélectionner, sinon tout sélectionner
    if (allSelected) {
      setPermissions({});
    } else {
      permissionModules.forEach((module) => {
        module.actions.forEach((action) => {
          const key = `${module.module}.${action.key}`;
          allPermissions[key] = true;
        });
      });
      setPermissions(allPermissions);
    }
  };

  // Sélectionner/désélectionner toutes les permissions d'un module
  const toggleModulePermissions = (module: string) => {
    const moduleData = permissionModules.find((m) => m.module === module);
    if (!moduleData) return;

    let allModuleSelected = true;
    moduleData.actions.forEach((action) => {
      const key = `${module}.${action.key}`;
      if (!permissions[key]) {
        allModuleSelected = false;
      }
    });

    const newPermissions = { ...permissions };
    if (allModuleSelected) {
      // Désélectionner toutes les permissions du module
      moduleData.actions.forEach((action) => {
        const key = `${module}.${action.key}`;
        delete newPermissions[key];
      });
    } else {
      // Sélectionner toutes les permissions du module
      moduleData.actions.forEach((action) => {
        const key = `${module}.${action.key}`;
        newPermissions[key] = true;
      });
    }
    setPermissions(newPermissions);
  };

  // Vérifier si toutes les permissions sont sélectionnées
  const areAllPermissionsSelected = () => {
    let allSelected = true;
    permissionModules.forEach((module) => {
      module.actions.forEach((action) => {
        const key = `${module.module}.${action.key}`;
        if (!permissions[key]) {
          allSelected = false;
        }
      });
    });
    return allSelected;
  };

  // Vérifier si toutes les permissions d'un module sont sélectionnées
  const areAllModulePermissionsSelected = (module: string) => {
    const moduleData = permissionModules.find((m) => m.module === module);
    if (!moduleData) return false;

    let allSelected = true;
    moduleData.actions.forEach((action) => {
      const key = `${module}.${action.key}`;
      if (!permissions[key]) {
        allSelected = false;
      }
    });
    return allSelected;
  };

  const permissionModules = [
    {
      module: 'ventes',
      label: 'Ventes',
      actions: [
        { key: 'consulter', label: 'Consulter les ventes' },
        { key: 'creer', label: 'Créer des ventes' },
        { key: 'modifier', label: 'Modifier des ventes' },
        { key: 'supprimer', label: 'Annuler des ventes' },
        { key: 'remises', label: 'Appliquer des remises' },
        { key: 'voir_prix_achat', label: 'Voir les prix d\'achat' },
      ],
    },
    {
      module: 'produits',
      label: 'Produits',
      actions: [
        { key: 'consulter', label: 'Consulter les produits' },
        { key: 'creer', label: 'Créer des produits' },
        { key: 'modifier', label: 'Modifier des produits' },
        { key: 'supprimer', label: 'Supprimer des produits' },
        { key: 'modifier_prix', label: 'Modifier les prix' },
        { key: 'importer_exporter', label: 'Importer/Exporter' },
      ],
    },
    {
      module: 'stock',
      label: 'Stock',
      actions: [
        { key: 'consulter', label: 'Consulter le stock' },
        { key: 'entrees', label: 'Faire des entrées de stock' },
        { key: 'sorties', label: 'Faire des sorties de stock' },
        { key: 'ajustements', label: 'Faire des ajustements' },
        { key: 'inventaire', label: 'Faire des inventaires' },
      ],
    },
    {
      module: 'clients',
      label: 'Clients',
      actions: [
        { key: 'consulter', label: 'Consulter les clients' },
        { key: 'gerer', label: 'Créer/Modifier des clients' },
        { key: 'voir_soldes', label: 'Voir les soldes clients' },
        { key: 'paiements', label: 'Enregistrer des paiements' },
      ],
    },
    {
      module: 'fournisseurs',
      label: 'Fournisseurs',
      actions: [
        { key: 'consulter', label: 'Consulter les fournisseurs' },
        { key: 'gerer', label: 'Gérer les fournisseurs' },
        { key: 'commandes', label: 'Créer des commandes' },
      ],
    },
    {
      module: 'rapports',
      label: 'Rapports',
      actions: [
        { key: 'ventes', label: 'Voir les rapports de ventes' },
        { key: 'financiers', label: 'Voir les rapports financiers' },
        { key: 'stock', label: 'Voir les rapports de stock' },
        { key: 'exporter', label: 'Exporter les rapports' },
      ],
    },
    {
      module: 'documents',
      label: 'Documents',
      actions: [
        { key: 'factures', label: 'Créer des factures' },
        { key: 'devis', label: 'Créer des devis' },
        { key: 'bl', label: 'Créer des BL' },
        { key: 'envoyer_email', label: 'Envoyer par email' },
      ],
    },
  ];

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Utilisateurs</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            reset();
            setPermissions({});
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvel utilisateur</span>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière connexion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {user.nom} {user.prenom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.derniere_connexion
                    ? new Date(user.derniere_connexion).toLocaleString()
                    : 'Jamais'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role !== 'admin' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary hover:text-blue-700"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-danger hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  reset();
                  setPermissions({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
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
                    Prénom
                  </label>
                  <input
                    {...register('prenom')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide',
                      },
                    })}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe {!editingUser && '*'}
                  </label>
                  <input
                    {...register('password', {
                      required: !editingUser ? 'Mot de passe requis' : false,
                      minLength: {
                        value: 6,
                        message: 'Minimum 6 caractères',
                      },
                    })}
                    type="password"
                    placeholder={editingUser ? 'Laisser vide pour ne pas changer' : ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    {...register('actif')}
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Utilisateur actif</label>
                </div>
              </div>

              {/* Permissions */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Permissions</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={areAllPermissionsSelected()}
                      onChange={toggleAllPermissions}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Sélectionner tout</span>
                  </label>
                </div>
                <div className="space-y-6">
                  {permissionModules.map((module) => (
                    <div key={module.module} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">{module.label}</h4>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={areAllModulePermissionsSelected(module.module)}
                            onChange={() => toggleModulePermissions(module.module)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">Sélectionner tout</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.actions.map((action) => {
                          const key = `${module.module}.${action.key}`;
                          return (
                            <label
                              key={key}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={permissions[key] || false}
                                onChange={() => togglePermission(module.module, action.key)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{action.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    reset();
                    setPermissions({});
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;

