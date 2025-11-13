import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from './src/db/index.js';
import { todos } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inicialización
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de CORS
app.use(cors({
    origin: ['https://rsanjur.com', 'http://localhost:4321'],
    credentials: true
}));

app.use(express.json());

// Rutas de tareas
app.get('/api/todos', async (req, res) => {
    try {
        const allTodos = await db.select().from(todos).orderBy(todos.createdAt);
        res.json(allTodos);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ message: 'Error al obtener las tareas' });
    }
});

app.post('/api/todos', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'El texto es requerido' });
        }
        const [newTodo] = await db.insert(todos).values({ text }).returning();
        res.status(201).json(newTodo);
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ message: 'Error al crear la tarea' });
    }
});

app.patch('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        const [updatedTodo] = await db
            .update(todos)
            .set({ completed })
            .where(eq(todos.id, id))
            .returning();
        res.json(updatedTodo);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ message: 'Error al actualizar la tarea' });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.delete(todos).where(eq(todos.id, id));
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ message: 'Error al eliminar la tarea' });
    }
});

// Ruta raíz con documentación
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
        message: 'API de Tareas',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            todos: {
                list: { 
                    method: 'GET', 
                    url: `${baseUrl}/api/todos` 
                },
                create: { 
                    method: 'POST', 
                    url: `${baseUrl}/api/todos`,
                    body: {
                        text: 'string (requerido)'
                    }
                },
                update: { 
                    method: 'PATCH', 
                    url: `${baseUrl}/api/todos/:id`,
                    body: {
                        completed: 'boolean'
                    }
                },
                delete: { 
                    method: 'DELETE', 
                    url: `${baseUrl}/api/todos/:id` 
                }
            }
        }
    });
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Algo salió mal', 
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});