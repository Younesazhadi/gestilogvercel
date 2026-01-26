import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Package, X, Check, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plan } from '../../types';

interface PlanFormData {
  nom: string;
  prix_mensuel: number;
  nb_utilisateurs_max: number;
  nb_produits_max: number | null;
  fonctionnalites: Record<string, boolean>;
  actif: boolean;
}

interface SubModule {
  key: string;
  name: string;
  features: string[];
}

interface ModuleConfig {
  key: string;
  name: string;
  features: string[];
  subModules?: SubModule[];
}

const PlansList = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      nom: '',
      prix_mensuel: 0,
      nb_utilisateurs_max: 1,
      nb_produits_max: null,
      fonctionnalites: {},
      actif: true,
    },
  });

  const fonctionnalites = watch('fonctionnalites');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/super-admin/plans');
      setPlans(response.data.plans || []);
    } catch (error: any) {
      console.error('Erreur chargement plans:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    reset({
      nom: '',
      prix_mensuel: 0,
      nb_utilisateurs_max: 1,
      nb_produits_max: null,
      fonctionnalites: {},
      actif: true,
    });
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    reset({
      nom: plan.nom,
      prix_mensuel: plan.prix_mensuel,
      nb_utilisateurs_max: plan.nb_utilisateurs_max,
      nb_produits_max: plan.nb_produits_max,
      fonctionnalites: plan.fonctionnalites || {},
      actif: plan.actif,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: PlanFormData) => {
    try {
      // Préparer les données à envoyer
      const payload = {
        nom: data.nom,
        prix_mensuel: parseFloat(data.prix_mensuel.toString()),
        nb_utilisateurs_max: parseInt(data.nb_utilisateurs_max.toString()),
        nb_produits_max: data.nb_produits_max === null || data.nb_produits_max === '' 
          ? null 
          : parseInt(data.nb_produits_max.toString()),
        fonctionnalites: data.fonctionnalites || {},
        actif: data.actif !== undefined ? data.actif : true,
      };

      if (editingPlan) {
        await axios.put(`/super-admin/plans/${editingPlan.id}`, payload);
        toast.success('Plan modifié avec succès');
      } else {
        await axios.post('/super-admin/plans', payload);
        toast.success('Plan créé avec succès');
      }
      setShowModal(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le plan "${nom}" ?`)) {
      return;
    }

    try {
      await axios.delete(`/super-admin/plans/${id}`);
      toast.success('Plan supprimé avec succès');
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const toggleFonctionnalite = (key: string) => {
    const current = watch('fonctionnalites') || {};
    setValue('fonctionnalites', {
      ...current,
      [key]: !current[key],
    });
  };

  // Définir les modules avec leurs fonctionnalités et métadonnées
  const modulesConfig: ModuleConfig[] = [
    {
      key: 'produits',
      name: '📦 Module Produits',
      features: [
        'produits_consulter',
        'produits_creer',
        'produits_modifier',
        'produits_supprimer',
        'produits_modifier_prix',
        'produits_upload_images',
        'produits_code_barres',
        'produits_categories',
      ],
    },
    {
      key: 'stock',
      name: '📊 Module Stock',
      features: [
        'stock_consulter',
        'stock_entrees',
        'stock_sorties',
        'stock_ajustements',
        'stock_inventaire',
        'stock_alertes',
        'stock_alertes_rupture',
        'stock_alertes_seuil',
      ],
    },
    {
      key: 'ventes',
      name: '🛒 Module Ventes',
      features: [
        'ventes_consulter',
        'ventes_creer',
        'ventes_modifier',
        'ventes_supprimer',
        'ventes_annuler',
        'ventes_remises',
        'ventes_pos',
        'ventes_tickets',
        'ventes_factures',
        'ventes_devis',
        'ventes_bons_livraison',
      ],
    },
    {
      key: 'clients',
      name: '👥 Module Clients',
      features: [
        'clients_consulter',
        'clients_creer',
        'clients_modifier',
        'clients_supprimer',
        'clients_credit',
        'clients_paiements',
        'clients_historique',
      ],
    },
    {
      key: 'fournisseurs',
      name: '🚚 Module Fournisseurs',
      features: [
        'fournisseurs_consulter',
        'fournisseurs_creer',
        'fournisseurs_modifier',
        'fournisseurs_supprimer',
        'fournisseurs_commandes',
        'fournisseurs_historique',
      ],
    },
    {
      key: 'utilisateurs',
      name: '👤 Module Utilisateurs',
      features: [
        'utilisateurs_consulter',
        'utilisateurs_creer',
        'utilisateurs_modifier',
        'utilisateurs_supprimer',
        'utilisateurs_permissions',
      ],
    },
    {
      key: 'rapports',
      name: '📈 Module Rapports',
      features: [
        'rapports_basiques',
        'rapports_avances',
        'rapports_ventes',
        'rapports_financiers',
        'rapports_stock',
        'rapports_top_produits',
        'rapports_par_categorie',
        'rapports_par_utilisateur',
        'rapports_graphiques',
        'rapports_export',
      ],
    },
    {
      key: 'documents',
      name: '📄 Module Documents',
      subModules: [
        {
          key: 'documents_liste',
          name: '📋 Documents (Factures, Devis, BL, Tickets)',
          features: [
            'documents_factures',
            'documents_devis',
            'documents_bons_livraison',
            'documents_tickets',
            'documents_impression',
            'documents_pdf',
          ],
        },
        {
          key: 'documents_cheques',
          name: '💳 Gestion des Chèques',
          features: [
            'documents_cheques_consulter',
            'documents_cheques_deposer',
            'documents_cheques_payer',
            'documents_cheques_impayer',
          ],
        },
      ],
      features: [], // Les fonctionnalités sont maintenant dans les sous-modules
    },
    {
      key: 'dashboard',
      name: '📊 Module Dashboard',
      features: [
        'dashboard_statistiques',
        'dashboard_ca',
        'dashboard_ventes',
        'dashboard_graphiques',
        'dashboard_alertes',
      ],
    },
    {
      key: 'categories',
      name: '🏷️ Module Catégories',
      features: [
        'categories_consulter',
        'categories_creer',
        'categories_modifier',
        'categories_supprimer',
        'categories_hierarchie',
      ],
    },
    {
      key: 'avancees',
      name: '⚙️ Fonctionnalités Avancées',
      features: [
        'multi_magasins',
        'api_access',
        'support_prioritaire',
        'upload_images',
        'code_barres_scanner',
        'export_donnees',
        'import_donnees',
        'sauvegarde_automatique',
        'logs_activite',
        'notifications_email',
        'notifications_sms',
        'tout_inclus',
      ],
    },
  ];

  // Générer automatiquement la liste de toutes les fonctionnalités à partir des modules et sous-modules
  const toutesLesFonctionnalites = modulesConfig.flatMap(module => {
    if (module.subModules) {
      // Si le module a des sous-modules, prendre les fonctionnalités de tous les sous-modules
      return module.subModules.flatMap(subModule => subModule.features);
    }
    return module.features;
  });

  // Vérifier si toutes les fonctionnalités sont sélectionnées
  const toutesSelectionnees = toutesLesFonctionnalites.every(
    key => fonctionnalites?.[key] === true
  );

  // Sélectionner/désélectionner toutes les fonctionnalités
  const toggleToutesLesFonctionnalites = () => {
    const current = watch('fonctionnalites') || {};
    const newFonctionnalites: Record<string, boolean> = {};
    
    if (toutesSelectionnees) {
      // Désélectionner tout
      setValue('fonctionnalites', {});
    } else {
      // Sélectionner tout
      toutesLesFonctionnalites.forEach(key => {
        newFonctionnalites[key] = true;
      });
      setValue('fonctionnalites', newFonctionnalites);
    }
  };

  // Créer un objet modules pour la compatibilité avec le code existant
  const modules = modulesConfig.reduce((acc, module) => {
    if (module.subModules) {
      // Si le module a des sous-modules, combiner toutes les fonctionnalités des sous-modules
      acc[module.key] = module.subModules.flatMap(subModule => subModule.features);
    } else {
      acc[module.key] = module.features;
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Vérifier si toutes les fonctionnalités d'un module sont sélectionnées
  const moduleEstComplet = (moduleKeys: string[]) => {
    return moduleKeys.every(key => fonctionnalites?.[key] === true);
  };

  // Sélectionner/désélectionner toutes les fonctionnalités d'un module
  const toggleModule = (moduleKeys: string[]) => {
    const current = watch('fonctionnalites') || {};
    const newFonctionnalites = { ...current };
    const estComplet = moduleEstComplet(moduleKeys);
    
    moduleKeys.forEach(key => {
      newFonctionnalites[key] = !estComplet;
    });
    
    setValue('fonctionnalites', newFonctionnalites);
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Plans</h1>
        <button
          onClick={openCreateModal}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-primary"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{plan.nom}</h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {Number(plan.prix_mensuel).toFixed(2)} MAD
                  <span className="text-sm font-normal text-gray-500">/mois</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(plan)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                  title="Modifier"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id, plan.nom)}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                  title="Supprimer"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Utilisateurs max:</span>
                <span className="font-medium">{plan.nb_utilisateurs_max}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Produits max:</span>
                <span className="font-medium">
                  {plan.nb_produits_max ? plan.nb_produits_max.toLocaleString() : 'Illimité'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Statut:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.actif
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            {plan.fonctionnalites && Object.keys(plan.fonctionnalites).length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Modules inclus:</p>
                <div className="flex flex-wrap gap-2">
                  {modulesConfig.map((module) => {
                    // Si le module a des sous-modules
                    if (module.subModules) {
                      const activeSubModules = module.subModules.filter(subModule => {
                        const subActiveFeatures = subModule.features.filter(
                          key => plan.fonctionnalites[key] === true
                        ).length;
                        return subActiveFeatures > 0;
                      });

                      // Si aucun sous-module n'est actif, ne rien afficher
                      if (activeSubModules.length === 0) return null;

                      // Vérifier si tous les sous-modules sont complètement sélectionnés
                      const allSubModulesComplete = module.subModules.every(subModule => {
                        const subActiveFeatures = subModule.features.filter(
                          key => plan.fonctionnalites[key] === true
                        ).length;
                        return subActiveFeatures === subModule.features.length;
                      });

                      // Si tous les sous-modules sont complets, afficher seulement le module parent
                      if (allSubModulesComplete && activeSubModules.length === module.subModules.length) {
                        const totalFeatures = module.subModules.flatMap(sub => sub.features).length;
                        const activeFeatures = totalFeatures;
                        return (
                          <div
                            key={module.key}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              'bg-green-100 text-green-800 border border-green-300'
                            }`}
                            title={`Tous les sous-modules activés (${activeFeatures}/${totalFeatures} fonctionnalités)`}
                          >
                            <span className="mr-1">{module.name.split(' ')[0]}</span>
                            <span className="font-semibold">
                              {activeFeatures}/{totalFeatures}
                            </span>
                          </div>
                        );
                      }

                      // Sinon, afficher uniquement les sous-modules sélectionnés
                      return activeSubModules.map(subModule => {
                        const subActiveFeatures = subModule.features.filter(
                          key => plan.fonctionnalites[key] === true
                        ).length;
                        const subTotalFeatures = subModule.features.length;
                        const isSubModuleComplete = subActiveFeatures === subTotalFeatures;
                        
                        return (
                          <div
                            key={subModule.key}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              isSubModuleComplete
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                            title={`${subActiveFeatures}/${subTotalFeatures} fonctionnalités activées`}
                          >
                            <span className="mr-1">{subModule.name.split(' ')[0]}</span>
                            <span className="font-semibold">
                              {subActiveFeatures}/{subTotalFeatures}
                            </span>
                          </div>
                        );
                      });
                    }

                    // Module sans sous-modules (comportement normal)
                    const activeFeatures = module.features.filter(
                      key => plan.fonctionnalites[key] === true
                    ).length;
                    const totalFeatures = module.features.length;
                    const isModuleActive = activeFeatures > 0;
                    const isModuleComplete = activeFeatures === totalFeatures;

                    if (!isModuleActive) return null;

                    return (
                      <div
                        key={module.key}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          isModuleComplete
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                        title={`${activeFeatures}/${totalFeatures} fonctionnalités activées`}
                      >
                        <span className="mr-1">{module.name.split(' ')[0]}</span>
                        <span className="font-semibold">
                          {activeFeatures}/{totalFeatures}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {plan.fonctionnalites.tout_inclus === true && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                      ⭐ Tout inclus
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucun plan trouvé</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-primary hover:underline"
          >
            Créer votre premier plan
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingPlan ? 'Modifier le Plan' : 'Nouveau Plan'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du plan *
                  </label>
                  <input
                    {...register('nom', { required: 'Le nom est requis' })}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.nom && (
                    <p className="text-danger text-xs mt-1">{errors.nom.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix mensuel (MAD) *
                  </label>
                  <input
                    {...register('prix_mensuel', {
                      required: 'Le prix est requis',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Le prix doit être positif' },
                    })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.prix_mensuel && (
                    <p className="text-danger text-xs mt-1">{errors.prix_mensuel.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'utilisateurs max *
                  </label>
                  <input
                    {...register('nb_utilisateurs_max', {
                      required: 'Ce champ est requis',
                      valueAsNumber: true,
                      min: { value: 1, message: 'Minimum 1 utilisateur' },
                    })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.nb_utilisateurs_max && (
                    <p className="text-danger text-xs mt-1">{errors.nb_utilisateurs_max.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de produits max (laisser vide pour illimité)
                  </label>
                  <input
                    {...register('nb_produits_max', {
                      setValueAs: (v) => {
                        if (v === '' || v === null || v === undefined) return null;
                        const num = Number(v);
                        return isNaN(num) ? null : num;
                      },
                    })}
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Illimité"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fonctionnalités
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-primary hover:text-blue-700">
                    <input
                      type="checkbox"
                      checked={toutesSelectionnees}
                      onChange={toggleToutesLesFonctionnalites}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span>Sélectionner tout</span>
                  </label>
                </div>
                <div className="space-y-4 p-4 border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                  {modulesConfig.map((module) => {
                    // Si le module a des sous-modules, les afficher de manière indépendante
                    if (module.subModules) {
                      return (
                        <div key={module.key} className="border-b pb-4 last:border-b-0">
                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-800 text-lg">{module.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">Sélectionnez les sous-modules souhaités</p>
                          </div>
                          <div className="space-y-3 ml-4">
                            {module.subModules.map((subModule) => (
                              <div key={subModule.key} className="border-l-2 border-gray-200 pl-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-700">{subModule.name}</h5>
                                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-primary hover:text-blue-700">
                                    <input
                                      type="checkbox"
                                      checked={moduleEstComplet(subModule.features)}
                                      onChange={() => toggleModule(subModule.features)}
                                      className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span>Tout sélectionner</span>
                                  </label>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {subModule.features.map((key) => (
                                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={fonctionnalites?.[key] || false}
                                        onChange={() => toggleFonctionnalite(key)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-gray-700 capitalize">
                                        {key.replace(/_/g, ' ')}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    // Module sans sous-modules (comportement normal)
                    return (
                      <div key={module.key} className="border-b pb-2 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{module.name}</h4>
                          <label className="flex items-center space-x-2 cursor-pointer text-xs text-primary hover:text-blue-700">
                            <input
                              type="checkbox"
                              checked={moduleEstComplet(module.features)}
                              onChange={() => toggleModule(module.features)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>Tout sélectionner</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {module.features.map((key) => (
                            <label key={key} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fonctionnalites?.[key] || false}
                                onChange={() => toggleFonctionnalite(key)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    {...register('actif')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Plan actif</span>
                </label>
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
                  {editingPlan ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansList;
