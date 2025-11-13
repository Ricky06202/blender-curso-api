// 1. Importaciones
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Importar controladores
import { 
  getChapters, 
  getChapterById, 
  updateChapterProgress, 
  getUserProgress 
} from './src/controllers/chapter.controller.js';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 2. Inicialización
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS
const allowedOrigins = ['https://rsanjur.com', 'http://localhost:4321'];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'El origen de CORS no está permitido';
            console.warn(msg, origin);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// 3. Rutas de la API
const API_BASE = '/api';

// Rutas de capítulos
app.get(`${API_BASE}/chapters`, getChapters);
app.get(`${API_BASE}/chapters/:id`, getChapterById);
app.get(`${API_BASE}/progress`, getUserProgress);
app.post(`${API_BASE}/progress/:chapterId`, updateChapterProgress);

// Ruta raíz con documentación
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}${API_BASE}`;
    
    const apiDocumentation = {
        message: '📚 API del Curso de Blender - Documentación',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            chapters: {
                list: {
                    method: 'GET',
                    url: `${baseUrl}/chapters`,
                    description: 'Obtiene todos los capítulos publicados',
                    authentication: 'No requerida'
                },
                get: {
                    method: 'GET',
                    url: `${baseUrl}/chapters/:id`,
                    description: 'Obtiene un capítulo específico por ID con sus secciones',
                    parameters: {
                        id: 'ID del capítulo (número)'
                    },
                    authentication: 'No requerida'
                }
            },
            progress: {
                get: {
                    method: 'GET',
                    url: `${baseUrl}/progress`,
                    description: 'Obtiene el progreso del usuario autenticado',
                    authentication: 'Requerida'
                },
                update: {
                    method: 'POST',
                    url: `${baseUrl}/progress/:chapterId`,
                    description: 'Actualiza el progreso de un capítulo',
                    parameters: {
                        chapterId: 'ID del capítulo (número)'
                    },
                    body: {
                        progress: 'number (0-100)',
                        completed: 'boolean (opcional)'
                    },
                    authentication: 'Requerida'
                }
            }
        }
    };

    res.json(apiDocumentation);
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        status: 'error',
        message: 'Algo salió mal en el servidor',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('📚 Documentación disponible en la ruta raíz (/)');
    
    // Verificar la conexión a la base de datos
    import('./src/db/index.js').then(() => {
        console.log('✅ Base de datos conectada correctamente');
    }).catch(error => {
        console.error('❌ Error al conectar con la base de datos:', error.message);
    });
});