import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// 1. Crear la conexión
const connection = await mysql.createConnection(process.env.DATABASE_URL);

// 2. Crear la instancia de Drizzle
export const db = drizzle(connection, { 
    schema,
    mode: 'default' // o 'planetscale' si usas PlanetScale
});