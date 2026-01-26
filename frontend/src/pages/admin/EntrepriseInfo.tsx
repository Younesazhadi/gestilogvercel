import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Building2, Save, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface EntrepriseFormData {
  nom_magasin: string;
  proprietaire: string;
  activites: string;
  adresse: string;
  ville: string;
  code_postal: string;
  telephone_fixe: string;
  telephone_gsm: string;
  email: string;
  ice: string;
  rc: string;
  patent: string;
  if_fiscal: string;
  cnss: string;
  compte_bancaire: string;
  notes: string;
  logo_url: string;
}

const EntrepriseInfo = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EntrepriseFormData>();

  useEffect(() => {
    fetchEntrepriseInfo();
  }, []);

  const fetchEntrepriseInfo = async () => {
    try {
      const response = await axios.get('/admin/entreprise');
      setEntreprise(response.data.entreprise);
      
      // Pré-remplir le formulaire
      const e = response.data.entreprise;
      reset({
        nom_magasin: e.nom_magasin || '',
        proprietaire: e.proprietaire || '',
        activites: e.activites || '',
        adresse: e.adresse || '',
        ville: e.ville || '',
        code_postal: e.code_postal || '',
        telephone_fixe: e.telephone_fixe || '',
        telephone_gsm: e.telephone_gsm || '',
        email: e.email || '',
        ice: e.ice || '',
        rc: e.rc || '',
        patent: e.patent || '',
        if_fiscal: e.if_fiscal || '',
        cnss: e.cnss || '',
        compte_bancaire: e.compte_bancaire || '',
        notes: e.notes || '',
        logo_url: e.logo_url || '',
      });

      if (e.logo_url) {
        setLogoPreview(e.logo_url);
      }
    } catch (error: any) {
      console.error('Erreur chargement infos entreprise:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      // Vérifier le type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format de fichier non accepté. Formats acceptés: JPG, PNG, GIF, WEBP');
        return;
      }

      setLogoFile(file);
      
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: EntrepriseFormData) => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Ajouter tous les champs texte
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof EntrepriseFormData];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      // Ajouter le fichier logo si sélectionné
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await axios.put('/admin/entreprise', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setEntreprise(response.data.entreprise);
      setLogoFile(null);
      if (response.data.entreprise.logo_url) {
        setLogoPreview(response.data.entreprise.logo_url);
      }
      toast.success('Informations mises à jour avec succès');
    } catch (error: any) {
      console.error('Erreur mise à jour infos entreprise:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">Informations de l'entreprise</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section Logo */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Logo de l'entreprise</h2>
            <div className="space-y-4">
              {logoPreview && (
                <div className="relative inline-block">
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Logo actuel" 
                      className="h-32 w-32 object-contain border-2 border-gray-300 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {logoFile && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Logo actuel</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    <span>📤 Uploader le logo</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    Formats acceptés: JPG, PNG, GIF, WEBP (max 5MB)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Informations générales */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nom_magasin', { required: 'Le nom de l\'entreprise est requis' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.nom_magasin && (
                  <p className="mt-1 text-sm text-red-600">{errors.nom_magasin.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Propriétaire / Gérant
                </label>
                <input
                  type="text"
                  {...register('proprietaire')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activités
                </label>
                <textarea
                  {...register('activites')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Décrivez les activités de l'entreprise"
                />
              </div>
            </div>
          </div>

          {/* Section Adresse */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Adresse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  {...register('adresse')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  {...register('ville')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  {...register('code_postal')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Section Contact */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone fixe
                </label>
                <input
                  type="text"
                  {...register('telephone_fixe')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone GSM
                </label>
                <input
                  type="text"
                  {...register('telephone_gsm')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide'
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Informations légales */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations légales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RC (Registre de Commerce)
                </label>
                <input
                  type="text"
                  {...register('rc')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PATENTE
                </label>
                <input
                  type="text"
                  {...register('patent')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IF (Identification Fiscale)
                </label>
                <input
                  type="text"
                  {...register('if_fiscal')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNSS
                </label>
                <input
                  type="text"
                  {...register('cnss')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ICE (Identification Commune des Entreprises)
                </label>
                <input
                  type="text"
                  {...register('ice')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte bancaire
                </label>
                <input
                  type="text"
                  {...register('compte_bancaire')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Section Notes */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes</h2>
            <div>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Notes supplémentaires..."
              />
            </div>
          </div>

          {/* Informations en lecture seule */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations système</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium">
                  {entreprise?.date_creation 
                    ? new Date(entreprise.date_creation).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Magasin</p>
                <p className="font-medium">{entreprise?.id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntrepriseInfo;
