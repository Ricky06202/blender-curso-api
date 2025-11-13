import { Router } from 'express';
import { 
  getChapters, 
  getChapterById, 
  updateChapterProgress,
  getUserProgress 
} from '../controllers/chapter.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', getChapters);
router.get('/:id', getChapterById);

// Rutas protegidas
router.get('/progress/me', isAuthenticated, getUserProgress);
router.put('/:chapterId/progress', isAuthenticated, updateChapterProgress);

export default router;
