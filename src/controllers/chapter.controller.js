import { db } from '../db/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { chapters, sections, userChapterProgress } from '../db/schema.js';

/**
 * Obtener todos los capítulos (público)
 */
const getChapters = async (req, res) => {
  try {
    // Obtener los capítulos publicados con el conteo de secciones
    const chaptersResult = await db
      .select({
        id: chapters.id,
        title: chapters.title,
        description: chapters.description,
        order: chapters.order,
        duration: chapters.duration,
        videoUrl: chapters.videoUrl,
        isPublished: chapters.isPublished,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
        sectionsCount: sql`(SELECT COUNT(*) FROM ${sections} WHERE ${sections.chapterId} = ${chapters.id})`.as('sectionsCount')
      })
      .from(chapters)
      .where(eq(chapters.isPublished, true))
      .orderBy(chapters.order);

    res.json(chaptersResult);
  } catch (error) {
    console.error('Error al obtener capítulos:', error);
    res.status(500).json({ message: 'Error al obtener los capítulos', error: error.message });
  }
};

/**
 * Obtener un capítulo por ID con sus secciones
 */
const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Obtener el capítulo
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, id));

    if (!chapter) {
      return res.status(404).json({ message: 'Capítulo no encontrado' });
    }

    // Si el capítulo no está publicado y el usuario no es administrador
    if (!chapter.isPublished && (!req.user || req.user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Este capítulo no está disponible' });
    }

    // Obtener las secciones del capítulo
    const chapterSections = await db
      .select({
        id: sections.id,
        title: sections.title,
        content: sections.content,
        order: sections.order,
        createdAt: sections.createdAt,
        updatedAt: sections.updatedAt
      })
      .from(sections)
      .where(eq(sections.chapterId, id))
      .orderBy(sections.order);

    // Obtener el progreso del usuario si está autenticado
    let userProgress = null;
    if (userId) {
      [userProgress] = await db
        .select()
        .from(userChapterProgress)
        .where(
          and(
            eq(userChapterProgress.userId, userId),
            eq(userChapterProgress.chapterId, id)
          )
        );
    }

    // Preparar la respuesta
    const response = {
      ...chapter,
      sections: chapterSections,
      progress: userProgress ? [userProgress] : [],
      _count: {
        sections: chapterSections.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener el capítulo:', error);
    res.status(500).json({ message: 'Error al obtener el capítulo', error: error.message });
  }
};

/**
 * Actualizar el progreso del capítulo (protegido)
 */
const updateChapterProgress = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const { chapterId } = req.params;
    const { isCompleted, progress, videoProgress } = req.body;

    // Validar que el progreso esté entre 0 y 1
    if (progress && (progress < 0 || progress > 1)) {
      return res.status(400).json({ message: 'El progreso debe estar entre 0 y 1' });
    }

    // Verificar si ya existe un progreso para este usuario y capítulo
    const [existingProgress] = await db
      .select()
      .from(userChapterProgress)
      .where(
        and(
          eq(userChapterProgress.userId, req.user.id),
          eq(userChapterProgress.chapterId, chapterId)
        )
      )
      .limit(1);

    let updatedProgress;
    if (existingProgress) {
      // Actualizar progreso existente
      const [result] = await db
        .update(userChapterProgress)
        .set({
          isCompleted: isCompleted !== undefined ? isCompleted : existingProgress.isCompleted,
          progress: progress !== undefined ? progress : existingProgress.progress,
          videoProgress: videoProgress !== undefined ? videoProgress : existingProgress.videoProgress,
          lastPlayedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userChapterProgress.userId, req.user.id),
            eq(userChapterProgress.chapterId, chapterId)
          )
        )
        .returning();
      
      updatedProgress = result;
    } else {
      // Crear nuevo progreso
      const [result] = await db
        .insert(userChapterProgress)
        .values({
          userId: req.user.id,
          chapterId,
          isCompleted: isCompleted || false,
          progress: progress || 0,
          videoProgress: videoProgress || 0,
          lastPlayedAt: new Date()
        })
        .returning();
      
      updatedProgress = result;
    }

    res.json(updatedProgress);
  } catch (error) {
    console.error('Error al actualizar el progreso:', error);
    res.status(500).json({ 
      message: 'Error al actualizar el progreso',
      error: error.message 
    });
  }
};

/**
 * Obtener el progreso del usuario (protegido)
 */
const getUserProgress = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const progress = await db
      .select({
        id: userChapterProgress.id,
        isCompleted: userChapterProgress.isCompleted,
        progress: userChapterProgress.progress,
        videoProgress: userChapterProgress.videoProgress,
        lastPlayedAt: userChapterProgress.lastPlayedAt,
        chapter: {
          id: chapters.id,
          title: chapters.title,
          order: chapters.order
        }
      })
      .from(userChapterProgress)
      .leftJoin(
        chapters,
        eq(userChapterProgress.chapterId, chapters.id)
      )
      .where(eq(userChapterProgress.userId, req.user.id))
      .orderBy(chapters.order);

    res.json(progress);
  } catch (error) {
    console.error('Error al obtener el progreso:', error);
    res.status(500).json({ 
      message: 'Error al obtener el progreso',
      error: error.message 
    });
  }
};

// Exportar las funciones del controlador
export {
  getChapters,
  getChapterById,
  updateChapterProgress,
  getUserProgress
};
