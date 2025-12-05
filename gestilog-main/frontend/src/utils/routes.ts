/**
 * Helper pour obtenir le préfixe de route selon le rôle de l'utilisateur
 */
export const getRoutePrefix = (role: string | undefined): string => {
  if (role === 'super_admin') {
    return '/super-admin';
  } else if (role === 'admin') {
    return '/admin';
  } else {
    // Pour les users, pas de préfixe (routes à la racine)
    return '';
  }
};

/**
 * Helper pour construire une route complète selon le rôle
 */
export const buildRoute = (role: string | undefined, path: string): string => {
  const prefix = getRoutePrefix(role);
  // Si le path commence déjà par /admin ou /super-admin, on le garde tel quel
  if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
    return path;
  }
  // Sinon, on ajoute le préfixe
  return prefix + (path.startsWith('/') ? path : '/' + path);
};


