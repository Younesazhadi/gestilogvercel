import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, User, CreditCard, Edit2, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Produit, Client } from '../../types';

interface LignePanier {
  produit_id: number;
  nom: string;
  image_url?: string | null;
  prix_unitaire: number;
  quantite: number;
  tva: number;
  montant_total: number;
}

const POS = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [searchClient, setSearchClient] = useState<string>('');
  const [showClientList, setShowClientList] = useState(false);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [typeDocument, setTypeDocument] = useState<'ticket' | 'facture' | 'devis' | 'bl'>('ticket');
  const [modePaiement, setModePaiement] = useState<string>('especes');
  const [remise, setRemise] = useState(0);
  const [monnaieRecue, setMonnaieRecue] = useState(0);
  const [referencePaiement, setReferencePaiement] = useState('');
  const [dateCheque, setDateCheque] = useState('');
  const [montantPaye, setMontantPaye] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [showPaiementCredit, setShowPaiementCredit] = useState(false);
  const [showDepense, setShowDepense] = useState(false);
  const [categorieDepense, setCategorieDepense] = useState('');
  const [montantDepense, setMontantDepense] = useState(0);
  const [descriptionDepense, setDescriptionDepense] = useState('');
  const [modePaiementDepense, setModePaiementDepense] = useState('especes');
  const [referencePaiementDepense, setReferencePaiementDepense] = useState('');
  const [dateChequeDepense, setDateChequeDepense] = useState('');
  const [editingLigne, setEditingLigne] = useState<{ id: number; field: 'prix' | 'tva' | 'quantite' } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clientSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (search.length >= 2) {
      fetchProduits();
    } else if (search.length === 0) {
      fetchProduits();
    } else {
      setProduits([]);
    }
  }, [search]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Charger le client depuis les paramètres d'URL
  useEffect(() => {
    const clientId = searchParams.get('client_id');
    const payerCredit = searchParams.get('payer_credit') === 'true';
    
    if (clientId) {
      const loadClient = async () => {
        try {
          const response = await axios.get(`/admin/clients/${clientId}`);
          // L'API retourne { client: ..., historique_ventes: ... }
          const client = response.data.client || response.data;
          setClientSelectionne(client);
          setSearchClient(client.nom || '');
          
          // Si payer_credit est true et que le client a un solde, ouvrir le formulaire de paiement
          if (payerCredit) {
            const solde = parseFloat(client.solde || 0);
            if (solde > 0) {
              // Utiliser setTimeout pour s'assurer que le state est bien mis à jour
              setTimeout(() => {
                setShowPaiementCredit(true);
              }, 100);
            } else {
              toast.error('Ce client n\'a pas de crédit à payer');
            }
          }
          
          // Nettoyer les paramètres d'URL après chargement
          setSearchParams({});
        } catch (error) {
          console.error('Erreur chargement client:', error);
          toast.error('Erreur lors du chargement du client');
        }
      };
      loadClient();
    }
  }, [searchParams]);

  const fetchProduits = async () => {
    setLoadingProduits(true);
    try {
      const response = await axios.get('/admin/produits', {
        params: { 
          search: search.length >= 2 ? search : '', 
          page: 1, 
          limit: search.length >= 2 ? 10 : 20 
        },
      });
      setProduits(response.data.produits || []);
    } catch (error: any) {
      console.error('Erreur recherche produits:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la recherche de produits');
      setProduits([]);
    } finally {
      setLoadingProduits(false);
    }
  };

  const fetchClients = async (searchTerm: string) => {
    try {
      if (searchTerm.length < 1) {
        setClients([]);
        setShowClientList(false);
        return;
      }
      const response = await axios.get('/admin/clients', {
        params: { search: searchTerm, page: 1, limit: 10 },
      });
      const clientsTrouves = response.data.clients || [];
      setClients(clientsTrouves);
      setShowClientList(clientsTrouves.length > 0);
    } catch (error) {
      console.error('Erreur recherche clients:', error);
      setClients([]);
      setShowClientList(false);
    }
  };

  const handleClientSearch = (value: string) => {
    setSearchClient(value);
    if (clientSearchTimeoutRef.current) {
      clearTimeout(clientSearchTimeoutRef.current);
    }
    clientSearchTimeoutRef.current = setTimeout(() => {
      fetchClients(value);
    }, 300);
  };

  const selectClient = (client: Client) => {
    setClientSelectionne(client);
    setSearchClient(client.nom);
    setShowClientList(false);
    setClients([]);
  };

  const ajouterAuPanier = (produit: Produit) => {
    if (produit.stock_actuel <= 0 && typeDocument !== 'devis') {
      toast.error('Stock insuffisant');
      return;
    }

    const ligneExistante = panier.find((l) => l.produit_id === produit.id);
    const prixUnitaire = Number(produit.prix_vente);
    if (ligneExistante) {
      setPanier(
        panier.map((l) =>
          l.produit_id === produit.id
            ? {
                ...l,
                quantite: l.quantite + 1,
                montant_total: (l.quantite + 1) * Number(l.prix_unitaire) * (1 + Number(l.tva) / 100),
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
          tva: 0, // TVA par défaut à 0%
          montant_total: prixUnitaire,
        },
      ]);
    }
    // Ne pas vider la recherche ni les produits pour permettre d'ajouter d'autres produits
    // Remettre juste le focus sur le champ de recherche
    searchInputRef.current?.focus();
  };

  const modifierQuantite = (produitId: number, delta: number) => {
    setPanier(
      panier
        .map((l) => {
          if (l.produit_id === produitId) {
            const nouvelleQuantite = Math.max(0, l.quantite + delta);
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

  const modifierQuantiteDirecte = (produitId: number, quantite: number) => {
    if (quantite <= 0) {
      supprimerLigne(produitId);
      return;
    }
    setPanier(
      panier.map((l) => {
        if (l.produit_id === produitId) {
          return {
            ...l,
            quantite: quantite,
            montant_total: quantite * l.prix_unitaire * (1 + l.tva / 100),
          };
        }
        return l;
      })
    );
    setEditingLigne(null);
  };

  const modifierPrix = (produitId: number, prix: number) => {
    if (prix <= 0) return;
    setPanier(
      panier.map((l) => {
        if (l.produit_id === produitId) {
          return {
            ...l,
            prix_unitaire: prix,
            montant_total: l.quantite * prix * (1 + l.tva / 100),
          };
        }
        return l;
      })
    );
    setEditingLigne(null);
  };

  const modifierTVA = (produitId: number, tva: number) => {
    if (tva < 0 || tva > 100) return;
    setPanier(
      panier.map((l) => {
        if (l.produit_id === produitId) {
          return {
            ...l,
            tva: tva,
            montant_total: l.quantite * l.prix_unitaire * (1 + tva / 100),
          };
        }
        return l;
      })
    );
    setEditingLigne(null);
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

  const finaliserVente = async () => {
    if (panier.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    // Validation pour crédit
    if (modePaiement === 'credit') {
      if (!clientSelectionne) {
        toast.error('Un client doit être sélectionné pour le paiement à crédit');
        return;
      }
      const { totalTTC } = calculerTotal();
      const resteAPayer = totalTTC - montantPaye;
      const nouveauSolde = (clientSelectionne.solde || 0) + resteAPayer;
      const creditAutorise = clientSelectionne.credit_autorise || 0;
      
      if (creditAutorise > 0 && nouveauSolde > creditAutorise) {
        toast.error(`Le crédit autorisé (${creditAutorise.toFixed(2)} MAD) sera dépassé. Crédit disponible: ${(creditAutorise - (clientSelectionne.solde || 0)).toFixed(2)} MAD.`);
        return;
      }
    }

    // Validation pour chèque
    if (modePaiement === 'cheque') {
      if (!clientSelectionne) {
        toast.error('Un client doit être sélectionné pour le paiement par chèque');
        return;
      }
      if (!referencePaiement.trim()) {
        toast.error('Le numéro de chèque est requis');
        return;
      }
      if (!dateCheque) {
        toast.error('La date du chèque est requise');
        return;
      }
    }

    // Validation pour espèces
    if (modePaiement === 'especes' && monnaieRecue < calculerTotal().totalTTC) {
      toast.error('Le montant reçu doit être supérieur ou égal au total');
      return;
    }

    setLoading(true);
    try {
      const { totalHT, totalTVA, totalTTC } = calculerTotal();
      await axios.post('/admin/ventes', {
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
        montant_ht: totalHT,
        montant_tva: totalTVA,
        montant_ttc: totalTTC,
      });

      toast.success('Vente enregistrée avec succès');
      setPanier([]);
      setClientSelectionne(null);
      setSearchClient('');
      setRemise(0);
      setMonnaieRecue(0);
      setReferencePaiement('');
      setDateCheque('');
      setMontantPaye(0);
      searchInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la vente');
    } finally {
      setLoading(false);
    }
  };

  const enregistrerDepense = async () => {
    if (!categorieDepense.trim()) {
      toast.error('La catégorie de dépense est requise');
      return;
    }
    if (montantDepense <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    if (!descriptionDepense.trim()) {
      toast.error('La description est requise');
      return;
    }

    if (modePaiementDepense === 'cheque') {
      if (!referencePaiementDepense.trim()) {
        toast.error('Le numéro de chèque est requis');
        return;
      }
      if (!dateChequeDepense) {
        toast.error('La date du chèque est requise');
        return;
      }
    }

    setLoading(true);
    try {
      await axios.post('/admin/ventes', {
        type_document: 'depense',
        client_id: null,
        lignes: [{
          produit_id: null,
          designation: `${categorieDepense} - ${descriptionDepense}`,
          quantite: 1,
          prix_unitaire: montantDepense,
          tva: 0,
          remise_ligne: 0,
        }],
        remise: 0,
        mode_paiement: modePaiementDepense,
        reference_paiement: referencePaiementDepense || null,
        date_cheque: modePaiementDepense === 'cheque' ? dateChequeDepense : null,
        montant_paye: null,
        notes: `Dépense: ${categorieDepense} - ${descriptionDepense}`,
        montant_ht: montantDepense,
        montant_tva: 0,
        montant_ttc: montantDepense,
      });

      toast.success('Dépense enregistrée avec succès');
      setShowDepense(false);
      setCategorieDepense('');
      setMontantDepense(0);
      setDescriptionDepense('');
      setModePaiementDepense('especes');
      setReferencePaiementDepense('');
      setDateChequeDepense('');
      searchInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement de la dépense');
    } finally {
      setLoading(false);
    }
  };

  const payerCredit = async () => {
    if (!clientSelectionne || !clientSelectionne.solde || clientSelectionne.solde <= 0) {
      toast.error('Aucun crédit à payer');
      return;
    }

    if (modePaiement === 'cheque') {
      if (!referencePaiement.trim()) {
        toast.error('Le numéro de chèque est requis');
        return;
      }
      if (!dateCheque) {
        toast.error('La date du chèque est requise');
        return;
      }
    }

    if (modePaiement === 'especes' && monnaieRecue < (clientSelectionne.solde || 0)) {
      toast.error('Le montant reçu doit être supérieur ou égal au solde');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/admin/clients/${clientSelectionne.id}/paiement-credit`, {
        montant: clientSelectionne.solde,
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement || null,
        date_cheque: dateCheque || null,
        monnaie_recue: modePaiement === 'especes' ? monnaieRecue : null,
      });

      toast.success('Paiement enregistré avec succès');
      // Recharger les données du client
      const response = await axios.get(`/admin/clients/${clientSelectionne.id}`);
      setClientSelectionne(response.data);
      setShowPaiementCredit(false);
      setMonnaieRecue(0);
      setReferencePaiement('');
      setDateCheque('');
      setModePaiement('especes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const { totalHT, totalTVA, totalTTC } = calculerTotal();
  const monnaieARendre = monnaieRecue - totalTTC;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Panneau gauche - Recherche et produits */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Point de Vente</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un produit (nom, code-barres, référence)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {produits.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {produits.map((produit) => (
                  <button
                    key={produit.id}
                    onClick={() => ajouterAuPanier(produit)}
                    disabled={produit.stock_actuel <= 0 && typeDocument !== 'devis'}
                    className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left border-2 ${
                      produit.stock_actuel <= 0 && typeDocument !== 'devis'
                        ? 'border-red-300 opacity-50 cursor-not-allowed'
                        : 'border-transparent hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {produit.image_url ? (
                        <img
                          src={produit.image_url}
                          alt={produit.nom}
                          className="h-16 w-16 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{produit.nom}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {Number(produit.prix_vente).toFixed(2)} MAD
                        </p>
                        <p className={`text-xs mt-1 ${
                          produit.stock_actuel <= 0
                            ? 'text-red-500'
                            : produit.stock_actuel <= produit.stock_min
                            ? 'text-yellow-500'
                            : 'text-gray-400'
                        }`}>
                          Stock: {produit.stock_actuel} {produit.unite}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <div className="text-center text-gray-500 mt-8">
                Aucun produit trouvé
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                {loadingProduits ? 'Recherche...' : 'Tapez pour rechercher un produit'}
              </div>
            )}
          </div>
        </div>

        {/* Panneau droit - Panier */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ShoppingCart className="h-6 w-6 mr-2" />
                Panier
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDepense(true)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Dépense
                </button>
                <select
                  value={typeDocument}
                  onChange={(e) => setTypeDocument(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="ticket">Ticket</option>
                  <option value="facture">Facture</option>
                  <option value="devis">Devis</option>
                  <option value="bl">Bon de livraison</option>
                </select>
              </div>
            </div>

            {/* Sélection client */}
            <div className="mb-4 relative">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={searchClient || ''}
                  onChange={(e) => handleClientSearch(e.target.value)}
                  onFocus={() => {
                    if (searchClient && searchClient.length >= 1) {
                      fetchClients(searchClient);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              {showClientList && clients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{client.nom}</p>
                        {client.telephone && (
                          <p className="text-xs text-gray-500">{client.telephone}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showClientList && clients.length === 0 && searchClient.length >= 1 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  Aucun client trouvé
                </div>
              )}
              {clientSelectionne && (
                <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{clientSelectionne.nom}</p>
                      <p className="text-xs text-gray-600">
                        Crédit autorisé: {Number(clientSelectionne.credit_autorise || 0).toFixed(2)} MAD
                      </p>
                      <p className={`text-xs font-medium ${
                        (clientSelectionne.solde || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        Solde actuel: {Number(clientSelectionne.solde || 0).toFixed(2)} MAD
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setClientSelectionne(null);
                        setSearchClient('');
                      }}
                      className="text-danger hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {clientSelectionne.solde && clientSelectionne.solde > 0 && (
                    <button
                      onClick={() => setShowPaiementCredit(true)}
                      className="w-full mt-2 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payer le crédit ({Number(clientSelectionne.solde).toFixed(2)} MAD)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Liste du panier */}
          <div className="flex-1 overflow-y-auto p-4">
            {panier.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Le panier est vide</p>
              </div>
            ) : (
              <div className="space-y-3">
                {panier.map((ligne) => (
                  <div
                    key={ligne.produit_id}
                    className="bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-start space-x-3 mb-2">
                      {ligne.image_url ? (
                        <img
                          src={ligne.image_url}
                          alt={ligne.nom}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{ligne.nom}</p>
                          <button
                            onClick={() => supprimerLigne(ligne.produit_id)}
                            className="text-danger hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-gray-600">Prix unitaire</label>
                        {editingLigne?.id === ligne.produit_id && editingLigne.field === 'prix' ? (
                          <input
                            type="number"
                            defaultValue={ligne.prix_unitaire}
                            onBlur={(e) => modifierPrix(ligne.produit_id, parseFloat(e.target.value) || ligne.prix_unitaire)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                modifierPrix(ligne.produit_id, parseFloat((e.target as HTMLInputElement).value) || ligne.prix_unitaire);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="flex items-center cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
                            onClick={() => setEditingLigne({ id: ligne.produit_id, field: 'prix' })}
                          >
                            <span>{Number(ligne.prix_unitaire).toFixed(2)} MAD</span>
                            <Edit2 className="h-3 w-3 ml-1 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Quantité</label>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => modifierQuantite(ligne.produit_id, -1)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          {editingLigne?.id === ligne.produit_id && editingLigne.field === 'quantite' ? (
                            <input
                              type="number"
                              defaultValue={ligne.quantite}
                              onBlur={(e) => modifierQuantiteDirecte(ligne.produit_id, parseInt(e.target.value) || 1)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  modifierQuantiteDirecte(ligne.produit_id, parseInt((e.target as HTMLInputElement).value) || 1);
                                }
                              }}
                              className="w-12 px-1 py-1 border border-gray-300 rounded text-sm text-center"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="font-medium w-8 text-center cursor-pointer hover:bg-gray-200 px-1 rounded"
                              onClick={() => setEditingLigne({ id: ligne.produit_id, field: 'quantite' })}
                            >
                              {ligne.quantite}
                            </span>
                          )}
                          <button
                            onClick={() => modifierQuantite(ligne.produit_id, 1)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">TVA (%)</label>
                        {editingLigne?.id === ligne.produit_id && editingLigne.field === 'tva' ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={ligne.tva}
                            onBlur={(e) => modifierTVA(ligne.produit_id, parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                modifierTVA(ligne.produit_id, parseFloat((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="flex items-center cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
                            onClick={() => setEditingLigne({ id: ligne.produit_id, field: 'tva' })}
                          >
                            <span>{ligne.tva}%</span>
                            <Edit2 className="h-3 w-3 ml-1 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="font-bold text-gray-900">
                        {Number(ligne.montant_total).toFixed(2)} MAD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totaux et paiement */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {showPaiementCredit && clientSelectionne ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Paiement du crédit</h3>
                  <button
                    onClick={() => {
                      setShowPaiementCredit(false);
                      setModePaiement('especes');
                      setMonnaieRecue(0);
                      setReferencePaiement('');
                      setDateCheque('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Montant à payer: <span className="font-bold">{Number(clientSelectionne.solde).toFixed(2)} MAD</span>
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Mode de paiement:</label>
                    <select
                      value={modePaiement}
                      onChange={(e) => {
                        setModePaiement(e.target.value);
                        setMonnaieRecue(0);
                        setReferencePaiement('');
                        setDateCheque('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="especes">Espèces</option>
                      <option value="carte">Carte bancaire</option>
                      <option value="cheque">Chèque</option>
                      <option value="virement">Virement</option>
                    </select>
                  </div>
                  {modePaiement === 'especes' && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-2">Monnaie reçue:</label>
                      <input
                        type="number"
                        value={monnaieRecue}
                        onChange={(e) => setMonnaieRecue(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      {monnaieRecue > 0 && (
                        <p className="mt-2 text-sm font-medium">
                          Monnaie à rendre: {Math.max(0, monnaieRecue - (clientSelectionne.solde || 0)).toFixed(2)} MAD
                        </p>
                      )}
                    </div>
                  )}
                  {(modePaiement === 'carte' || modePaiement === 'virement') && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-2">Référence (optionnel):</label>
                      <input
                        type="text"
                        value={referencePaiement}
                        onChange={(e) => setReferencePaiement(e.target.value)}
                        placeholder="N° transaction / virement"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                  {modePaiement === 'cheque' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-2">Numéro de chèque *:</label>
                        <input
                          type="text"
                          value={referencePaiement}
                          onChange={(e) => setReferencePaiement(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-2">Date du chèque *:</label>
                        <input
                          type="date"
                          value={dateCheque}
                          onChange={(e) => setDateCheque(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </>
                  )}
                  <button
                    onClick={payerCredit}
                    disabled={loading}
                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remise:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={remise}
                        onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT:</span>
                    <span className="font-medium">{totalHT.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA:</span>
                    <span className="font-medium">{totalTVA.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span className="text-primary">{totalTTC.toFixed(2)} MAD</span>
                  </div>

                  {modePaiement === 'especes' && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-600 mb-2">Monnaie reçue:</label>
                      <input
                        type="number"
                        value={monnaieRecue}
                        onChange={(e) => setMonnaieRecue(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      {monnaieRecue > 0 && (
                        <p className="mt-2 text-sm font-medium">
                          Monnaie à rendre: {monnaieARendre >= 0 ? monnaieARendre.toFixed(2) : '0.00'} MAD
                        </p>
                      )}
                    </div>
                  )}

                  {(modePaiement === 'carte' || modePaiement === 'virement') && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-600 mb-2">Référence (optionnel):</label>
                      <input
                        type="text"
                        value={referencePaiement}
                        onChange={(e) => setReferencePaiement(e.target.value)}
                        placeholder="N° transaction / virement"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}

                  {modePaiement === 'cheque' && (
                    <>
                      <div className="mt-4">
                        <label className="block text-sm text-gray-600 mb-2">Numéro de chèque *:</label>
                        <input
                          type="text"
                          value={referencePaiement}
                          onChange={(e) => setReferencePaiement(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm text-gray-600 mb-2">Date du chèque *:</label>
                        <input
                          type="date"
                          value={dateCheque}
                          onChange={(e) => setDateCheque(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </>
                  )}

                  {modePaiement === 'credit' && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-600 mb-2">Montant payé (optionnel):</label>
                      <input
                        type="number"
                        value={montantPaye}
                        onChange={(e) => setMontantPaye(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        max={totalTTC}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Reste à payer: {(totalTTC - montantPaye).toFixed(2)} MAD
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-2">Mode de paiement:</label>
                    <select
                      value={modePaiement}
                      onChange={(e) => {
                        setModePaiement(e.target.value);
                        setMonnaieRecue(0);
                        setReferencePaiement('');
                        setDateCheque('');
                        setMontantPaye(0);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="especes">Espèces</option>
                      <option value="carte">Carte bancaire</option>
                      <option value="cheque">Chèque</option>
                      <option value="virement">Virement</option>
                      <option value="credit">Crédit</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={finaliserVente}
                  disabled={loading || panier.length === 0}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enregistrement...' : `Finaliser la vente (${totalTTC.toFixed(2)} MAD)`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Dépense */}
      {showDepense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-red-600" />
                  Enregistrer une dépense
                </h2>
                <button
                  onClick={() => {
                    setShowDepense(false);
                    setCategorieDepense('');
                    setMontantDepense(0);
                    setDescriptionDepense('');
                    setModePaiementDepense('especes');
                    setReferencePaiementDepense('');
                    setDateChequeDepense('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie de dépense *
                  </label>
                  <select
                    value={categorieDepense}
                    onChange={(e) => setCategorieDepense(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="Loyer">Loyer</option>
                    <option value="Électricité">Électricité</option>
                    <option value="Eau">Eau</option>
                    <option value="Téléphone/Internet">Téléphone/Internet</option>
                    <option value="Transport">Transport</option>
                    <option value="Fournitures">Fournitures</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Publicité">Publicité</option>
                    <option value="Salaire">Salaire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (MAD) *
                  </label>
                  <input
                    type="number"
                    value={montantDepense || ''}
                    onChange={(e) => setMontantDepense(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description / Motif *
                  </label>
                  <textarea
                    value={descriptionDepense}
                    onChange={(e) => setDescriptionDepense(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Décrivez la dépense..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de paiement *
                  </label>
                  <select
                    value={modePaiementDepense}
                    onChange={(e) => {
                      setModePaiementDepense(e.target.value);
                      setReferencePaiementDepense('');
                      setDateChequeDepense('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                  </select>
                </div>

                {modePaiementDepense === 'carte' || modePaiementDepense === 'virement' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Référence (optionnel)
                    </label>
                    <input
                      type="text"
                      value={referencePaiementDepense}
                      onChange={(e) => setReferencePaiementDepense(e.target.value)}
                      placeholder="N° transaction / virement"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                ) : null}

                {modePaiementDepense === 'cheque' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de chèque *
                      </label>
                      <input
                        type="text"
                        value={referencePaiementDepense}
                        onChange={(e) => setReferencePaiementDepense(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date du chèque *
                      </label>
                      <input
                        type="date"
                        value={dateChequeDepense}
                        onChange={(e) => setDateChequeDepense(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDepense(false);
                      setCategorieDepense('');
                      setMontantDepense(0);
                      setDescriptionDepense('');
                      setModePaiementDepense('especes');
                      setReferencePaiementDepense('');
                      setDateChequeDepense('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={enregistrerDepense}
                    disabled={loading || !categorieDepense || montantDepense <= 0 || !descriptionDepense}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enregistrement...' : `Enregistrer (${montantDepense.toFixed(2)} MAD)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
