import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// 1. Crear el pool de conexiones
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 2. Crear la instancia de Drizzle
export const db = drizzle(pool, { 
  schema,
  mode: 'default'
});

// 3. Prueba de conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    process.exit(1);
  }
}

testConnection();