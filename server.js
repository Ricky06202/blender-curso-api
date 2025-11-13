// 1. Importar dependencias
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 2. Configuración de rutas de archivos ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Cargar variables de entorno
dotenv.config();

// 4. Importar controladores
import { getChapters, getChapterById } from './src/controllers/chapter.controller.js';

// 5. Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// 6. Middlewares
app.use(cors());
app.use(express.json());

// 7. Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Cursos de Blender',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 8. Rutas de la API
app.get('/api/chapters', getChapters);
app.get('/api/chapters/:id', getChapterById);

// 9. Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message
    })
  });
});

// 10. Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'No configurada'}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  process.exit(1);
});