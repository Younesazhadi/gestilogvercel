import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import adminRoutes from './routes/adminRoutes';
import rapportsRoutes from './routes/rapportsRoutes';
import { updateExpiredSubscriptions } from './utils/subscriptionUtils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS - Permet plusieurs origines en développement
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'http://localhost:3000']
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite default port
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting général - plus permissif pour éviter les faux positifs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limite chaque IP à 500 requêtes par windowMs (augmenté de 200 à 500)
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting pour les requêtes de santé
    return req.path === '/api/health';
  },
});

// Rate limiting pour l'authentification - plus permissif
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 tentatives de connexion par 15 minutes (augmenté de 50)
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
});

// Rate limiting très permissif pour les routes de profil (authentifiées)
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limite à 300 requêtes par 15 minutes pour le profil
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/profile', profileLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/rapports', rapportsRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    message: 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 Environnement: ${process.env.NODE_ENV || 'development'}`);
  
  // Mettre à jour les statuts des abonnements expirés au démarrage
  try {
    await updateExpiredSubscriptions();
    console.log('✅ Vérification des abonnements expirés effectuée au démarrage');
  } catch (error) {
    console.error('⚠️ Erreur lors de la mise à jour des abonnements au démarrage:', error);
  }

  // Mettre à jour les statuts toutes les heures
  setInterval(async () => {
    try {
      await updateExpiredSubscriptions();
    } catch (error) {
      console.error('Erreur lors de la mise à jour périodique des abonnements:', error);
    }
  }, 60 * 60 * 1000); // Toutes les heures
});

export default app;

