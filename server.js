import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Importar controladores
import { getChapters, getChapterById, updateChapterProgress, getUserProgress } from './src/controllers/chapter.controller.js';
import { register, login, getProfile, logout } from './src/controllers/auth.controller.js';

// Middlewares
import { authenticate, isAdmin } from './src/middleware/auth.middleware.js';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inicialización
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de CORS
app.use(cors({
    origin: ['https://rsanjur.com', 'http://localhost:4321'],
    credentials: true
}));

app.use(express.json());

// Rutas de autenticación
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/profile', authenticate, getProfile);
app.post('/api/auth/logout', authenticate, logout);

// Rutas de capítulos
app.get('/api/chapters', getChapters);
app.get('/api/chapters/:id', getChapterById);

// Rutas de progreso
app.get('/api/progress', authenticate, getUserProgress);
app.post('/api/progress/:chapterId', authenticate, updateChapterProgress);

// Ruta raíz con documentación
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
        message: 'API del Curso de Blender',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: {
                register: { method: 'POST', url: `${baseUrl}/api/auth/register` },
                login: { method: 'POST', url: `${baseUrl}/api/auth/login` },
                profile: { 
                    method: 'GET', 
                    url: `${baseUrl}/api/auth/profile`,
                    requires: 'autenticación'
                },
                logout: { 
                    method: 'POST', 
                    url: `${baseUrl}/api/auth/logout`,
                    requires: 'autenticación'
                }
            },
            chapters: {
                list: { 
                    method: 'GET', 
                    url: `${baseUrl}/api/chapters`
                },
                get: { 
                    method: 'GET', 
                    url: `${baseUrl}/api/chapters/:id`
                }
            },
            progress: {
                get: {
                    method: 'GET',
                    url: `${baseUrl}/api/progress`,
                    requires: 'autenticación'
                },
                update: {
                    method: 'POST',
                    url: `${baseUrl}/api/progress/:chapterId`,
                    requires: 'autenticación',
                    body: {
                        progress: 'number (0-100)',
                        completed: 'boolean (opcional)'
                    }
                }
            }
        }
    });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Algo salió mal', 
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Iniciar el servidor
const startServer = async () => {
    try {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
            console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ No se pudo iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();