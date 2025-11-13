import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', isAuthenticated, getProfile);

export default router;
