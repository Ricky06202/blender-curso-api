import dotenv from 'dotenv';
import { db } from '../db/index.js';
import { chapters } from '../db/schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas de módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Mostrar información de depuración
console.log('🔍 Variables de entorno cargadas:', {
  DATABASE_URL: process.env.DATABASE_URL ? '✅' : '❌ No encontrada',
  NODE_ENV: process.env.NODE_ENV || 'development'
});

const chaptersData = [
  {
    order: 1,
    slug: 'introduccion-a-blender',
    title: 'Introducción a Blender',
    description: 'Aprende a instalar y configurar Blender en tu computadora. Maneja las herramientas básicas de Blender y su interfaz.',
    videoUrl: 'https://www.youtube.com/embed/iGuEJU1oJTA?si=nr1V1okmvdmTQE_E',
    duration: 212, // 3 min 32 seg en segundos
    isPublished: true,
  },
  {
    order: 2,
    slug: 'modelado-basico',
    title: 'Modelado Básico',
    description: 'Aprende el movimiento espacial en Blender',
    videoUrl: 'https://www.youtube.com/embed/gowbpDSPFcg?si=9QokdXyM9qEYRE9i',
    duration: 811, // 13 min 51 seg
    isPublished: true,
  },
  {
    order: 3,
    slug: 'texturizado-y-materiales',
    title: 'Texturizado y Materiales',
    description: 'Aprende a crear y aplicar materiales y texturas realistas a tus modelos 3D en Blender.',
    videoUrl: 'https://www.youtube.com/embed/1jHUY3qoBu8',
    duration: 1020, // 17 min
    isPublished: true,
  },
  {
    order: 4,
    slug: 'iluminacion-y-renderizado',
    title: 'Iluminación y Renderizado',
    description: 'Domina las técnicas de iluminación y renderizado para dar vida a tus escenas 3D en Blender.',
    videoUrl: 'https://www.youtube.com/embed/8mmR9ZsRGhY',
    duration: 900, // 15 min
    isPublished: true,
  },
  {
    order: 5,
    slug: 'animacion-basica',
    title: 'Animación Básica',
    description: 'Aprende los fundamentos de la animación en Blender, incluyendo keyframes, curvas de animación y rigging básico.',
    videoUrl: 'https://www.youtube.com/embed/0vHmSJ5iXf0',
    duration: 1200, // 20 min
    isPublished: true,
  },
  {
    order: 6,
    slug: 'simulaciones',
    title: 'Simulaciones Físicas',
    description: 'Explora las herramientas de simulación física en Blender, incluyendo partículas, fluidos y telas.',
    videoUrl: 'https://www.youtube.com/embed/EBABT4NtG0g',
    duration: 1500, // 25 min
    isPublished: true,
  },
  {
    order: 7,
    slug: 'composicion-y-posproduccion',
    title: 'Composición y Posproducción',
    description: 'Aprende técnicas de composición y posproducción para mejorar tus renders directamente en Blender.',
    videoUrl: 'https://www.youtube.com/embed/0-6s5bpdbrE',
    duration: 1080, // 18 min
    isPublished: true,
  },
  {
    order: 8,
    slug: 'proyecto-final',
    title: 'Proyecto Final',
    description: 'Aplica todo lo aprendido creando un proyecto completo desde cero, desde el modelado hasta el render final.',
    videoUrl: 'https://www.youtube.com/embed/0-6s5bpdbrE',
    duration: 2400, // 40 min
    isPublished: true,
  }
];

async function seedChapters() {
  console.log('🚀 Iniciando proceso de seed...');
  
  try {
    console.log('🌱 Sembrando datos de chapters...');
    console.log('📋 Total de capítulos a insertar:', chaptersData.length);
    
    // Verificar la conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    
    // Limpiar la tabla antes de insertar
    console.log('🧹 Limpiando la tabla chapters...');
    try {
      await db.delete(chapters);
      console.log('✅ Tabla chapters limpiada correctamente');
    } catch (cleanError) {
      console.warn('⚠️ No se pudo limpiar la tabla chapters:', cleanError.message);
      // Continuar de todos modos, podría ser la primera vez que se ejecuta
    }
    
    // Insertar los chapters
    for (let i = 0; i < chaptersData.length; i++) {
      const chapter = chaptersData[i];
      console.log(`\n🔄 Procesando capítulo ${i + 1}/${chaptersData.length}: ${chapter.title}`);
      
      try {
        console.log('📝 Insertando capítulo...');
        const result = await db.insert(chapters).values({
          ...chapter,
          isPublished: Boolean(chapter.isPublished)
        });
        
        console.log(`✅ Capítulo insertado: ${chapter.title}`);
        console.log('   - ID:', result.insertId || 'No disponible');
      } catch (insertError) {
        console.error(`❌ Error al insertar el capítulo "${chapter.title}":`);
        console.error('   - Mensaje:', insertError.message);
        console.error('   - Código de error:', insertError.code || 'No disponible');
        console.error('   - SQL:', insertError.sql || 'No disponible');
        console.error('   - Stack:', insertError.stack || 'No disponible');
        throw insertError;
      }
    }
    
    console.log('\n🎉 ¡Todos los capítulos se han insertado correctamente!');
    return true;
  } catch (error) {
    console.error('\n❌ Error durante el proceso de seed:');
    console.error('   - Mensaje:', error.message);
    console.error('   - Código de error:', error.code || 'No disponible');
    console.error('   - Stack:', error.stack || 'No disponible');
    throw error;
  }
}

// Forzar la ejecución del seed
console.log('\n🚀 Iniciando ejecución del seed...');
seedChapters()
  .then(() => {
    console.log('\n✨ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 El proceso ha fallado con error:', error.message);
    process.exit(1);
  });

export { seedChapters };
