// 1. Importaciones básicas
import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from './src/db/index.js';
import { chapters, sections } from './src/db/schema.js';
import { eq, asc } from 'drizzle-orm';


// 2. Configuración de rutas de módulos ES
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

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
const pool = mysql.createPool(dbConfig);

// 5. Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// 6. Middleware para parsear JSON
app.use(express.json());

// 7. Ruta raíz
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: '¡API funcionando correctamente!',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: {
            host: dbConfig.host,
            database: dbConfig.database,
            user: dbConfig.user
        }
    });
});

// 8. Ruta para obtener capítulos
app.get('/api/chapters', async (req, res) => {
  try {
    const result = await db.select()
      .from(chapters)
      .where(eq(chapters.isPublished, true))
      .orderBy(asc(chapters.order));

    // Envía directamente el array de capítulos
    res.json(result);

  } catch (error) {
    console.error('Error al obtener capítulos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los capítulos',
      // Solo muestra detalles del error en desarrollo
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
});

// 9. Iniciar servidor
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

// 10. Manejo de errores
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
    process.exit(1);
});