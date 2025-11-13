import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.resolve(__dirname, '../../../.env');
console.log('🔍 [seeds/index.js] Cargando variables de entorno desde:', envPath);

// Cargar y sobrescribir cualquier variable existente
dotenv.config({ path: envPath, override: true });

// Verificar que las variables de entorno se cargaron
console.log('🔑 Variables de entorno cargadas:', {
  DATABASE_URL: process.env.DATABASE_URL ? '✅' : '❌ No encontrada',
  NODE_ENV: process.env.NODE_ENV || 'development'
});

// Importar después de cargar las variables de entorno
import { seedChapters } from './chapters.seed.js';

async function runSeeds() {
  try {
    console.log('🚀 Iniciando proceso de seed...');
    
    // Ejecutar seeds individuales
    await seedChapters();
    
    console.log('✨ Todos los seeds se han ejecutado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar los seeds:', error);
    if (error.code) {
      console.error('   Código de error:', error.code);
    }
    process.exit(1);
  }
}

// Ejecutar los seeds si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds();
}

export { runSeeds };
