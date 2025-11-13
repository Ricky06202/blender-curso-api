import { db } from '../db/index.js';
import { chapters } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

/**
 * Obtener todos los capítulos (público)
 */
const getChapters = async (req, res) => {
  try {
    const result = await db
      .select()
      .from(chapters)
      .where(eq(chapters.isPublished, true))
      .orderBy(asc(chapters.order));

    res.json(result);
  } catch (error) {
    console.error('Error al obtener capítulos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los capítulos',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * Obtener un capítulo por su ID (público)
 */
const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Capítulo no encontrado' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error al obtener el capítulo:', error);
    res.status(500).json({ 
      error: 'Error al obtener el capítulo',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

export {
  getChapters,
  getChapterById
};