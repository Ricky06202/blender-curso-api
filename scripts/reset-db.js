import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Función para parsear la URL de la base de datos
function parseDatabaseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Formato de DATABASE_URL inválido');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5]
  };
}

async function resetDatabase() {
  dotenv.config();
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  // Crear conexión sin especificar la base de datos
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port,
    multipleStatements: true
  });

  try {
    console.log(`Eliminando la base de datos ${dbConfig.database} si existe...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
    
    console.log(`Creando la base de datos ${dbConfig.database}...`);
    await connection.query(`CREATE DATABASE \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log('✅ Base de datos reiniciada exitosamente.');
  } catch (error) {
    console.error('❌ Error al reiniciar la base de datos:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };
