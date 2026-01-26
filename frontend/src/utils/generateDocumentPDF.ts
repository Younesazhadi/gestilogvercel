import jsPDF from 'jspdf';

interface EntrepriseInfo {
  nom_magasin: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  telephone?: string;
  telephone_fixe?: string;
  telephone_gsm?: string;
  email?: string;
  logo_url?: string;
  ice?: string;
  rc?: string;
  patent?: string;
  if_fiscal?: string;
  cnss?: string;
  compte_bancaire?: string;
  proprietaire?: string;
}

interface LigneVente {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  tva: number;
  montant_total: number;
}

interface VenteData {
  numero_vente: string;
  date_vente: string;
  type_document: string;
  client_nom?: string;
  client_telephone?: string;
  lignes: LigneVente[];
  montant_ht?: number;
  montant_tva?: number;
  montant_ttc: number;
  remise?: number;
  mode_paiement?: string;
  reference_paiement?: string;
  date_cheque?: string;
  statut_cheque?: string;
  montant_paye?: number;
  notes?: string;
}

// Charger une image depuis une URL
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Impossible de charger le contexte canvas'));
        }
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      // Si le chargement échoue, on continue sans logo
      reject(new Error('Erreur lors du chargement de l\'image'));
    };
    // Timeout après 5 secondes
    setTimeout(() => {
      if (!img.complete) {
        reject(new Error('Timeout lors du chargement de l\'image'));
      }
    }, 5000);
    img.src = url;
  });
};

export const generateDocumentPDF = async (
  vente: VenteData,
  entreprise: EntrepriseInfo
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Couleurs
  const primaryColor = [59, 130, 246]; // Blue-500
  const grayColor = [107, 114, 128]; // Gray-500

  // Fonction pour ajouter du texte
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    pdf.setFontSize(options.size || 10);
    pdf.setTextColor(...(options.color || [0, 0, 0]));
    pdf.setFont(options.font || 'helvetica', options.style || 'normal');
    pdf.text(text, x, y);
  };

  // Fonction pour dessiner une ligne
  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: number[] = [0, 0, 0]) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.line(x1, y1, x2, y2);
  };

  // En-tête avec logo
  try {
    if (entreprise.logo_url) {
      const logoData = await loadImage(entreprise.logo_url);
      pdf.addImage(logoData, 'PNG', margin, yPos, 30, 30);
    }
  } catch (error) {
    console.error('Erreur chargement logo:', error);
  }

  // Informations de l'entreprise (à droite du logo ou en haut si pas de logo)
  const infoX = entreprise.logo_url ? margin + 35 : margin;
  addText(entreprise.nom_magasin, infoX, yPos + 5, { size: 16, style: 'bold' });
  
  if (entreprise.proprietaire) {
    addText(entreprise.proprietaire, infoX, yPos + 10, { size: 10 });
  }

  let infoY = yPos + 15;
  if (entreprise.adresse) {
    addText(entreprise.adresse, infoX, infoY, { size: 9 });
    infoY += 5;
  }
  if (entreprise.ville || entreprise.code_postal) {
    const villeCode = [entreprise.ville, entreprise.code_postal].filter(Boolean).join(' ');
    addText(villeCode, infoX, infoY, { size: 9 });
    infoY += 5;
  }
  if (entreprise.telephone_fixe || entreprise.telephone_gsm) {
    const tel = [entreprise.telephone_fixe, entreprise.telephone_gsm].filter(Boolean).join(' / ');
    addText(`Tél: ${tel}`, infoX, infoY, { size: 9 });
    infoY += 5;
  }
  if (entreprise.email) {
    addText(`Email: ${entreprise.email}`, infoX, infoY, { size: 9 });
    infoY += 5;
  }

  // Informations légales
  const legalY = yPos + 30;
  const legalInfo: string[] = [];
  if (entreprise.rc) legalInfo.push(`RC: ${entreprise.rc}`);
  if (entreprise.patent) legalInfo.push(`Patente: ${entreprise.patent}`);
  if (entreprise.if_fiscal) legalInfo.push(`IF: ${entreprise.if_fiscal}`);
  if (entreprise.cnss) legalInfo.push(`CNSS: ${entreprise.cnss}`);
  if (entreprise.ice) legalInfo.push(`ICE: ${entreprise.ice}`);

  if (legalInfo.length > 0) {
    addText(legalInfo.join(' | '), margin, legalY, { size: 8, color: grayColor });
  }

  yPos = legalY + 10;

  // Ligne de séparation
  drawLine(margin, yPos, pageWidth - margin, yPos, primaryColor);
  yPos += 10;

  // Type de document et numéro
  const docTypeLabels: Record<string, string> = {
    facture: 'FACTURE',
    devis: 'DEVIS',
    bl: 'BON DE LIVRAISON',
    ticket: 'TICKET',
  };

  const docType = docTypeLabels[vente.type_document] || vente.type_document.toUpperCase();
  addText(docType, margin, yPos, { size: 18, style: 'bold', color: primaryColor });
  addText(`N° ${vente.numero_vente}`, pageWidth - margin - 50, yPos, { size: 14, style: 'bold' });
  yPos += 10;

  // Date
  const dateStr = new Date(vente.date_vente).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  addText(`Date: ${dateStr}`, margin, yPos, { size: 10 });
  yPos += 8;

  // Informations client
  if (vente.client_nom) {
    drawLine(margin, yPos, pageWidth - margin, yPos, [200, 200, 200]);
    yPos += 5;
    addText('CLIENT', margin, yPos, { size: 12, style: 'bold' });
    yPos += 6;
    addText(vente.client_nom, margin, yPos, { size: 10 });
    yPos += 5;
    if (vente.client_telephone) {
      addText(`Tél: ${vente.client_telephone}`, margin, yPos, { size: 9 });
      yPos += 5;
    }
    yPos += 5;
  }

  // Tableau des lignes
  yPos += 5;
  drawLine(margin, yPos, pageWidth - margin, yPos, primaryColor);
  yPos += 5;

  // En-tête du tableau
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  addText('Désignation', margin + 2, yPos, { size: 9, color: [255, 255, 255], style: 'bold' });
  addText('Qté', margin + 80, yPos, { size: 9, color: [255, 255, 255], style: 'bold' });
  addText('P.U.', margin + 100, yPos, { size: 9, color: [255, 255, 255], style: 'bold' });
  addText('TVA', margin + 125, yPos, { size: 9, color: [255, 255, 255], style: 'bold' });
  addText('Total', pageWidth - margin - 30, yPos, { size: 9, color: [255, 255, 255], style: 'bold' });
  yPos += 8;

  // Lignes de vente
  vente.lignes.forEach((ligne) => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }

    drawLine(margin, yPos, pageWidth - margin, yPos, [200, 200, 200]);
    yPos += 4;

    // Désignation (peut être tronquée si trop longue)
    const designation = ligne.designation.length > 40 
      ? ligne.designation.substring(0, 37) + '...' 
      : ligne.designation;
    addText(designation, margin + 2, yPos, { size: 9 });
    addText(ligne.quantite.toString(), margin + 80, yPos, { size: 9 });
    addText(`${Number(ligne.prix_unitaire).toFixed(2)} MAD`, margin + 100, yPos, { size: 9 });
    addText(`${ligne.tva}%`, margin + 125, yPos, { size: 9 });
    addText(`${Number(ligne.montant_total).toFixed(2)} MAD`, pageWidth - margin - 30, yPos, { size: 9, style: 'bold' });
    yPos += 6;
  });

  yPos += 5;
  drawLine(margin, yPos, pageWidth - margin, yPos, primaryColor);
  yPos += 10;

  // Totaux
  const totalsX = pageWidth - margin - 50;
  if (vente.remise && vente.remise > 0) {
    addText('Remise:', totalsX - 30, yPos, { size: 10 });
    addText(`${vente.remise}%`, totalsX, yPos, { size: 10, style: 'bold' });
    yPos += 6;
  }

  if (vente.montant_ht) {
    addText('Total HT:', totalsX - 30, yPos, { size: 10 });
    addText(`${Number(vente.montant_ht).toFixed(2)} MAD`, totalsX, yPos, { size: 10, style: 'bold' });
    yPos += 6;
  }

  if (vente.montant_tva) {
    addText('TVA:', totalsX - 30, yPos, { size: 10 });
    addText(`${Number(vente.montant_tva).toFixed(2)} MAD`, totalsX, yPos, { size: 10, style: 'bold' });
    yPos += 6;
  }

  drawLine(totalsX - 35, yPos, totalsX + 20, yPos, primaryColor);
  yPos += 6;
  addText('Total TTC:', totalsX - 30, yPos, { size: 14, style: 'bold' });
  addText(`${Number(vente.montant_ttc).toFixed(2)} MAD`, totalsX, yPos, { size: 14, style: 'bold', color: primaryColor });
  yPos += 10;

  // Informations de paiement
  if (vente.mode_paiement) {
    drawLine(margin, yPos, pageWidth - margin, yPos, [200, 200, 200]);
    yPos += 5;
    addText('MODE DE PAIEMENT', margin, yPos, { size: 11, style: 'bold' });
    yPos += 6;

    const modeLabels: Record<string, string> = {
      especes: 'Espèces',
      cheque: 'Chèque',
      carte: 'Carte bancaire',
      virement: 'Virement',
      credit: 'Crédit',
    };

    addText(modeLabels[vente.mode_paiement] || vente.mode_paiement, margin, yPos, { size: 10 });
    yPos += 5;

    if (vente.mode_paiement === 'cheque' && vente.reference_paiement) {
      addText(`N° chèque: ${vente.reference_paiement}`, margin, yPos, { size: 9 });
      yPos += 5;
    }
    if (vente.mode_paiement === 'cheque' && vente.date_cheque) {
      const dateCheque = new Date(vente.date_cheque).toLocaleDateString('fr-FR');
      addText(`Date chèque: ${dateCheque}`, margin, yPos, { size: 9 });
      yPos += 5;
    }
    if (vente.mode_paiement === 'cheque' && vente.statut_cheque) {
      const statutLabels: Record<string, string> = {
        en_attente: 'En attente',
        depose: 'Déposé',
        paye: 'Payé',
        impaye: 'Impayé',
      };
      addText(`Statut: ${statutLabels[vente.statut_cheque] || vente.statut_cheque}`, margin, yPos, { size: 9 });
      yPos += 5;
    }
    if (vente.mode_paiement === 'credit' && vente.montant_paye !== undefined) {
      addText(`Montant payé: ${Number(vente.montant_paye).toFixed(2)} MAD`, margin, yPos, { size: 9 });
      yPos += 5;
      const reste = Number(vente.montant_ttc) - Number(vente.montant_paye || 0);
      if (reste > 0) {
        addText(`Reste à payer: ${reste.toFixed(2)} MAD`, margin, yPos, { size: 9, color: [220, 38, 38] });
        yPos += 5;
      }
    }
    if (vente.reference_paiement && vente.mode_paiement !== 'cheque') {
      addText(`Référence: ${vente.reference_paiement}`, margin, yPos, { size: 9 });
      yPos += 5;
    }
  }

  // Notes
  if (vente.notes) {
    yPos += 5;
    drawLine(margin, yPos, pageWidth - margin, yPos, [200, 200, 200]);
    yPos += 5;
    addText('Notes:', margin, yPos, { size: 10, style: 'bold' });
    yPos += 5;
    const notesLines = pdf.splitTextToSize(vente.notes, pageWidth - 2 * margin);
    notesLines.forEach((line: string) => {
      addText(line, margin, yPos, { size: 9 });
      yPos += 4;
    });
  }

  // Pied de page
  const footerY = pageHeight - 15;
  drawLine(margin, footerY, pageWidth - margin, footerY, [200, 200, 200]);
  pdf.setFontSize(9);
  pdf.setTextColor(...grayColor);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Merci de votre confiance !', pageWidth / 2, footerY + 5, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Page 1', pageWidth / 2, footerY + 8, { align: 'center' });

  // Nom du fichier
  const docTypeLower = vente.type_document.toLowerCase();
  const fileName = `${docTypeLower}-${vente.numero_vente}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

