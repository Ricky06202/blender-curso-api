// 1. Importar dependencias
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';


// 2. Configuración de rutas de archivos ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 4. Parsear la URL de la base de datos
const parseDatabaseUrl = (url) => {
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!match) throw new Error('URL de base de datos no válida');
    
    return {
        host: match[3],
        user: match[1],
        password: match[2],
        database: match[5],
        port: parseInt(match[4]),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
};

// 5. Configuración de la base de datos
let dbConfig;
let pool;

try {
    dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    pool = mysql.createPool(dbConfig);
    console.log('✅ Configuración de base de datos exitosa');
} catch (error) {
    console.error('❌ Error en la configuración de la base de datos:', error.message);
    process.exit(1);
}

// 6. Importar controladores
import { getChapters, getChapterById } from './src/controllers/chapter.controller.js';
import { register, login, logout, getCurrentUser } from './src/controllers/auth.controller.js';
// import { isAuthenticated } from './src/middleware/auth.js';

// Después de la configuración de la base de datos
// import passport from './src/config/passport.js';

// Inicializar Passport
// app.use(passport.initialize());

// 7. Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// 8. Middlewares
const allowedOrigins = [
  'https://blender.rsanjur.com',
  'http://localhost:4321'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin 'origin' (como aplicaciones móviles o curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true // Si necesitas enviar cookies o autenticación
};

app.use(cors(corsOptions));
app.use(express.json());
// 9. Rutas
app.get('/', (req, res) => {
    res.json({ 
        message: 'API de Cursos de Blender',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: {
            host: dbConfig.host,
            database: dbConfig.database,
            user: dbConfig.user
        }
    });
});

// 10. Rutas de la API
app.get('/api/chapters', getChapters);
app.get('/api/chapters/:id', getChapterById);

// Rutas de autenticación
// app.post('/api/auth/register', register);
// app.post('/api/auth/login', login);
// app.post('/api/auth/logout', logout);
// app.get('/api/auth/me', isAuthenticated, getCurrentUser);


// 11. Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && {
            details: err.message
        })
    });
});

// 12. Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Base de datos: ${dbConfig.host}/${dbConfig.database}`);
    
    // Probar conexión a la base de datos
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos exitosa');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
    }
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
    process.exit(1);
});