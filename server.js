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
    console.log('🔍 Iniciando consulta de capítulos...');
    
    // 1. Primero, prueba una consulta simple
    console.log('🔹 Probando consulta simple...');
    const testQuery = await db.select().from(chapters).limit(1);
    console.log('✅ Consulta simple exitosa:', testQuery);

    // 2. Consulta con join
    console.log('🔹 Probando consulta con join...');
    const result = await db.select({
      id: chapters.id,
      order: chapters.order,
      title: chapters.title,
      // Agreguemos solo los campos necesarios para probar
      sections: {
        id: sections.id,
        title: sections.title
      }
    })
    .from(chapters)
    .leftJoin(sections, eq(chapters.id, sections.chapterId))
    .where(eq(chapters.isPublished, true))
    .orderBy(asc(chapters.order), asc(sections.order));

    console.log('✅ Consulta con join exitosa. Resultados:', result.length);

    // 3. Procesamiento más seguro
    const grouped = [];
    const chaptersMap = new Map();

    result.forEach(row => {
      if (!chaptersMap.has(row.id)) {
        const chapterData = {
          ...row,
          sections: []
        };
        delete chapterData.sections; // Eliminar el objeto sections inicial
        chaptersMap.set(row.id, chapterData);
        grouped.push(chapterData);
      }

      if (row.sections && row.sections.id) {
        const chapter = chaptersMap.get(row.id);
        chapter.sections = chapter.sections || [];
        chapter.sections.push(row.sections);
      }
    });

    res.json({ 
      status: 'success', 
      data: grouped 
    });

  } catch (error) {
    console.error('❌ Error detallado:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    // Si es un error de Drizzle, muestra más detalles
    if (error.cause) {
      console.error('Causa:', error.cause);
    }
    if (error.code) {
      console.error('Código de error:', error.code);
    }

    res.status(500).json({
      status: 'error',
      message: 'Error al obtener los capítulos',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        ...(error.cause && { cause: error.cause.message })
      } : undefined
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