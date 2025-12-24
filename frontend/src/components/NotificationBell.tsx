import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, Package, Users, CreditCard, Calendar } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'rupture' | 'seuil_minimum' | 'credit_eleve' | 'cheque_pret' | 'peremption' | 'credits_attente' | 'cheques_attente';
  title: string;
  message: string;
  count?: number;
  montant?: number;
  link?: string;
  severity: 'high' | 'medium' | 'low';
  details?: any[];
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir les notifications toutes les 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPanel]);

  const fetchNotifications = async () => {
    try {
      // Utiliser le bon endpoint selon le rôle (admin ou user)
      // Pour les users, utiliser /admin/dashboard car ils n'ont pas leur propre endpoint dashboard
      const endpoint = '/admin/dashboard';
      const response = await axios.get(endpoint);
      const stats = response.data;
      const newNotifications: Notification[] = [];

      // Rupture de stock
      if (stats.alertes?.rupture > 0) {
        const produits = stats.alertes.details?.rupture || [];
        const nomsProduits = produits.map((p: any) => p.nom).join(', ');
        const message = produits.length === 1
          ? `Le produit "${nomsProduits}" est en rupture de stock. Action requise : réapprovisionner rapidement.`
          : produits.length <= 3
          ? `Les produits ${nomsProduits} sont en rupture de stock. Action requise : réapprovisionner rapidement.`
          : `Les produits ${nomsProduits} et ${stats.alertes.rupture - produits.length} autre(s) sont en rupture de stock. Action requise : réapprovisionner rapidement.`;
        
        newNotifications.push({
          id: 'rupture',
          type: 'rupture',
          title: '⚠️ Rupture de stock',
          message,
          count: stats.alertes.rupture,
          link: window.location.pathname.startsWith('/admin') ? '/admin/produits?stock_bas=true' : '/produits?stock_bas=true',
          severity: 'high',
          details: produits,
        });
      }

      // Seuil minimum
      if (stats.alertes?.seuil_minimum > 0) {
        const produits = stats.alertes.details?.seuil_minimum || [];
        const nomsProduits = produits.map((p: any) => p.nom).join(', ');
        const message = produits.length === 1
          ? `Le produit "${nomsProduits}" est sous le seuil minimum (stock: ${produits[0].stock_actuel}, seuil: ${produits[0].stock_min}). Vérifiez les stocks et planifiez les réapprovisionnements.`
          : produits.length <= 3
          ? `Les produits ${nomsProduits} sont sous le seuil minimum. Vérifiez les stocks et planifiez les réapprovisionnements.`
          : `Les produits ${nomsProduits} et ${stats.alertes.seuil_minimum - produits.length} autre(s) sont sous le seuil minimum. Vérifiez les stocks et planifiez les réapprovisionnements.`;
        
        newNotifications.push({
          id: 'seuil_minimum',
          type: 'seuil_minimum',
          title: '📦 Stock faible',
          message,
          count: stats.alertes.seuil_minimum,
          link: window.location.pathname.startsWith('/admin') ? '/admin/produits?stock_bas=true' : '/produits?stock_bas=true',
          severity: 'medium',
          details: produits,
        });
      }

      // Péremption
      if (stats.alertes?.peremption > 0) {
        const produits = stats.alertes.details?.peremption || [];
        const nomsProduits = produits.map((p: any) => p.nom).join(', ');
        const message = produits.length === 1
          ? `Le produit "${nomsProduits}" périme le ${new Date(produits[0].date_peremption).toLocaleDateString('fr-FR')}. Vérifiez les dates de péremption.`
          : produits.length <= 3
          ? `Les produits ${nomsProduits} périment dans les 30 prochains jours. Vérifiez les dates de péremption.`
          : `Les produits ${nomsProduits} et ${stats.alertes.peremption - produits.length} autre(s) périment dans les 30 prochains jours. Vérifiez les dates de péremption.`;
        
        newNotifications.push({
          id: 'peremption',
          type: 'peremption',
          title: '⏰ Péremption proche',
          message,
          count: stats.alertes.peremption,
          link: window.location.pathname.startsWith('/admin') ? '/admin/produits' : '/produits',
          severity: 'medium',
          details: produits,
        });
      }

      // Crédits élevés
      if (stats.credits?.clients_credit_eleve > 0) {
        const clients = stats.credits.clients_credit_eleve_details || [];
        const nomsClients = clients.map((c: any) => c.nom).join(', ');
        const message = clients.length === 1
          ? `Le client "${nomsClients}" a atteint ${Number(clients[0].pourcentage_utilise).toFixed(0)}% de son crédit autorisé (${Number(clients[0].solde).toFixed(2)} MAD / ${Number(clients[0].credit_autorise).toFixed(2)} MAD). Surveillez ce compte.`
          : clients.length <= 3
          ? `Les clients ${nomsClients} ont atteint plus de 80% de leur crédit autorisé. Surveillez ces comptes.`
          : `Les clients ${nomsClients} et ${stats.credits.clients_credit_eleve - clients.length} autre(s) ont atteint plus de 80% de leur crédit autorisé. Surveillez ces comptes.`;
        
        newNotifications.push({
          id: 'credit_eleve',
          type: 'credit_eleve',
          title: '💰 Crédits élevés',
          message,
          count: stats.credits.clients_credit_eleve,
          link: window.location.pathname.startsWith('/admin') ? '/admin/clients' : '/clients',
          severity: 'medium',
          details: clients,
        });
      }

      // Chèques prêts pour dépôt
      if (stats.cheques?.pret_depot?.nb > 0) {
        const cheques = stats.cheques.pret_depot.details || [];
        const detailsCheques = cheques.map((c: any) => 
          `Chèque ${c.reference_paiement || 'N/A'} - ${c.client_nom || 'Sans client'} (${Number(c.montant_ttc).toFixed(2)} MAD)`
        ).join(', ');
        const message = cheques.length === 1
          ? `${detailsCheques} peut être déposé à la banque aujourd'hui.`
          : cheques.length <= 3
          ? `${detailsCheques} peuvent être déposés à la banque aujourd'hui pour un montant total de ${Number(stats.cheques.pret_depot.montant).toFixed(2)} MAD.`
          : `${detailsCheques} et ${stats.cheques.pret_depot.nb - cheques.length} autre(s) chèque(s) peuvent être déposés à la banque aujourd'hui pour un montant total de ${Number(stats.cheques.pret_depot.montant).toFixed(2)} MAD.`;
        
        newNotifications.push({
          id: 'cheque_pret',
          type: 'cheque_pret',
          title: '📅 Chèques prêts pour dépôt',
          message,
          count: stats.cheques.pret_depot.nb,
          montant: stats.cheques.pret_depot.montant,
          link: window.location.pathname.startsWith('/admin') ? '/admin/documents?tab=cheques' : '/documents?tab=cheques',
          severity: 'low',
          details: cheques,
        });
      }

      // Crédits en attente
      if (stats.credits?.nb_clients > 0) {
        const clients = stats.credits.details || [];
        const nomsClients = clients.map((c: any) => `${c.nom} (${Number(c.solde).toFixed(2)} MAD)`).join(', ');
        const message = clients.length === 1
          ? `Le client "${clients[0].nom}" a un crédit de ${Number(clients[0].solde).toFixed(2)} MAD en attente de paiement.`
          : clients.length <= 3
          ? `Les clients ${nomsClients} ont un total de ${Number(stats.credits.total).toFixed(2)} MAD de crédits en attente de paiement.`
          : `Les clients ${clients.slice(0, 3).map((c: any) => c.nom).join(', ')} et ${clients.length - 3} autre(s) ont un total de ${Number(stats.credits.total).toFixed(2)} MAD de crédits en attente de paiement.`;
        
        newNotifications.push({
          id: 'credits_attente',
          type: 'credits_attente',
          title: '💳 Crédits en attente',
          message,
          count: stats.credits.nb_clients,
          montant: stats.credits.total,
          link: window.location.pathname.startsWith('/admin') ? '/admin/clients' : '/clients',
          severity: 'medium',
          details: clients,
        });
      }

      // Chèques en attente
      if (stats.cheques?.en_attente?.nb > 0) {
        const cheques = stats.cheques.en_attente.details || [];
        const detailsCheques = cheques.map((c: any) => 
          `Chèque ${c.reference_paiement || 'N/A'} - ${c.client_nom || 'Sans client'} (${Number(c.montant_ttc).toFixed(2)} MAD)`
        ).join(', ');
        const message = cheques.length === 1
          ? `${detailsCheques} est en attente de traitement.`
          : cheques.length <= 3
          ? `${detailsCheques} sont en attente de traitement pour un montant total de ${Number(stats.cheques.en_attente.montant).toFixed(2)} MAD.`
          : `${detailsCheques} et ${stats.cheques.en_attente.nb - cheques.length} autre(s) chèque(s) sont en attente de traitement pour un montant total de ${Number(stats.cheques.en_attente.montant).toFixed(2)} MAD.`;
        
        newNotifications.push({
          id: 'cheques_attente',
          type: 'cheques_attente',
          title: '📋 Chèques en attente',
          message,
          count: stats.cheques.en_attente.nb,
          montant: stats.cheques.en_attente.montant,
          link: window.location.pathname.startsWith('/admin') ? '/admin/documents?tab=cheques' : '/documents?tab=cheques',
          severity: 'low',
          details: cheques,
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rupture':
      case 'seuil_minimum':
      case 'peremption':
        return <Package className="h-5 w-5" />;
      case 'credit_eleve':
      case 'credits_attente':
        return <Users className="h-5 w-5" />;
      case 'cheque_pret':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleNotificationClick = (link?: string) => {
    if (link) {
      navigate(link);
      setShowPanel(false);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute left-full top-0 ml-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] max-h-[600px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.link)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${getNotificationColor(notification.severity)} cursor-pointer`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 mt-0.5 ${notification.severity === 'high' ? 'text-red-600' : notification.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <p className="font-semibold text-sm leading-tight">{notification.title}</p>
                          <p className="text-sm mt-1.5 text-gray-700 leading-relaxed break-words">{notification.message}</p>
                          {notification.montant && (
                            <p className="text-xs mt-1.5 font-medium text-gray-600">
                              Montant: {Number(notification.montant).toFixed(2)} MAD
                            </p>
                          )}
                          {notification.count && notification.count > 1 && (
                            <p className="text-xs mt-1 text-gray-500">
                              {notification.count} élément(s) concerné(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  const dashboardPath = window.location.pathname.startsWith('/admin') ? '/admin/dashboard' : '/dashboard';
                  navigate(dashboardPath);
                  setShowPanel(false);
                }}
                className="w-full text-sm text-primary hover:text-blue-700 font-medium"
              >
                Voir le dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

