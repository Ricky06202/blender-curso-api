import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Cargando variables de entorno desde:', envPath);

try {
  dotenv.config({ path: envPath, override: true });
  console.log('✅ Variables de entorno cargadas correctamente');
} catch (error) {
  console.error('❌ Error al cargar el archivo .env:', error.message);
  throw error;
}

// Verificar que las variables de entorno se cargaron
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: No se pudo cargar DATABASE_URL desde el archivo .env');
  console.log('Variables de entorno actuales:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')));
  throw new Error('No se pudo cargar la configuración de la base de datos');
}

console.log('🔌 Intentando conectar a la base de datos...');
console.log('   Host:', process.env.DATABASE_URL.split('@')[1].split(':')[0]);
console.log('   Base de datos:', process.env.DATABASE_URL.split('/').pop().split('?')[0]);

let connection;
try {
  // Parse the DATABASE_URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  // Configuración básica de conexión sin SSL
  const connectionConfig = {
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace(/^\//, ''), // Eliminar la barra inicial
    port: dbUrl.port || 3306,
    // Configuración de timeouts (solo opciones soportadas)
    connectTimeout: 10000, // 10 segundos
    // Deshabilitar SSL explícitamente
    ssl: false,
    // Configuración adicional para MySQL
    flags: ['-NO_SSL'],
    // Habilitar logs de depuración
    debug: true,
    // Configuración de conexión
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  connection = await mysql.createConnection(connectionConfig);
  console.log('✅ Conexión a la base de datos establecida correctamente');
} catch (error) {
  console.error('❌ Error al conectar a la base de datos:', error.message);
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('   Verifica el nombre de usuario y la contraseña');
  } else if (error.code === 'ER_BAD_DB_ERROR') {
    console.error('   La base de datos no existe. Asegúrate de que la base de datos esté creada');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('   No se pudo conectar al servidor MySQL. Verifica que el servidor esté en ejecución');
  }
  throw error;
}

export const db = drizzle(connection);
