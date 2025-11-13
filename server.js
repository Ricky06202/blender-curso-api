import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inicialización
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de la base de datos
const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/todo_list');
const dbConfig = {
    host: dbUrl.hostname,
    database: dbUrl.pathname.replace(/^\//, ''),
    user: dbUrl.username,
    password: dbUrl.password,
    port: dbUrl.port || 3306
};

console.log('🔌 Configuración de base de datos:', {
    ...dbConfig,
    password: dbConfig.password ? '***' : '(no password)'
});

// Crear el pool de conexiones
let pool;
try {
    pool = mysql.createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        port: dbConfig.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('✅ Pool de conexión a MySQL creado exitosamente');
} catch (error) {
    console.error('❌ Error al crear el pool de conexión:', error);
    process.exit(1);
}

// Función para ejecutar consultas SQL
const query = async (sql, params = []) => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🔍 Ejecutando consulta:', { sql, params });
        const [results] = await connection.query(sql, params);
        return results;
    } catch (error) {
        console.error('❌ Error en la consulta SQL:', {
            sql,
            params,
            error: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.release();
            } catch (releaseError) {
                console.error('Error al liberar la conexión:', releaseError);
            }
        }
    }
};

// Middlewares
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

// Inicialización de la base de datos
let isDatabaseInitialized = false;

const initializeDatabase = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS todos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                text VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla de todos inicializada');
        return true;
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        return false;
    }
};

// Middleware para verificar que la base de datos está lista
app.use((req, res, next) => {
    if (!isDatabaseInitialized) {
        return res.status(503).json({
            status: 'error',
            message: 'Servicio no disponible. Inicializando base de datos...'
        });
    }
    next();
});

// Rutas
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: '✅ API de Lista de Tareas en línea',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/todos', async (req, res) => {
    try {
        const todos = await query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json(todos);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ message: 'Error al obtener las tareas' });
    }
});

app.get('/api/todos/:id', async (req, res) => {
    try {
        const [todo] = await query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
        if (!todo) return res.status(404).json({ message: 'Tarea no encontrada' });
        res.json(todo);
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({ message: 'Error al obtener la tarea' });
    }
});

app.post('/api/todos', async (req, res) => {
    if (!req.body.text) {
        return res.status(400).json({ message: 'El texto de la tarea es requerido' });
    }
    
    try {
        const result = await query(
            'INSERT INTO todos (text, completed) VALUES (?, ?)',
            [req.body.text, false]
        );
        
        const [newTodo] = await query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        res.status(201).json(newTodo);
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ message: 'Error al crear la tarea' });
    }
});

app.patch('/api/todos/:id', async (req, res) => {
    try {
        const [existingTodo] = await query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
        if (!existingTodo) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }
        
        const updates = [];
        const params = [];
        
        if (typeof req.body.completed !== 'undefined') {
            updates.push('completed = ?');
            params.push(req.body.completed);
        }
        
        if (req.body.text) {
            updates.push('text = ?');
            params.push(req.body.text);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
        }
        
        params.push(req.params.id);
        
        await query(
            `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        const [updatedTodo] = await query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
        res.json(updatedTodo);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ message: 'Error al actualizar la tarea' });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const [todo] = await query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
        if (!todo) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }
        
        await query('DELETE FROM todos WHERE id = ?', [req.params.id]);
        res.json(todo);
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ message: 'Error al eliminar la tarea' });
    }
});

// Ruta de verificación de estado
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        database: isDatabaseInitialized ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Iniciar el servidor
const startServer = async () => {
    try {
        isDatabaseInitialized = await initializeDatabase();
        if (!isDatabaseInitialized) {
            throw new Error('No se pudo inicializar la base de datos');
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor Express ejecutándose en http://0.0.0.0:${PORT}`);
            console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Base de datos: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        });
    } catch (error) {
        console.error('❌ No se pudo iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();