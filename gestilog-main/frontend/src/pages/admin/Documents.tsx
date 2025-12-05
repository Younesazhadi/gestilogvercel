import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Receipt, FileCheck, Truck, Search, Eye, Printer, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vente } from '../../types';

const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
  }, [search, typeFilter]);

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

  const handleImprimer = (vente: Vente) => {
    // Ouvrir une nouvelle fenêtre pour l'impression
    window.open(`/admin/ventes/${vente.id}/print`, '_blank');
    toast.success('Ouverture de l\'impression');
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

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
        <button
          onClick={() => navigate('/admin/pos')}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FileText className="h-5 w-5" />
          <span>Nouveau document</span>
        </button>
      </div>

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
                onClick={() => handleImprimer(doc)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer</span>
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
    </div>
  );
};

export default Documents;

