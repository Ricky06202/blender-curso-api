// 1. Importaciones básicas
import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import path from 'path';

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
    let connection;
    try {
        console.log('🔍 Intentando conectar a la base de datos...');
        connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida');
        
        console.log('📝 Ejecutando consulta de capítulos...');
        const [chapters] = await connection.query(`
            SELECT * FROM chapters 
            WHERE isPublished = true 
            ORDER BY \`order\` ASC
        `);
        console.log(`📚 Capítulos encontrados: ${chapters.length}`);

        for (let i = 0; i < chapters.length; i++) {
            console.log(`🔄 Obteniendo secciones para el capítulo ${chapters[i].id}...`);
            const [sections] = await connection.query(`
                SELECT * FROM sections 
                WHERE chapterId = ? 
                ORDER BY \`order\` ASC
            `, [chapters[i].id]);
            chapters[i].sections = sections || [];
            console.log(`✅ ${sections.length} secciones encontradas para el capítulo ${chapters[i].id}`);
        }

        res.json({ 
            status: 'success', 
            data: chapters 
        });
    } catch (error) {
        console.error('❌ Error detallado:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sql: error.sql,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });
        
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los capítulos',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                sqlMessage: error.sqlMessage
            } : undefined
        });
    } finally {
        if (connection) {
            console.log('🔌 Liberando conexión a la base de datos');
            await connection.release();
        }
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