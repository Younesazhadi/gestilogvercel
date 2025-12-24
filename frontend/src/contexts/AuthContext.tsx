import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

// Intercepteur pour ajouter le token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401 et 429
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Gérer les erreurs 429 (Too Many Requests) avec retry
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 5;
      const retryCount = error.config._retryCount || 0;
      
      // Limiter à 2 tentatives de retry
      if (retryCount < 2) {
        error.config._retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return axios.request(error.config);
      }
      
      // Si trop de retries, afficher un message et ne pas bloquer l'application
      console.warn('Trop de requêtes. Veuillez patienter quelques instants.');
      return Promise.reject(error);
    }
    
    // Gérer les erreurs 401 (Unauthorized)
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', response.data.accessToken);
          return axios.request(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    // Éviter les appels multiples simultanés
    if (isFetchingProfile) {
      return;
    }

    try {
      setIsFetchingProfile(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/auth/profile');
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Stocker aussi les fonctionnalités du plan séparément pour accès facile
      if (userData.planFeatures) {
        localStorage.setItem('planFeatures', JSON.stringify(userData.planFeatures));
      }
    } catch (error: any) {
      console.error('Erreur récupération profil:', error);
      
      // Si erreur 429, ne pas nettoyer les données, juste attendre
      if (error.response?.status === 429) {
        // L'intercepteur gère déjà le retry, on attend juste
        // Ne pas bloquer l'application si on a déjà des données en cache
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            console.error('Erreur parsing user cache:', e);
          }
        }
        return;
      }
      
      // Si erreur 401, nettoyer et laisser l'intercepteur gérer la redirection
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('planFeatures');
        // L'intercepteur redirigera vers /login
      }
    } finally {
      setLoading(false);
      setIsFetchingProfile(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      // Stocker aussi les fonctionnalités du plan
      if (user.planFeatures) {
        localStorage.setItem('planFeatures', JSON.stringify(user.planFeatures));
      }
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('planFeatures');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

