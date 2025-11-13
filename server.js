// 1. Importaciones básicas
import express from 'express';
import dotenv from 'dotenv';

// 2. Configuración básica
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: '¡API funcionando correctamente!',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// 4. Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// 5. Manejo básico de errores
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
    process.exit(1);
});