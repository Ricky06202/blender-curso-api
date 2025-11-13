import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Parsear la URL de la base de datos
const dbUrl = new URL(process.env.DATABASE_URL);

// Crear la conexión a la base de datos
const connection = await mysql.createConnection({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace(/^\//, ''), // Eliminar la barra inicial
  port: dbUrl.port || 3306,
});

// Crear la instancia de Drizzle
export const db = drizzle(connection);

export default db;
