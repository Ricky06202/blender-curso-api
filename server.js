// 1. Importaciones
import express from 'express';
import cors from 'cors';
import dotenv from 'fileURLToPath';
import path from 'path';
import { db } from './src/db/index.js';
import { todos } from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

// 3. Rutas
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: '✅ API de Lista de Tareas con Drizzle',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Obtener todas las tareas
app.get('/api/todos', async (req, res) => {
    try {
        const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));
        res.json(allTodos);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ message: 'Error al obtener las tareas' });
    }
});

// Crear una nueva tarea
app.post('/api/todos', async (req, res) => {
    if (!req.body.text) {
        return res.status(400).json({ message: 'El texto de la tarea es requerido' });
    }
    
    try {
        const [newTodo] = await db.insert(todos)
            .values({ 
                text: req.body.text,
                completed: false
            })
            .returning();
            
        res.status(201).json(newTodo);
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ message: 'Error al crear la tarea' });
    }
});

// Actualizar una tarea
app.patch('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, completed } = req.body;
        
        const updates = {};
        if (text !== undefined) updates.text = text;
        if (completed !== undefined) updates.completed = completed;
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
        }
        
        const [updatedTodo] = await db.update(todos)
            .set(updates)
            .where(eq(todos.id, id))
            .returning();
            
        if (!updatedTodo) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }
        
        res.json(updatedTodo);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ message: 'Error al actualizar la tarea' });
    }
});

// Eliminar una tarea
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedTodo] = await db.delete(todos)
            .where(eq(todos.id, id))
            .returning();
            
        if (!deletedTodo) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }
        
        res.json(deletedTodo);
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ message: 'Error al eliminar la tarea' });
    }
});

// Iniciar el servidor
const startServer = async () => {
    try {
        // Verificar conexión a la base de datos
        await db.select().from(todos).limit(1);
        console.log('✅ Conexión a la base de datos establecida');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
            console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
        process.exit(1);
    }
};

startServer();