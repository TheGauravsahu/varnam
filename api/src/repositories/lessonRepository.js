import { db } from '../db/index.js';
import { languages, units, chapters, lessons, exercises } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

export const lessonRepository = {
  async getLanguages() {
    return await db.select().from(languages).where(eq(languages.isActive, true));
  },

  async getLanguageByCode(code) {
    const results = await db.select().from(languages).where(eq(languages.code, code)).limit(1);
    return results[0] || null;
  },

  async getUnits(languageId) {
    const langIdNum = parseInt(languageId);
    return await db.select().from(units).where(eq(units.languageId, langIdNum)).orderBy(asc(units.number));
  },

  async getChapters(unitId) {
    const unitIdNum = parseInt(unitId);
    return await db.select().from(chapters).where(eq(chapters.unitId, unitIdNum)).orderBy(asc(chapters.number));
  },

  async getLessons(chapterId) {
    const chapIdNum = parseInt(chapterId);
    return await db.select().from(lessons).where(eq(lessons.chapterId, chapIdNum)).orderBy(asc(lessons.number));
  },

  async getLessonById(lessonId) {
    const lessonIdNum = parseInt(lessonId);
    const results = await db.select().from(lessons).where(eq(lessons.id, lessonIdNum)).limit(1);
    return results[0] || null;
  },

  async getExercises(lessonId) {
    const lessonIdNum = parseInt(lessonId);
    return await db.select().from(exercises).where(eq(exercises.lessonId, lessonIdNum)).orderBy(asc(exercises.order));
  },

  // CMS/Admin insertions
  async createLanguage({ code, name, flagEmoji }) {
    const [inserted] = await db.insert(languages).values({ code, name, flagEmoji }).returning();
    return inserted;
  },

  async createUnit({ languageId, number, title, description }) {
    const langIdNum = parseInt(languageId);
    const [inserted] = await db.insert(units).values({
      languageId: langIdNum,
      number: parseInt(number),
      title,
      description
    }).returning();
    return inserted;
  },

  async createChapter({ unitId, number, title, description }) {
    const unitIdNum = parseInt(unitId);
    const [inserted] = await db.insert(chapters).values({
      unitId: unitIdNum,
      number: parseInt(number),
      title,
      description
    }).returning();
    return inserted;
  },

  async createLesson({ chapterId, number, title, xpReward }) {
    const chapIdNum = parseInt(chapterId);
    const [inserted] = await db.insert(lessons).values({
      chapterId: chapIdNum,
      number: parseInt(number),
      title,
      xpReward: parseInt(xpReward || 10)
    }).returning();
    return inserted;
  },

  async createExercise({ lessonId, type, instruction, questionText, correctAnswer, choices, order }) {
    const lessonIdNum = parseInt(lessonId);
    const [inserted] = await db.insert(exercises).values({
      lessonId: lessonIdNum,
      type,
      instruction,
      questionText,
      correctAnswer,
      choices: typeof choices === 'string' ? JSON.parse(choices) : choices,
      order: parseInt(order || 0)
    }).returning();
    return inserted;
  }
};
export default lessonRepository;
