import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Produit, Client } from '../../types';

interface LignePanier {
  produit_id: number;
  nom: string;
  prix_unitaire: number;
  quantite: number;
  tva: number;
  montant_total: number;
}

const POS = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null);
  const [typeDocument, setTypeDocument] = useState<'ticket' | 'facture' | 'devis' | 'bl'>('ticket');
  const [modePaiement, setModePaiement] = useState<string>('especes');
  const [remise, setRemise] = useState(0);
  const [monnaieRecue, setMonnaieRecue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search.length >= 2) {
      fetchProduits();
    } else if (search.length === 0) {
      // Afficher quelques produits récents ou populaires quand la recherche est vide
      fetchProduits();
    } else {
      setProduits([]);
    }
  }, [search]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

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
      console.error('Détails erreur:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur lors de la recherche de produits');
      setProduits([]);
    } finally {
      setLoadingProduits(false);
    }
  };

  const fetchClients = async (searchTerm: string) => {
    try {
      const response = await axios.get('/admin/clients', {
        params: { search: searchTerm, page: 1, limit: 10 },
      });
      return response.data.clients;
    } catch (error) {
      return [];
    }
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
          prix_unitaire: prixUnitaire,
          quantite: 1,
          tva: 20, // TVA par défaut
          montant_total: prixUnitaire * 1.2,
        },
      ]);
    }
    setSearch('');
    setProduits([]);
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
        montant_ht: totalHT,
        montant_tva: totalTVA,
        montant_ttc: totalTTC,
      });

      toast.success('Vente enregistrée avec succès');
      setPanier([]);
      setClientSelectionne(null);
      setRemise(0);
      setMonnaieRecue(0);
      searchInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la vente');
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
                    <p className="font-medium text-gray-900">{produit.nom}</p>
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

            {/* Sélection client */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client (optionnel)"
                  onChange={async (e) => {
                    if (e.target.value.length >= 2) {
                      const clientsTrouves = await fetchClients(e.target.value);
                      if (clientsTrouves.length > 0) {
                        setClientSelectionne(clientsTrouves[0]);
                      }
                    } else {
                      setClientSelectionne(null);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              {clientSelectionne && (
                <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{clientSelectionne.nom}</span>
                  <button
                    onClick={() => setClientSelectionne(null)}
                    className="text-danger hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
                    className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ligne.nom}</p>
                      <p className="text-sm text-gray-500">
                        {Number(ligne.prix_unitaire).toFixed(2)} MAD × {ligne.quantite}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
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
                      <span className="font-bold text-gray-900 w-20 text-right">
                        {Number(ligne.montant_total).toFixed(2)} MAD
                      </span>
                      <button
                        onClick={() => supprimerLigne(ligne.produit_id)}
                        className="p-1 text-danger hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totaux et paiement */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
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

              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-2">Mode de paiement:</label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
