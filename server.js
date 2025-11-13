// 1. Importaciones
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

console.log('🔄 Iniciando servidor...');

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Buscando archivo .env en:', envPath);

try {
  dotenv.config({ path: envPath, override: true });
  console.log('✅ Variables de entorno cargadas correctamente');
  console.log('📋 Variables de entorno cargadas:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'
  });
} catch (error) {
  console.error('❌ Error al cargar el archivo .env:', error);
  process.exit(1);
}

// 2. Inicialización
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS
const allowedOrigins = ['https://rsanjur.com', 'http://localhost:4321'];
console.log('🌐 Configurando CORS para orígenes permitidos:', allowedOrigins);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'El origen de CORS no está permitido';
            console.warn('⚠️ Intento de acceso desde origen no permitido:', origin);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// Importar controladores con manejo de errores
let controllers;
try {
  console.log('🔄 Importando controladores...');
  const module = await import('./src/controllers/chapter.controller.js');
  controllers = {
    getChapters: module.getChapters,
    getChapterById: module.getChapterById,
    updateChapterProgress: module.updateChapterProgress,
    getUserProgress: module.getUserProgress
  };
  console.log('✅ Controladores cargados correctamente');
} catch (error) {
  console.error('❌ Error al cargar controladores:', error);
  process.exit(1);
}

// 3. Rutas de la API
const API_BASE = '/api';
console.log('🛣️  Configurando rutas con prefijo:', API_BASE);

// Rutas de capítulos
app.get(`${API_BASE}/chapters`, controllers.getChapters);
app.get(`${API_BASE}/chapters/:id`, controllers.getChapterById);
app.get(`${API_BASE}/progress`, controllers.getUserProgress);
app.post(`${API_BASE}/progress/:chapterId`, controllers.updateChapterProgress);

// Ruta raíz con documentación
app.get('/', (req, res) => {
    console.log('📄 Solicitada documentación en ruta raíz');
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
    console.error('❌ Error en la aplicación:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method
    });
    
    res.status(500).json({ 
        status: 'error',
        message: 'Algo salió mal en el servidor',
        ...(process.env.NODE_ENV === 'development' && { 
            error: err.message,
            stack: err.stack
        })
    });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('📚 Documentación disponible en la ruta raíz (/)\n');
    
    // Verificar la conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    import('./src/db/index.js')
        .then(() => console.log('✅ Conexión a la base de datos exitosa'))
        .catch(err => {
            console.error('❌ Error al conectar con la base de datos:');
            console.error(err);
            console.log('\nPosibles soluciones:');
            console.log('1. Verifica que el servidor de base de datos esté en ejecución');
            console.log('2. Revisa la configuración en el archivo .env');
            console.log('3. Asegúrate de que la base de datos y el usuario existan');
            console.log('4. Verifica que el puerto y las credenciales sean correctos\n');
            process.exit(1);
        });
});