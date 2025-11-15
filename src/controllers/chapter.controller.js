import { db } from '../db/index.js';
import { chapters, userChapterProgress } from '../db/schema.js';
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

/**
 * Obtener el progreso del usuario actual
 */
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await db
      .select({
        id: userChapterProgress.id,
        chapterId: userChapterProgress.chapterId,
        isCompleted: userChapterProgress.isCompleted,
        completedAt: userChapterProgress.completedAt,
        lastPlayedAt: userChapterProgress.lastPlayedAt,
        progress: userChapterProgress.progress,
        videoProgress: userChapterProgress.videoProgress,
        chapter: {
          id: chapters.id,
          title: chapters.title,
          description: chapters.description,
          videoUrl: chapters.videoUrl,
          duration: chapters.duration
        }
      })
      .from(userChapterProgress)
      .leftJoin(chapters, eq(userChapterProgress.chapterId, chapters.id))
      .where(eq(userChapterProgress.userId, userId));

    res.json({
      progress,
      totalChapters: progress.length,
      completedChapters: progress.filter(p => p.isCompleted).length,
      overallProgress: progress.length > 0 
        ? (progress.filter(p => p.isCompleted).length / progress.length) * 100 
        : 0
    });
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({ 
      error: 'Error al obtener progreso',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * Marcar un capítulo como visto (crear o actualizar registro)
 */
const markChapterAsWatched = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    // Verificar que el capítulo existe
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, parseInt(chapterId)))
      .limit(1);

    if (!chapter) {
      return res.status(404).json({ error: 'Capítulo no encontrado' });
    }

    // Verificar si ya existe progreso para este capítulo
    const [existingProgress] = await db
      .select()
      .from(userChapterProgress)
      .where(eq(userChapterProgress.userId, userId))
      .where(eq(userChapterProgress.chapterId, parseInt(chapterId)))
      .limit(1);

    if (existingProgress) {
      // Si ya existe, actualizamos el lastPlayedAt
      await db
        .update(userChapterProgress)
        .set({ 
          lastPlayedAt: new Date(),
          isCompleted: true,
          completedAt: new Date()
        })
        .where(eq(userChapterProgress.id, existingProgress.id));

      return res.json({
        message: 'Capítulo marcado como visto (actualizado)',
        chapterId: parseInt(chapterId),
        action: 'updated'
      });
    } else {
      // Si no existe, creamos nuevo registro
      await db
        .insert(userChapterProgress)
        .values({
          userId,
          chapterId: parseInt(chapterId),
          isCompleted: true,
          progress: 100,
          videoProgress: 0,
          lastPlayedAt: new Date(),
          completedAt: new Date()
        });

      return res.json({
        message: 'Capítulo marcado como visto (nuevo)',
        chapterId: parseInt(chapterId),
        action: 'created'
      });
    }
  } catch (error) {
    console.error('Error al marcar capítulo como visto:', error);
    res.status(500).json({ 
      error: 'Error al marcar capítulo como visto',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * Eliminar el progreso de un capítulo
 */
const removeChapterProgress = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    // Buscar y eliminar el progreso del capítulo
    const deletedProgress = await db
      .delete(userChapterProgress)
      .where(eq(userChapterProgress.userId, userId))
      .where(eq(userChapterProgress.chapterId, parseInt(chapterId)));

    if (deletedProgress.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'No se encontró progreso para este capítulo' 
      });
    }

    res.json({
      message: 'Progreso del capítulo eliminado exitosamente',
      chapterId: parseInt(chapterId)
    });
  } catch (error) {
    console.error('Error al eliminar progreso:', error);
    res.status(500).json({ 
      error: 'Error al eliminar progreso',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

export {
  getChapters,
  getChapterById,
  getUserProgress,
  markChapterAsWatched,
  removeChapterProgress
};