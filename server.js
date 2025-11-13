// 1. Importaciones básicas
import express from 'express';
import dotenv from 'dotenv';
import { db } from './src/db/index.js';

// 2. Configuración básica
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middleware para parsear JSON
app.use(express.json());

// 4. Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: '¡API funcionando correctamente!',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// 5. Ruta para obtener todos los capítulos
app.get('/api/chapters', async (req, res) => {
    try {
        const chapters = await db.query.chapters.findMany({
            where: (chapters, { eq }) => eq(chapters.isPublished, true),
            orderBy: (chapters, { asc }) => [asc(chapters.order)],
            with: {
                sections: {
                    orderBy: (sections, { asc }) => [asc(sections.order)]
                }
            }
        });

        res.json({
            status: 'success',
            data: chapters
        });
    } catch (error) {
        console.error('Error al obtener capítulos:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los capítulos'
        });
    }
});

// 6. Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// 7. Manejo básico de errores
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
    process.exit(1);
});