import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package, Users, CreditCard, Calendar, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setExporting(true);
    try {
      // Attendre un peu pour que les graphiques se chargent complètement
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Calculer le nombre de pages nécessaires
      const pageHeight = imgHeight * ratio;
      let heightLeft = pageHeight;
      let position = 0;

      // Première page
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;

      // Pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }

      // Générer le nom du fichier avec la date
      const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      pdf.save(`dashboard-${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Erreur lors de l\'exportation PDF:', error);
      alert('Erreur lors de l\'exportation du PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={exportToPDF}
          disabled={exporting || loading}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-5 w-5" />
          <span>{exporting ? 'Exportation...' : 'Exporter en PDF'}</span>
        </button>
      </div>

      <div ref={contentRef}>
        {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">CA NET du jour</p>
              <p className={`text-2xl font-bold ${(stats?.ca?.net?.jour || 0) >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {Number(stats?.ca?.net?.jour || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Brut: {Number(stats?.ca?.brut?.jour || 0).toFixed(2)} MAD
                {stats?.ca?.depenses?.jour > 0 && (
                  <span className="text-red-600 ml-2">
                    - Dépenses: {Number(stats?.ca?.depenses?.jour || 0).toFixed(2)} MAD
                  </span>
                )}
              </p>
              <div className="flex items-center mt-1">
                {stats?.ca?.net?.hier !== undefined && stats?.ca?.net?.hier !== null && stats?.ca?.net?.jour !== undefined && (
                  <>
                    {stats.ca.net.jour > stats.ca.net.hier ? (
                      <ArrowUp className="h-4 w-4 text-success mr-1" />
                    ) : stats.ca.net.jour < stats.ca.net.hier ? (
                      <ArrowDown className="h-4 w-4 text-danger mr-1" />
                    ) : null}
                    <p className={`text-xs ${stats.ca.net.jour > stats.ca.net.hier ? 'text-success' : stats.ca.net.jour < stats.ca.net.hier ? 'text-danger' : 'text-gray-500'}`}>
                      {stats.ca.net.hier !== 0 
                        ? `${((stats.ca.net.jour - stats.ca.net.hier) / Math.abs(stats.ca.net.hier) * 100).toFixed(1)}% vs hier`
                        : 'Nouveau'}
                    </p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.ca?.jour?.nb_ventes || 0} opérations
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">CA NET de la semaine</p>
              <p className={`text-2xl font-bold ${(stats?.ca?.net?.semaine || 0) >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {Number(stats?.ca?.net?.semaine || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Brut: {Number(stats?.ca?.brut?.semaine || 0).toFixed(2)} MAD
                {stats?.ca?.depenses?.semaine > 0 && (
                  <span className="text-red-600 ml-2">
                    - Dépenses: {Number(stats?.ca?.depenses?.semaine || 0).toFixed(2)} MAD
                  </span>
                )}
              </p>
              {stats?.ca?.net?.semaine_derniere !== undefined && stats?.ca?.net?.semaine_derniere !== null && stats?.ca?.net?.semaine !== undefined && (
                <p className={`text-xs mt-1 ${stats.ca.net.semaine > stats.ca.net.semaine_derniere ? 'text-success' : stats.ca.net.semaine < stats.ca.net.semaine_derniere ? 'text-danger' : 'text-gray-500'}`}>
                  {stats.ca.net.semaine > stats.ca.net.semaine_derniere ? '+' : ''}
                  {stats.ca.net.semaine_derniere !== 0 
                    ? `${((stats.ca.net.semaine - stats.ca.net.semaine_derniere) / Math.abs(stats.ca.net.semaine_derniere) * 100).toFixed(1)}% vs semaine dernière`
                    : 'Nouveau'}
                </p>
              )}
            </div>
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">CA NET du mois</p>
              <p className={`text-2xl font-bold ${(stats?.ca?.net?.mois || 0) >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {Number(stats?.ca?.net?.mois || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Brut: {Number(stats?.ca?.brut?.mois || 0).toFixed(2)} MAD
                {stats?.ca?.depenses?.mois > 0 && (
                  <span className="text-red-600 ml-2">
                    - Dépenses: {Number(stats?.ca?.depenses?.mois || 0).toFixed(2)} MAD
                  </span>
                )}
              </p>
            </div>
            <ShoppingCart className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Dépenses du jour</p>
              <p className="text-2xl font-bold text-red-600">
                {Number(stats?.ca?.depenses?.jour || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.ca?.depenses?.mois > 0 && (
                  <span>Mois: {Number(stats?.ca?.depenses?.mois || 0).toFixed(2)} MAD</span>
                )}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Cartes supplémentaires - Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Panier moyen (jour)</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.statistiques?.panier_moyen_jour || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Mois: {Number(stats?.statistiques?.panier_moyen_mois || 0).toFixed(2)} MAD
              </p>
            </div>
            <ShoppingCart className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Total clients</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats?.statistiques?.total_clients || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Clients actifs
              </p>
            </div>
            <Users className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Total produits</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats?.statistiques?.total_produits || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Produits actifs
              </p>
            </div>
            <Package className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Valeur du stock</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.statistiques?.valeur_stock || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Stock total
              </p>
            </div>
            <Package className="h-12 w-12 text-success" />
          </div>
        </div>
      </div>

      {/* Cartes supplémentaires - Crédits et Chèques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Crédits en attente</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.credits?.total || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.credits?.nb_clients || 0} client(s)
              </p>
            </div>
            <Users className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Chèques en attente</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.cheques?.en_attente?.montant || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.cheques?.en_attente?.nb || 0} chèque(s)
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Prêts pour dépôt</p>
              <p className="text-2xl font-bold text-gray-800">
                {Number(stats?.cheques?.pret_depot?.montant || 0).toFixed(2)} MAD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.cheques?.pret_depot?.nb || 0} chèque(s)
              </p>
            </div>
            <Calendar className="h-12 w-12 text-success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Top produits (jour)</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats?.top_produits_jour?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                produits vendus aujourd'hui
              </p>
            </div>
            <Package className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Ventes annulées (mois)</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.statistiques?.ventes_annulees_mois || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ce mois-ci
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Évolution CA NET (7 jours)</h2>
          {(() => {
            // Calculer le maximum et minimum du CA net dans les données
            const evolutionData = stats?.evolution || [];
            const caValues = evolutionData.map((d: any) => parseFloat(d.ca) || 0);
            const maxCA = caValues.length > 0 ? Math.max(...caValues) : 0;
            const minCA = caValues.length > 0 ? Math.min(...caValues) : 0;
            // Pour le YAxis, on prend le max entre maxCA et abs(minCA) pour gérer les valeurs négatives
            const maxAbs = Math.max(Math.abs(maxCA), Math.abs(minCA));
            const yAxisMax = maxAbs > 0 ? Math.ceil(maxAbs * 1.1) : 'auto';
            const yAxisMin = minCA < 0 ? -Math.ceil(Math.abs(minCA) * 1.1) : 0;
            
            return (
          <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={evolutionData} 
                  margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                >
              <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    domain={[yAxisMin, yAxisMax]}
                    allowDataOverflow={false}
                    tickFormatter={(value) => {
                      if (Math.abs(value) >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      }
                      return value.toString();
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any) => {
                      const val = Number(value);
                      const sign = val >= 0 ? '+' : '';
                      return `${sign}${val.toFixed(2)} MAD`;
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ca" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    isAnimationActive={false}
                    name="CA Net"
                  />
            </LineChart>
          </ResponsiveContainer>
            );
          })()}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 produits du mois</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats?.top_produits || []} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nom" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 10 }}
                interval={0}
                tickFormatter={(value) => {
                  // Tronquer les noms à 15 caractères
                  if (value.length > 15) {
                    return value.substring(0, 15) + '...';
                  }
                  return value;
                }}
              />
              <YAxis 
                domain={[
                  0, 
                  stats?.top_produits && stats.top_produits.length > 0 
                    ? Math.ceil(parseFloat(stats.top_produits[0].quantite_vendue || 0) * 1.1)
                    : 'auto'
                ]}
              />
              <Tooltip 
                formatter={(value: any) => `${value} unités`}
                labelFormatter={(label) => `Produit: ${label}`}
              />
              <Bar dataKey="quantite_vendue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphiques supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 clients du mois</h2>
          {stats?.top_clients && stats.top_clients.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_clients} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[
                      0,
                      stats.top_clients && stats.top_clients.length > 0
                        ? Math.ceil(parseFloat(stats.top_clients[0].montant_total || 0) * 1.1)
                        : 'auto'
                    ]}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      }
                      return value.toString();
                    }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="nom" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'montant_total') {
                        return [`${Number(value).toFixed(2)} MAD`, 'Montant total'];
                      }
                      return [value, 'Nombre d\'achats'];
                    }}
                    labelFormatter={(label) => `Client: ${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Bar dataKey="montant_total" fill="#3B82F6" name="Montant total">
                    <LabelList
                      dataKey={(entry: any) => {
                        const nbAchats = entry?.nb_achats || 0;
                        const montant = parseFloat(entry?.montant_total || 0);
                        return `${Math.round(montant)} MAD (${nbAchats} achat${nbAchats > 1 ? 's' : ''})`;
                      }}
                      position="right"
                      style={{ fontSize: 11, fill: '#374151', fontWeight: 'medium' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Aucun client avec des achats ce mois-ci</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 produits du jour</h2>
          {stats?.top_produits_jour && stats.top_produits_jour.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.top_produits_jour} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nom" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 10 }}
                  interval={0}
                  tickFormatter={(value) => {
                    // Tronquer les noms à 15 caractères
                    if (value.length > 15) {
                      return value.substring(0, 15) + '...';
                    }
                    return value;
                  }}
                />
                <YAxis 
                  domain={[
                    0, 
                    Math.ceil(parseFloat(stats.top_produits_jour[0].quantite_vendue || 0) * 1.1)
                  ]}
                />
                <Tooltip 
                  formatter={(value: any) => `${value} unités`}
                  labelFormatter={(label) => `Produit: ${label}`}
                />
                <Bar dataKey="quantite_vendue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Aucune vente aujourd'hui
            </div>
          )}
        </div>
      </div>

      {/* Alertes et Notifications */}
      {(stats?.alertes?.rupture > 0 || stats?.alertes?.seuil_minimum > 0 || 
        stats?.credits?.clients_credit_eleve > 0 || stats?.cheques?.pret_depot?.nb > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Alertes et Notifications</h2>
          <div className="space-y-2">
            {stats.alertes.rupture > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <span className="text-sm">
                  <strong>{stats.alertes.rupture}</strong> produit(s) en rupture de stock
                </span>
              </div>
            )}
            {stats.alertes.seuil_minimum > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm">
                  <strong>{stats.alertes.seuil_minimum}</strong> produit(s) sous le seuil minimum
                </span>
              </div>
            )}
            {stats?.credits?.clients_credit_eleve > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm">
                  <strong>{stats.credits.clients_credit_eleve}</strong> client(s) avec crédit élevé (&gt;80% du crédit autorisé)
                </span>
              </div>
            )}
            {stats?.cheques?.pret_depot?.nb > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm">
                  <strong>{stats.cheques.pret_depot.nb}</strong> chèque(s) prêt(s) pour dépôt ({Number(stats.cheques.pret_depot.montant).toFixed(2)} MAD)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;
