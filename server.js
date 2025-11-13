import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Importar rutas
import authRoutes from './src/routes/auth.routes.js';
import chapterRoutes from './src/routes/chapter.routes.js';

// Importar configuración de Passport
import './src/config/passport.js';

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:4321',
    'https://blender.rsanjur.com',
    'http://blender.rsanjur.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 día
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/chapters', chapterRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API del Curso de Blender',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile'
      },
      chapters: {
        list: 'GET /api/chapters',
        getChapter: 'GET /api/chapters/:id',
        progress: 'GET /api/chapters/progress/me',
        updateProgress: 'PUT /api/chapters/:chapterId/progress'
      }
    }
  });
});

// Ruta protegida de ejemplo
app.get('/api/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  res.json({ user: req.user });
});

// Ruta de prueba
app.get('/api/usuarios', async (req, res) => {
  try {
    // Utilizamos Drizzle ORM para obtener los usuarios
    const usuarios = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt
    }).from(users);
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Algo salió mal en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

export default app;