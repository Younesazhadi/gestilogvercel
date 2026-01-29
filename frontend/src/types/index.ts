export interface User {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  magasinId: number | null;
  permissions?: Record<string, boolean>;
  planFeatures?: Record<string, boolean>;
}

export interface Magasin {
  id: number;
  nom_magasin: string;
  adresse: string | null;
  telephone: string | null;
  email: string;
  logo_url: string | null;
  ice: string | null;
  rc: string | null;
  plan_id: number | null;
  statut: 'actif' | 'suspendu' | 'expire';
  date_creation: string;
  date_expiration_abonnement: string | null;
  notes?: string | null;
}

export interface Produit {
  id: number;
  magasin_id: number;
  nom: string;
  code_barre: string | null;
  reference: string | null;
  categorie_id: number | null;
  description: string | null;
  prix_achat: number | null;
  prix_vente: number;
  stock_actuel: number;
  stock_min: number;
  unite: string;
  emplacement: string | null;
  image_url: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vente {
  id: number;
  magasin_id: number;
  numero_vente: string;
  type_document: 'ticket' | 'facture' | 'devis' | 'bl' | 'paiement_credit' | 'paiement_cheque' | 'depense';
  client_id: number | null;
  user_id: number;
  date_vente: string;
  montant_ht: number | null;
  montant_tva: number | null;
  montant_ttc: number;
  remise: number;
  mode_paiement: string | null;
  statut: 'valide' | 'annule' | 'brouillon';
  notes: string | null;
  date_cheque?: string | null;
  statut_cheque?: string | null;
  lignes?: LigneVente[];
}

export interface LigneVente {
  id: number;
  vente_id: number;
  produit_id: number | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  tva: number;
  remise: number;
  montant_total: number;
}

export interface Client {
  id: number;
  magasin_id: number;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ice: string | null;
  credit_autorise: number;
  solde: number;
  notes: string | null;
  created_at: string;
}

export interface Fournisseur {
  id: number;
  magasin_id: number;
  nom: string;
  contact_nom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ice: string | null;
  ville: string | null;
  notes: string | null;
  created_at: string;
}

export interface MouvementStock {
  id: number;
  magasin_id: number;
  produit_id: number;
  type: 'entree' | 'sortie' | 'ajustement' | 'inventaire';
  quantite: number;
  prix_unitaire: number | null;
  fournisseur_id: number | null;
  reference_doc: string | null;
  user_id: number | null;
  date_mouvement: string;
  motif: string | null;
}

export interface Plan {
  id: number;
  nom: string;
  prix_mensuel: number;
  nb_utilisateurs_max: number;
  nb_produits_max: number | null;
  fonctionnalites: Record<string, any>;
  actif: boolean;
  created_at: string;
}

