// 1. Importaciones básicas
import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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

// 5. Ruta para obtener todos los capítulos (versión simplificada)
app.get('/api/chapters', async (req, res) => {
    try {
        // Datos de ejemplo (sin conexión a base de datos)
        const chapters = [
            {
                id: 1,
                title: "Capítulo de ejemplo",
                description: "Este es un capítulo de prueba",
                order: 1,
                isPublished: true
            }
        ];

        res.json({
            status: 'success',
            data: chapters
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error en el servidor'
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