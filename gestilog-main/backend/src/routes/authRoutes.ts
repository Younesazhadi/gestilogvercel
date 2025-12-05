import { Router } from 'express';
import { login, refreshToken, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { loginValidator, validate } from '../utils/validators';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', loginValidator, validate, login);
router.post('/refresh', refreshToken);
router.get('/profile', authenticate, getProfile);

export default router;

