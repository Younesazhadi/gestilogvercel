import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vente } from '../../types';
import { generateDocumentPDF } from '../../utils/generateDocumentPDF';

const VenteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vente, setVente] = useState<Vente | null>(null);
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVente();
      fetchEntrepriseInfo();
    }
  }, [id]);

  const fetchEntrepriseInfo = async () => {
    try {
      const response = await axios.get('/admin/entreprise');
      setEntreprise(response.data.entreprise);
    } catch (error) {
      console.error('Erreur chargement infos entreprise:', error);
    }
  };

  const fetchVente = async () => {
    try {
      const response = await axios.get(`/admin/ventes/${id}`);
      setVente(response.data.vente);
    } catch (error) {
      console.error('Erreur chargement vente:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnuler = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette opération ?')) return;

    try {
      await axios.put(`/admin/ventes/${id}/annuler`, { motif: 'Annulation manuelle' });
      toast.success('Opération annulée');
      fetchVente();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!vente) {
    return <div className="p-8">Opération introuvable</div>;
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/admin/ventes')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Retour aux opérations</span>
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{vente.numero_vente}</h1>
          <p className="text-gray-500 mt-1">
            {new Date(vente.date_vente).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              if (!entreprise) {
                toast.error('Impossible de charger les informations de l\'entreprise');
                return;
              }
              setGeneratingPDF(true);
              try {
                await generateDocumentPDF(vente as any, entreprise);
                toast.success('PDF généré avec succès');
              } catch (error: any) {
                console.error('Erreur génération PDF:', error);
                toast.error('Erreur lors de la génération du PDF');
              } finally {
                setGeneratingPDF(false);
              }
            }}
            disabled={generatingPDF}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Génération...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Exporter PDF</span>
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Printer className="h-5 w-5" />
            <span>Imprimer</span>
          </button>
          {vente.statut === 'valide' && (
            <button
              onClick={handleAnnuler}
              className="flex items-center space-x-2 bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <X className="h-5 w-5" />
              <span>Annuler</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Type de document</h3>
            <p className="text-lg font-medium">{vente.type_document}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Statut</h3>
            <span
              className={`inline-block px-3 py-1 text-sm rounded-full ${
                vente.statut === 'valide'
                  ? 'bg-green-100 text-green-800'
                  : vente.statut === 'annule'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {vente.statut}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Mode de paiement</h3>
            <p className="text-lg font-medium">{vente.mode_paiement || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
            <p className="text-lg font-medium">{(vente as any).client_nom || 'Non renseigné'}</p>
          </div>
        </div>

        {/* Détails du mode de paiement */}
        {vente.mode_paiement && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Détails du paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vente.mode_paiement === 'cheque' && (
                <>
                  {(vente as any).reference_paiement && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Numéro de chèque</h4>
                      <p className="text-base font-medium text-gray-900">{(vente as any).reference_paiement}</p>
                    </div>
                  )}
                  {(vente as any).date_cheque && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Date du chèque</h4>
                      <p className="text-base font-medium text-gray-900">
                        {new Date((vente as any).date_cheque).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {(vente as any).statut_cheque && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Statut du chèque</h4>
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${
                          (vente as any).statut_cheque === 'paye'
                            ? 'bg-green-100 text-green-800'
                            : (vente as any).statut_cheque === 'impaye'
                            ? 'bg-red-100 text-red-800'
                            : (vente as any).statut_cheque === 'depose'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {(vente as any).statut_cheque === 'en_attente'
                          ? 'En attente'
                          : (vente as any).statut_cheque === 'depose'
                          ? 'Déposé'
                          : (vente as any).statut_cheque === 'paye'
                          ? 'Payé'
                          : (vente as any).statut_cheque === 'impaye'
                          ? 'Impayé'
                          : (vente as any).statut_cheque}
                      </span>
                    </div>
                  )}
                </>
              )}

              {vente.mode_paiement === 'carte' && (vente as any).reference_paiement && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Numéro de transaction</h4>
                  <p className="text-base font-medium text-gray-900">{(vente as any).reference_paiement}</p>
                </div>
              )}

              {vente.mode_paiement === 'virement' && (vente as any).reference_paiement && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Numéro de virement</h4>
                  <p className="text-base font-medium text-gray-900">{(vente as any).reference_paiement}</p>
                </div>
              )}

              {vente.mode_paiement === 'credit' && (
                <>
                  {(vente as any).montant_paye !== null && (vente as any).montant_paye !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Montant payé</h4>
                      <p className="text-base font-medium text-green-600">
                        {Number((vente as any).montant_paye).toFixed(2)} MAD
                      </p>
                    </div>
                  )}
                  {(vente as any).montant_paye !== null &&
                    (vente as any).montant_paye !== undefined &&
                    Number((vente as any).montant_paye) < Number(vente.montant_ttc) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Reste à payer</h4>
                        <p className="text-base font-medium text-red-600">
                          {(Number(vente.montant_ttc) - Number((vente as any).montant_paye || 0)).toFixed(2)} MAD
                        </p>
                      </div>
                    )}
                </>
              )}

              {vente.mode_paiement === 'especes' && (vente as any).reference_paiement && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Référence</h4>
                  <p className="text-base font-medium text-gray-900">{(vente as any).reference_paiement}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Lignes de vente</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vente.lignes?.map((ligne) => (
              <tr key={ligne.id}>
                <td className="px-6 py-4 whitespace-nowrap">{ligne.designation}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ligne.quantite}</td>
                <td className="px-6 py-4 whitespace-nowrap">{Number(ligne.prix_unitaire).toFixed(2)} MAD</td>
                <td className="px-6 py-4 whitespace-nowrap">{ligne.tva}%</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {Number(ligne.montant_total).toFixed(2)} MAD
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              {vente.remise > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Remise:</span>
                  <span className="font-medium">{vente.remise}%</span>
                </div>
              )}
              {vente.montant_ht && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-medium">{Number(vente.montant_ht).toFixed(2)} MAD</span>
                </div>
              )}
              {vente.montant_tva && (
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA:</span>
                  <span className="font-medium">{Number(vente.montant_tva).toFixed(2)} MAD</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total TTC:</span>
                <span className="text-primary">{Number(vente.montant_ttc).toFixed(2)} MAD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenteDetails;

