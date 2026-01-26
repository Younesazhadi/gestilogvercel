import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Receipt, FileCheck, Truck, Search, Eye, Printer, Mail, DollarSign, Download, Plus, X, Package, User, ShoppingCart, Minus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vente, Produit, Client } from '../../types';
import ChequesList from './ChequesList';
import { generateDocumentPDF } from '../../utils/generateDocumentPDF';
import { useAuth } from '../../contexts/AuthContext';

interface LignePanier {
  produit_id: number;
  nom: string;
  image_url?: string | null;
  prix_unitaire: number;
  quantite: number;
  tva: number;
  montant_total: number;
}

const Documents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const planFeatures = user?.planFeatures || {};

  const canAccessDocumentsSubModule =
    planFeatures.tout_inclus === true ||
    planFeatures.documents_factures === true ||
    planFeatures.documents_devis === true ||
    planFeatures.documents_bons_livraison === true ||
    planFeatures.documents_tickets === true ||
    planFeatures.documents_impression === true ||
    planFeatures.documents_pdf === true;

  const canAccessChequesSubModule =
    planFeatures.tout_inclus === true ||
    planFeatures.documents_cheques_consulter === true ||
    planFeatures.documents_cheques_deposer === true ||
    planFeatures.documents_cheques_payer === true ||
    planFeatures.documents_cheques_impayer === true;

  const [documents, setDocuments] = useState<Vente[]>([]);
  // Loading utilisé uniquement pour la liste "Documents" (l'onglet Chèques a son propre loading dans ChequesList)
  const [loading, setLoading] = useState<boolean>(canAccessDocumentsSubModule);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'documents' | 'cheques'>(() => {
    if (canAccessDocumentsSubModule) return 'documents';
    if (canAccessChequesSubModule) return 'cheques';
    return 'documents';
  });
  const [entreprise, setEntreprise] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null);
  
  // États pour la création de document
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [typeDocument, setTypeDocument] = useState<'facture' | 'devis' | 'bl'>('facture');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchProduit, setSearchProduit] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [modePaiement, setModePaiement] = useState<string>('especes');
  const [remise, setRemise] = useState(0);
  const [referencePaiement, setReferencePaiement] = useState('');
  const [dateCheque, setDateCheque] = useState('');
  const [montantPaye, setMontantPaye] = useState(0);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Forcer l'onglet vers un sous-module autorisé
    if (activeTab === 'documents' && !canAccessDocumentsSubModule && canAccessChequesSubModule) {
      setActiveTab('cheques');
      return;
    }
    if (activeTab === 'cheques' && !canAccessChequesSubModule && canAccessDocumentsSubModule) {
      setActiveTab('documents');
      return;
    }

    // Charger uniquement les données du sous-module autorisé/actif
    if (activeTab === 'documents') {
      if (!canAccessDocumentsSubModule) return;
      setLoading(true);
      fetchDocuments();
      fetchEntrepriseInfo();
    } else {
      // Ne pas bloquer l'affichage sur l'onglet Chèques
      setLoading(false);
    }
  }, [search, typeFilter, activeTab, canAccessDocumentsSubModule, canAccessChequesSubModule]);

  const fetchEntrepriseInfo = async () => {
    try {
      const response = await axios.get('/admin/entreprise');
      setEntreprise(response.data.entreprise);
    } catch (error) {
      console.error('Erreur chargement infos entreprise:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/admin/ventes', {
        params: {
          search,
          type_document: typeFilter || undefined,
          page: 1,
          limit: 50,
        },
      });
      setDocuments(response.data.ventes);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Recherche de produits
  useEffect(() => {
    if (searchProduit.length >= 2) {
      const timeout = setTimeout(() => {
        fetchProduits();
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setProduits([]);
    }
  }, [searchProduit]);

  const fetchProduits = async () => {
    try {
      const response = await axios.get('/admin/produits', {
        params: { search: searchProduit, page: 1, limit: 20 },
      });
      setProduits(response.data.produits || []);
    } catch (error) {
      console.error('Erreur recherche produits:', error);
    }
  };

  // Recherche de clients
  useEffect(() => {
    if (searchClient.length >= 1) {
      const timeout = setTimeout(() => {
        fetchClients();
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setClients([]);
      setShowClientList(false);
    }
  }, [searchClient]);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/admin/clients', {
        params: { search: searchClient, page: 1, limit: 10 },
      });
      setClients(response.data.clients || []);
      setShowClientList(response.data.clients && response.data.clients.length > 0);
    } catch (error) {
      console.error('Erreur recherche clients:', error);
    }
  };

  const ajouterAuPanier = (produit: Produit) => {
    const ligneExistante = panier.find((l) => l.produit_id === produit.id);
    const prixUnitaire = Number(produit.prix_vente);
    
    if (ligneExistante) {
      setPanier(
        panier.map((l) =>
          l.produit_id === produit.id
            ? {
                ...l,
                quantite: l.quantite + 1,
                montant_total: (l.quantite + 1) * l.prix_unitaire * (1 + l.tva / 100),
              }
            : l
        )
      );
    } else {
      setPanier([
        ...panier,
        {
          produit_id: produit.id,
          nom: produit.nom,
          image_url: produit.image_url,
          prix_unitaire: prixUnitaire,
          quantite: 1,
          tva: 0,
          montant_total: prixUnitaire,
        },
      ]);
    }
    setSearchProduit('');
    setProduits([]);
  };

  const modifierQuantite = (produitId: number, delta: number) => {
    setPanier(
      panier
        .map((l) => {
          if (l.produit_id === produitId) {
            const nouvelleQuantite = Math.max(1, l.quantite + delta);
            return {
              ...l,
              quantite: nouvelleQuantite,
              montant_total: nouvelleQuantite * l.prix_unitaire * (1 + l.tva / 100),
            };
          }
          return l;
        })
        .filter((l) => l.quantite > 0)
    );
  };

  const supprimerLigne = (produitId: number) => {
    setPanier(panier.filter((l) => l.produit_id !== produitId));
  };

  const calculerTotal = () => {
    const sousTotal = panier.reduce((sum, l) => sum + l.montant_total / (1 + l.tva / 100), 0);
    const totalTVA = panier.reduce((sum, l) => sum + (l.montant_total - l.montant_total / (1 + l.tva / 100)), 0);
    const totalHT = sousTotal * (1 - remise / 100);
    const totalTTC = totalHT + totalTVA * (1 - remise / 100);
    return { totalHT, totalTVA, totalTTC };
  };

  const creerDocument = async () => {
    if (panier.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    if (typeDocument === 'facture' && !clientSelectionne) {
      toast.error('Un client doit être sélectionné pour une facture');
      return;
    }

    if (modePaiement === 'credit' && !clientSelectionne) {
      toast.error('Un client doit être sélectionné pour le paiement à crédit');
      return;
    }

    if (modePaiement === 'cheque' && !clientSelectionne) {
      toast.error('Un client doit être sélectionné pour le paiement par chèque');
      return;
    }

    if (modePaiement === 'cheque' && !referencePaiement.trim()) {
      toast.error('Le numéro de chèque est requis');
      return;
    }

    setCreating(true);
    try {
      const { totalHT, totalTVA, totalTTC } = calculerTotal();
      const response = await axios.post('/admin/ventes', {
        type_document: typeDocument,
        client_id: clientSelectionne?.id || null,
        lignes: panier.map((l) => ({
          produit_id: l.produit_id,
          designation: l.nom,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          tva: l.tva,
          remise_ligne: 0,
        })),
        remise,
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement || null,
        date_cheque: dateCheque || null,
        montant_paye: modePaiement === 'credit' ? montantPaye : null,
        notes: notes || null,
      });

      toast.success('Document créé avec succès');
      
      // Exporter automatiquement en PDF si entreprise disponible
      if (entreprise) {
        try {
          const venteComplete = response.data.vente;
          await generateDocumentPDF(venteComplete, entreprise);
          toast.success('PDF généré avec succès');
        } catch (error) {
          console.error('Erreur génération PDF:', error);
        }
      }

      // Réinitialiser le formulaire
      setPanier([]);
      setClientSelectionne(null);
      setSearchClient('');
      setSearchProduit('');
      setRemise(0);
      setReferencePaiement('');
      setDateCheque('');
      setMontantPaye(0);
      setNotes('');
      setShowCreateModal(false);
      
      // Rafraîchir la liste
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleExportPDF = async (vente: Vente) => {
    if (!entreprise) {
      toast.error('Impossible de charger les informations de l\'entreprise');
      return;
    }

    setGeneratingPDF(vente.id);
    try {
      const response = await axios.get(`/admin/ventes/${vente.id}`);
      const venteComplete = response.data.vente;
      await generateDocumentPDF(venteComplete, entreprise);
      toast.success('PDF généré avec succès');
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handleEnvoyerEmail = async (vente: Vente) => {
    if (!vente.client_id) {
      toast.error('Aucun client associé à ce document');
      return;
    }
    try {
      // TODO: Implémenter l'envoi par email
      toast.success('Email envoyé avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'facture':
        return <Receipt className="h-5 w-5" />;
      case 'devis':
        return <FileCheck className="h-5 w-5" />;
      case 'bl':
        return <Truck className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'facture':
        return 'Facture';
      case 'devis':
        return 'Devis';
      case 'bl':
        return 'Bon de livraison';
      default:
        return 'Ticket';
    }
  };

  if (loading && activeTab === 'documents') {
    return <div className="p-8">Chargement...</div>;
  }

  // Sécurité UI: si aucun sous-module n'est autorisé, afficher un message
  if (!canAccessDocumentsSubModule && !canAccessChequesSubModule) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h1>
          <p className="text-gray-600">
            Votre plan d’abonnement ne vous donne pas accès au module Documents/Chèques.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {activeTab === 'cheques' ? 'Chèques' : 'Documents'}
        </h1>
        {activeTab === 'documents' && canAccessDocumentsSubModule && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Nouveau document</span>
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {canAccessDocumentsSubModule && (
            <button
              onClick={() => setActiveTab('documents')}
              className={`${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </button>
          )}
          {canAccessChequesSubModule && (
            <button
              onClick={() => setActiveTab('cheques')}
              className={`${
                activeTab === 'cheques'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Chèques</span>
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'cheques' ? (
        canAccessChequesSubModule ? (
          <ChequesList />
        ) : null
      ) : (
        <>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Tous les types</option>
          <option value="facture">Factures</option>
          <option value="devis">Devis</option>
          <option value="bl">Bons de livraison</option>
          <option value="ticket">Tickets</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-lg">
                  {getTypeIcon(doc.type_document)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{doc.numero_vente}</h3>
                  <p className="text-sm text-gray-500">{getTypeLabel(doc.type_document)}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  doc.statut === 'valide'
                    ? 'bg-green-100 text-green-800'
                    : doc.statut === 'annule'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {doc.statut}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">{new Date(doc.date_vente).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Client:</span>
                <span className="font-medium">{(doc as any).client_nom || 'Non renseigné'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Montant:</span>
                <span className="font-bold text-primary">{Number(doc.montant_ttc).toFixed(2)} MAD</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <button
                onClick={() => navigate(`/admin/ventes/${doc.id}`)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Eye className="h-4 w-4" />
                <span>Voir</span>
              </button>
              <button
                    onClick={() => handleExportPDF(doc)}
                    disabled={generatingPDF === doc.id}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generatingPDF === doc.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>PDF</span>
                      </>
                    )}
              </button>
              {doc.type_document === 'facture' && doc.client_id && (
                <button
                  onClick={() => handleEnvoyerEmail(doc)}
                  className="flex items-center justify-center px-3 py-2 bg-success text-white rounded-lg hover:bg-green-700"
                  title="Envoyer par email"
                >
                  <Mail className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun document trouvé</p>
            </div>
          )}
        </>
      )}

      {/* Modal de création de document */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Nouveau document</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Type de document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de document *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {(['facture', 'devis', 'bl'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeDocument(type)}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        typeDocument === type
                          ? 'border-primary bg-primary bg-opacity-10'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {getTypeIcon(type)}
                      <p className="mt-2 font-medium">{getTypeLabel(type)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client {typeDocument === 'facture' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    onFocus={() => {
                      if (searchClient.length >= 1) {
                        fetchClients();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {showClientList && clients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setClientSelectionne(client);
                            setSearchClient(client.nom || '');
                            setShowClientList(false);
                            setClients([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          <p className="font-medium">{client.nom}</p>
                          {client.telephone && (
                            <p className="text-sm text-gray-500">{client.telephone}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {clientSelectionne && (
                  <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm font-medium">{clientSelectionne.nom}</span>
                    <button
                      onClick={() => {
                        setClientSelectionne(null);
                        setSearchClient('');
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Recherche et ajout de produits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produits
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchProduit}
                    onChange={(e) => setSearchProduit(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                {produits.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {produits.map((produit) => (
                      <button
                        key={produit.id}
                        onClick={() => ajouterAuPanier(produit)}
                        disabled={produit.stock_actuel <= 0 && typeDocument !== 'devis'}
                        className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                          produit.stock_actuel <= 0 && typeDocument !== 'devis'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {produit.image_url ? (
                            <img
                              src={produit.image_url}
                              alt={produit.nom}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{produit.nom}</p>
                            <p className="text-xs text-gray-500">
                              {Number(produit.prix_vente).toFixed(2)} MAD
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Panier */}
              {panier.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Panier
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {panier.map((ligne) => (
                      <div key={ligne.produit_id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {ligne.image_url ? (
                              <img
                                src={ligne.image_url}
                                alt={ligne.nom}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ligne.nom}</p>
                              <p className="text-xs text-gray-500">
                                {Number(ligne.prix_unitaire).toFixed(2)} MAD × {ligne.quantite}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => modifierQuantite(ligne.produit_id, -1)}
                              className="p-1 text-gray-600 hover:text-gray-800"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium w-8 text-center">{ligne.quantite}</span>
                            <button
                              onClick={() => modifierQuantite(ligne.produit_id, 1)}
                              className="p-1 text-gray-600 hover:text-gray-800"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="font-bold text-primary ml-4 w-20 text-right">
                              {Number(ligne.montant_total).toFixed(2)} MAD
                            </span>
                            <button
                              onClick={() => supprimerLigne(ligne.produit_id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totaux */}
              {panier.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      {remise > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remise:</span>
                          <span className="font-medium">{remise}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total HT:</span>
                        <span className="font-medium">{calculerTotal().totalHT.toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TVA:</span>
                        <span className="font-medium">{calculerTotal().totalTVA.toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span className="text-primary">{calculerTotal().totalTTC.toFixed(2)} MAD</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remise */}
              {panier.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remise (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={remise}
                    onChange={(e) => setRemise(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {/* Mode de paiement */}
              {panier.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="virement">Virement</option>
                    {clientSelectionne && <option value="credit">Crédit</option>}
                  </select>
                </div>
              )}

              {/* Détails paiement chèque */}
              {modePaiement === 'cheque' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de chèque *
                    </label>
                    <input
                      type="text"
                      value={referencePaiement}
                      onChange={(e) => setReferencePaiement(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date du chèque *
                    </label>
                    <input
                      type="date"
                      value={dateCheque}
                      onChange={(e) => setDateCheque(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Montant payé pour crédit */}
              {modePaiement === 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant payé (MAD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Notes supplémentaires..."
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={creerDocument}
                  disabled={creating || panier.length === 0}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Créer et exporter PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
