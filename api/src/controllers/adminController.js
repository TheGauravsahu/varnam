import { db } from '../db/index.js';
import { users, profiles, userProgress, exercises, languages, units, chapters, lessons, achievements } from '../db/schema.js';
import { count, eq } from 'drizzle-orm';
import * as seedData from '../db/seedData.js';

export const adminController = {
  // Stats Counters
  async getStats(request, reply) {
    try {
      const [uRes] = await db.select({ value: count() }).from(users);
      const [pRes] = await db.select({ value: count() }).from(userProgress);
      const [eRes] = await db.select({ value: count() }).from(exercises);

      return {
        success: true,
        stats: {
          users: uRes?.value || 0,
          completions: pRes?.value || 0,
          exercises: eRes?.value || 0
        }
      };
    } catch (error) {
      request.log.error('Admin stats error:', error);
      reply.status(500).send({ error: 'Failed to load admin stats.' });
    }
  },

  // Seed DB Trigger
  async handleSeed(request, reply) {
    try {
      console.log('🌱 Seeding Neon Database...');

      // 1. Seed Achievements
      for (const ach of seedData.achievements) {
        const exists = await db.select().from(achievements).where(eq(achievements.code, ach.code)).limit(1);
        if (exists.length === 0) {
          await db.insert(achievements).values({
            code: ach.code,
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
            xpReward: ach.xpReward,
            coinReward: ach.coinReward
          });
        }
      }

      // 2. Seed Languages
      for (const lang of seedData.languages) {
        const exists = await db.select().from(languages).where(eq(languages.code, lang.code)).limit(1);
        if (exists.length === 0) {
          await db.insert(languages).values({
            id: lang.id,
            code: lang.code,
            name: lang.name,
            flagEmoji: lang.flagEmoji,
            isActive: lang.isActive
          });
        }
      }

      // 3. Seed Units
      for (const u of seedData.units) {
        const exists = await db.select().from(units).where(eq(units.id, u.id)).limit(1);
        if (exists.length === 0) {
          await db.insert(units).values({
            id: u.id,
            languageId: u.languageId,
            number: u.number,
            title: u.title,
            description: u.description
          });
        }
      }

      // 4. Seed Chapters
      for (const c of seedData.chapters) {
        const exists = await db.select().from(chapters).where(eq(chapters.id, c.id)).limit(1);
        if (exists.length === 0) {
          await db.insert(chapters).values({
            id: c.id,
            unitId: c.unitId,
            number: c.number,
            title: c.title,
            description: c.description
          });
        }
      }

      // 5. Seed Lessons
      for (const l of seedData.lessons) {
        const exists = await db.select().from(lessons).where(eq(lessons.id, l.id)).limit(1);
        if (exists.length === 0) {
          await db.insert(lessons).values({
            id: l.id,
            chapterId: l.chapterId,
            number: l.number,
            title: l.title,
            xpReward: l.xpReward
          });
        }
      }

      // 6. Seed Exercises
      for (const ex of seedData.exercises) {
        const exists = await db.select().from(exercises).where(eq(exercises.id, ex.id)).limit(1);
        if (exists.length === 0) {
          await db.insert(exercises).values({
            id: ex.id,
            lessonId: ex.lessonId,
            type: ex.type,
            instruction: ex.instruction,
            questionText: ex.questionText,
            correctAnswer: ex.correctAnswer,
            choices: ex.choices,
            order: ex.order
          });
        }
      }

      console.log('✅ Seeding completed!');
      return { success: true, message: 'Database successfully seeded with English and Spanish curricula!' };
    } catch (error) {
      request.log.error('Seeding error:', error);
      reply.status(500).send({ error: `Seeding failed: ${error.message}` });
    }
  },

  // ----------------------------------------------------
  // LANGUAGES CRUD
  // ----------------------------------------------------
  async getLanguages(request, reply) {
    const list = await db.select().from(languages);
    return { success: true, data: list };
  },
  async createLanguage(request, reply) {
    const { code, name, flagEmoji, isActive } = request.body || {};
    const [inserted] = await db.insert(languages).values({ code, name, flagEmoji, isActive: isActive ?? true }).returning();
    return { success: true, data: inserted };
  },
  async updateLanguage(request, reply) {
    const id = parseInt(request.params.id);
    const { code, name, flagEmoji, isActive } = request.body || {};
    const [updated] = await db.update(languages).set({ code, name, flagEmoji, isActive }).where(eq(languages.id, id)).returning();
    return { success: true, data: updated };
  },
  async deleteLanguage(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(languages).where(eq(languages.id, id));
    return { success: true, message: 'Language deleted.' };
  },

  // ----------------------------------------------------
  // UNITS CRUD
  // ----------------------------------------------------
  async getUnits(request, reply) {
    const list = await db.select().from(units);
    return { success: true, data: list };
  },
  async createUnit(request, reply) {
    const { languageId, number, title, description } = request.body || {};
    const [inserted] = await db.insert(units).values({ languageId: parseInt(languageId), number: parseInt(number), title, description }).returning();
    return { success: true, data: inserted };
  },
  async updateUnit(request, reply) {
    const id = parseInt(request.params.id);
    const { languageId, number, title, description } = request.body || {};
    const [updated] = await db.update(units).set({ languageId: parseInt(languageId), number: parseInt(number), title, description }).where(eq(units.id, id)).returning();
    return { success: true, data: updated };
  },
  async deleteUnit(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(units).where(eq(units.id, id));
    return { success: true, message: 'Unit deleted.' };
  },

  // ----------------------------------------------------
  // CHAPTERS CRUD
  // ----------------------------------------------------
  async getChapters(request, reply) {
    const list = await db.select().from(chapters);
    return { success: true, data: list };
  },
  async createChapter(request, reply) {
    const { unitId, number, title, description } = request.body || {};
    const [inserted] = await db.insert(chapters).values({ unitId: parseInt(unitId), number: parseInt(number), title, description }).returning();
    return { success: true, data: inserted };
  },
  async updateChapter(request, reply) {
    const id = parseInt(request.params.id);
    const { unitId, number, title, description } = request.body || {};
    const [updated] = await db.update(chapters).set({ unitId: parseInt(unitId), number: parseInt(number), title, description }).where(eq(chapters.id, id)).returning();
    return { success: true, data: updated };
  },
  async deleteChapter(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(chapters).where(eq(chapters.id, id));
    return { success: true, message: 'Chapter deleted.' };
  },

  // ----------------------------------------------------
  // LESSONS CRUD
  // ----------------------------------------------------
  async getLessons(request, reply) {
    const list = await db.select().from(lessons);
    return { success: true, data: list };
  },
  async createLesson(request, reply) {
    const { chapterId, number, title, xpReward } = request.body || {};
    const [inserted] = await db.insert(lessons).values({ chapterId: parseInt(chapterId), number: parseInt(number), title, xpReward: parseInt(xpReward) }).returning();
    return { success: true, data: inserted };
  },
  async updateLesson(request, reply) {
    const id = parseInt(request.params.id);
    const { chapterId, number, title, xpReward } = request.body || {};
    const [updated] = await db.update(lessons).set({ chapterId: parseInt(chapterId), number: parseInt(number), title, xpReward: parseInt(xpReward) }).where(eq(lessons.id, id)).returning();
    return { success: true, data: updated };
  },
  async deleteLesson(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(lessons).where(eq(lessons.id, id));
    return { success: true, message: 'Lesson deleted.' };
  },

  // ----------------------------------------------------
  // EXERCISES CRUD
  // ----------------------------------------------------
  async getExercises(request, reply) {
    const list = await db.select().from(exercises);
    const clean = list.map(ex => ({
      ...ex,
      choices: typeof ex.choices === 'string' ? JSON.parse(ex.choices) : ex.choices
    }));
    return { success: true, data: clean };
  },
  async createExercise(request, reply) {
    const { lessonId, type, instruction, questionText, correctAnswer, choices, order } = request.body || {};
    const parsedChoices = typeof choices === 'string' ? JSON.parse(choices) : choices;
    const [inserted] = await db.insert(exercises).values({
      lessonId: parseInt(lessonId),
      type,
      instruction,
      questionText,
      correctAnswer,
      choices: parsedChoices,
      order: parseInt(order || 0)
    }).returning();
    return { success: true, data: inserted };
  },
  async updateExercise(request, reply) {
    const id = parseInt(request.params.id);
    const { lessonId, type, instruction, questionText, correctAnswer, choices, order } = request.body || {};
    const parsedChoices = typeof choices === 'string' ? JSON.parse(choices) : choices;
    const [updated] = await db.update(exercises).set({
      lessonId: parseInt(lessonId),
      type,
      instruction,
      questionText,
      correctAnswer,
      choices: parsedChoices,
      order: parseInt(order || 0)
    }).where(eq(exercises.id, id)).returning();
    return { success: true, data: updated };
  },
  async deleteExercise(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(exercises).where(eq(exercises.id, id));
    return { success: true, message: 'Exercise deleted.' };
  },

  // ----------------------------------------------------
  // USERS CRUD
  // ----------------------------------------------------
  async getUsers(request, reply) {
    const list = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt
    }).from(users);
    return { success: true, data: list };
  },
  async updateUser(request, reply) {
    const id = parseInt(request.params.id);
    const { role } = request.body || {};
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return { success: true, data: updated };
  },
  async deleteUser(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(users).where(eq(users.id, id));
    return { success: true, message: 'User deleted.' };
  }
};
