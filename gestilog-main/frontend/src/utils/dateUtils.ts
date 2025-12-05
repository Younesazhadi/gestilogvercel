/**
 * Convertit une date ISO (ex: "2025-12-29T23:00:00.000Z") en format "yyyy-MM-dd"
 * pour les champs input de type "date"
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Extraire l'année, le mois et le jour
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '';
  }
};

/**
 * Convertit une date au format "yyyy-MM-dd" en objet Date
 */
export const parseDateFromInput = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    console.error('Erreur parsing date:', error);
    return null;
  }
};

