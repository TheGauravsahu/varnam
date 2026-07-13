import { db } from '../db/index.js';
import { languages, units, chapters, lessons, exercises, users, achievements, dailyQuests, weeklyMissions, seasonalEvents, avatarItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import * as seedData from '../db/seedData.js';
import { redisService } from '../services/redisService.js';

// Centralized cache invalidation helper
async function invalidateAdminCaches(type) {
  try {
    await redisService.del(`cache:admin:${type}`);
    await redisService.del('cache:admin:stats');
    await redisService.delPattern('cache:dashboard:user:*');
  } catch (err) {
    console.error('Failed to invalidate admin cache:', err.message);
  }
}

export const adminController = {
  // Seed DB Trigger
  async handleSeed(request, reply) {
    const { track = 'all' } = request.body || {};
    try {
      console.log(`🌱 Seeding Neon Database (track: ${track})...`);

      // 1. Seed Achievements (always seeded)
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

      // 2. Seed Languages (always seeded)
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

      // Filter coursework by track
      let targetUnits = [];
      let targetChapters = [];
      let targetLessons = [];
      let targetExercises = [];

      if (track === 'english') {
        // English units: languageId = 2
        targetUnits = seedData.units.filter(u => u.languageId === 2);
        const unitIds = targetUnits.map(u => u.id);
        targetChapters = seedData.chapters.filter(c => unitIds.includes(c.unitId));
        const chapterIds = targetChapters.map(c => c.id);
        targetLessons = seedData.lessons.filter(l => chapterIds.includes(l.chapterId));
        const lessonIds = targetLessons.map(l => l.id);
        targetExercises = seedData.exercises.filter(ex => lessonIds.includes(ex.lessonId));
      } else if (track === 'hindi') {
        // Hindi units: languageId = 3
        targetUnits = seedData.units.filter(u => u.languageId === 3);
        const unitIds = targetUnits.map(u => u.id);
        targetChapters = seedData.chapters.filter(c => unitIds.includes(c.unitId));
        const chapterIds = targetChapters.map(c => c.id);
        targetLessons = seedData.lessons.filter(l => chapterIds.includes(l.chapterId));
        const lessonIds = targetLessons.map(l => l.id);
        targetExercises = seedData.exercises.filter(ex => lessonIds.includes(ex.lessonId));
      } else {
        // Default 'all' - seeds Spanish (languageId 1) and English (languageId 2) default coursework
        targetUnits = seedData.units.filter(u => u.languageId === 1 || u.languageId === 2);
        const unitIds = targetUnits.map(u => u.id);
        targetChapters = seedData.chapters.filter(c => unitIds.includes(c.unitId));
        const chapterIds = targetChapters.map(c => c.id);
        targetLessons = seedData.lessons.filter(l => chapterIds.includes(l.chapterId));
        const lessonIds = targetLessons.map(l => l.id);
        targetExercises = seedData.exercises.filter(ex => lessonIds.includes(ex.lessonId));
      }

      // 3. Seed Units
      for (const u of targetUnits) {
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
      for (const c of targetChapters) {
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
      for (const l of targetLessons) {
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
      for (const ex of targetExercises) {
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

      // Invalidate all cached data on seed
      await redisService.delPattern('cache:*');

      console.log('✅ Seeding completed!');
      return { success: true, message: `Database successfully seeded with the ${track} track curriculum!` };
    } catch (error) {
      request.log.error('Seeding error:', error);
      reply.status(500).send({ error: `Seeding failed: ${error.message}` });
    }
  },

  async getStats(request, reply) {
    const cacheKey = 'cache:admin:stats';
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) return cached;

      const languagesCount = await db.select().from(languages);
      const unitsCount = await db.select().from(units);
      const chaptersCount = await db.select().from(chapters);
      const lessonsCount = await db.select().from(lessons);
      const exercisesCount = await db.select().from(exercises);
      const usersCount = await db.select().from(users);

      const res = {
        success: true,
        counts: {
          languages: languagesCount.length,
          units: unitsCount.length,
          chapters: chaptersCount.length,
          lessons: lessonsCount.length,
          exercises: exercisesCount.length,
          users: usersCount.length
        }
      };
      await redisService.set(cacheKey, res, 120);
      return res;
    } catch (err) {
      request.log.error('Stats fetching error:', err);
      reply.status(500).send({ error: 'Failed to retrieve admin stats.' });
    }
  },

  // ----------------------------------------------------
  // LANGUAGES CRUD
  // ----------------------------------------------------
  async getLanguages(request, reply) {
    const cacheKey = 'cache:admin:languages';
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    const list = await db.select().from(languages);
    const res = { success: true, data: list };
    await redisService.set(cacheKey, res, 600);
    return res;
  },
  async createLanguage(request, reply) {
    const { code, name, flagEmoji, isActive } = request.body || {};
    const [inserted] = await db.insert(languages).values({ code, name, flagEmoji, isActive: isActive ?? true }).returning();
    
    await invalidateAdminCaches('languages');
    
    return { success: true, data: inserted };
  },
  async updateLanguage(request, reply) {
    const id = parseInt(request.params.id);
    const { code, name, flagEmoji, isActive } = request.body || {};
    const [updated] = await db.update(languages).set({ code, name, flagEmoji, isActive }).where(eq(languages.id, id)).returning();
    
    await invalidateAdminCaches('languages');
    
    return { success: true, data: updated };
  },
  async deleteLanguage(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(languages).where(eq(languages.id, id));
    
    await invalidateAdminCaches('languages');
    
    return { success: true, message: 'Language deleted.' };
  },

  // ----------------------------------------------------
  // UNITS CRUD
  // ----------------------------------------------------
  async getUnits(request, reply) {
    const cacheKey = 'cache:admin:units';
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    const list = await db.select().from(units);
    const res = { success: true, data: list };
    await redisService.set(cacheKey, res, 600);
    return res;
  },
  async createUnit(request, reply) {
    const { languageId, number, title, description } = request.body || {};
    const [inserted] = await db.insert(units).values({ languageId: parseInt(languageId), number: parseInt(number), title, description }).returning();
    
    await invalidateAdminCaches('units');
    
    return { success: true, data: inserted };
  },
  async updateUnit(request, reply) {
    const id = parseInt(request.params.id);
    const { languageId, number, title, description } = request.body || {};
    const [updated] = await db.update(units).set({ languageId: parseInt(languageId), number: parseInt(number), title, description }).where(eq(units.id, id)).returning();
    
    await invalidateAdminCaches('units');
    
    return { success: true, data: updated };
  },
  async deleteUnit(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(units).where(eq(units.id, id));
    
    await invalidateAdminCaches('units');
    
    return { success: true, message: 'Unit deleted.' };
  },

  // ----------------------------------------------------
  // CHAPTERS CRUD
  // ----------------------------------------------------
  async getChapters(request, reply) {
    const cacheKey = 'cache:admin:chapters';
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    const list = await db.select().from(chapters);
    const res = { success: true, data: list };
    await redisService.set(cacheKey, res, 600);
    return res;
  },
  async createChapter(request, reply) {
    const { unitId, number, title, description } = request.body || {};
    const [inserted] = await db.insert(chapters).values({ unitId: parseInt(unitId), number: parseInt(number), title, description }).returning();
    
    await invalidateAdminCaches('chapters');
    
    return { success: true, data: inserted };
  },
  async updateChapter(request, reply) {
    const id = parseInt(request.params.id);
    const { unitId, number, title, description } = request.body || {};
    const [updated] = await db.update(chapters).set({ unitId: parseInt(unitId), number: parseInt(number), title, description }).where(eq(chapters.id, id)).returning();
    
    await invalidateAdminCaches('chapters');
    
    return { success: true, data: updated };
  },
  async deleteChapter(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(chapters).where(eq(chapters.id, id));
    
    await invalidateAdminCaches('chapters');
    
    return { success: true, message: 'Chapter deleted.' };
  },

  // ----------------------------------------------------
  // LESSONS CRUD
  // ----------------------------------------------------
  async getLessons(request, reply) {
    const cacheKey = 'cache:admin:lessons';
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    const list = await db.select().from(lessons);
    const res = { success: true, data: list };
    await redisService.set(cacheKey, res, 600);
    return res;
  },
  async createLesson(request, reply) {
    const { chapterId, number, title, xpReward } = request.body || {};
    const [inserted] = await db.insert(lessons).values({ chapterId: parseInt(chapterId), number: parseInt(number), title, xpReward: parseInt(xpReward) }).returning();
    
    await invalidateAdminCaches('lessons');
    
    return { success: true, data: inserted };
  },
  async updateLesson(request, reply) {
    const id = parseInt(request.params.id);
    const { chapterId, number, title, xpReward } = request.body || {};
    const [updated] = await db.update(lessons).set({ chapterId: parseInt(chapterId), number: parseInt(number), title, xpReward: parseInt(xpReward) }).where(eq(lessons.id, id)).returning();
    
    await invalidateAdminCaches('lessons');
    
    return { success: true, data: updated };
  },
  async deleteLesson(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(lessons).where(eq(lessons.id, id));
    
    await invalidateAdminCaches('lessons');
    
    return { success: true, message: 'Lesson deleted.' };
  },

  // ----------------------------------------------------
  // EXERCISES CRUD
  // ----------------------------------------------------
  async getExercises(request, reply) {
    const cacheKey = 'cache:admin:exercises';
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    const list = await db.select().from(exercises);
    const clean = list.map(ex => ({
      ...ex,
      choices: typeof ex.choices === 'string' ? JSON.parse(ex.choices) : ex.choices
    }));
    const res = { success: true, data: clean };
    await redisService.set(cacheKey, res, 600);
    return res;
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
    
    await invalidateAdminCaches('exercises');
    
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
    
    await invalidateAdminCaches('exercises');
    
    return { success: true, data: updated };
  },
  async deleteExercise(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(exercises).where(eq(exercises.id, id));
    
    await invalidateAdminCaches('exercises');
    
    return { success: true, message: 'Exercise deleted.' };
  },

  // ----------------------------------------------------
  // USERS CRUD
  // ----------------------------------------------------
  async getUsers(request, reply) {
    const cacheKey = 'cache:admin:users';
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    const list = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt
    }).from(users);
    
    const res = { success: true, data: list };
    await redisService.set(cacheKey, res, 300);
    return res;
  },
  async updateUser(request, reply) {
    const id = parseInt(request.params.id);
    const { role } = request.body || {};
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    
    await invalidateAdminCaches('users');
    
    return { success: true, data: updated };
  },
  async deleteUser(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(users).where(eq(users.id, id));
    
    await invalidateAdminCaches('users');
    
    return { success: true, message: 'User deleted.' };
  },

  // ─── DAILY QUESTS CRUD ───────────────────────────────────────────────────────
  async getQuests(request, reply) {
    const list = await db.select().from(dailyQuests);
    return { success: true, data: list };
  },
  async createQuest(request, reply) {
    const body = request.body || {};
    const [inserted] = await db.insert(dailyQuests).values({
      code: body.code,
      title: body.title,
      description: body.description,
      icon: body.icon || 'target',
      xpReward: parseInt(body.xpReward || 50),
      coinReward: parseInt(body.coinReward || 20),
      targetCount: parseInt(body.targetCount || 1),
      questType: body.questType || 'lesson',
      isActive: body.isActive !== false
    }).returning();
    await invalidateAdminCaches('quests');
    return { success: true, data: inserted };
  },
  async updateQuest(request, reply) {
    const id = parseInt(request.params.id);
    const body = request.body || {};
    const [updated] = await db.update(dailyQuests).set({
      code: body.code,
      title: body.title,
      description: body.description,
      icon: body.icon,
      xpReward: body.xpReward !== undefined ? parseInt(body.xpReward) : undefined,
      coinReward: body.coinReward !== undefined ? parseInt(body.coinReward) : undefined,
      targetCount: body.targetCount !== undefined ? parseInt(body.targetCount) : undefined,
      questType: body.questType,
      isActive: body.isActive
    }).where(eq(dailyQuests.id, id)).returning();
    await invalidateAdminCaches('quests');
    return { success: true, data: updated };
  },
  async deleteQuest(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(dailyQuests).where(eq(dailyQuests.id, id));
    await invalidateAdminCaches('quests');
    return { success: true, message: 'Quest deleted.' };
  },

  // ─── WEEKLY MISSIONS CRUD ────────────────────────────────────────────────────
  async getMissions(request, reply) {
    const list = await db.select().from(weeklyMissions);
    return { success: true, data: list };
  },
  async createMission(request, reply) {
    const body = request.body || {};
    const [inserted] = await db.insert(weeklyMissions).values({
      code: body.code,
      title: body.title,
      description: body.description,
      xpRequired: parseInt(body.xpRequired || 1500),
      reward: typeof body.reward === 'string' ? JSON.parse(body.reward) : (body.reward || {}),
      isActive: body.isActive !== false
    }).returning();
    await invalidateAdminCaches('missions');
    return { success: true, data: inserted };
  },
  async updateMission(request, reply) {
    const id = parseInt(request.params.id);
    const body = request.body || {};
    const [updated] = await db.update(weeklyMissions).set({
      code: body.code,
      title: body.title,
      description: body.description,
      xpRequired: body.xpRequired !== undefined ? parseInt(body.xpRequired) : undefined,
      reward: body.reward ? (typeof body.reward === 'string' ? JSON.parse(body.reward) : body.reward) : undefined,
      isActive: body.isActive
    }).where(eq(weeklyMissions.id, id)).returning();
    await invalidateAdminCaches('missions');
    return { success: true, data: updated };
  },
  async deleteMission(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(weeklyMissions).where(eq(weeklyMissions.id, id));
    await invalidateAdminCaches('missions');
    return { success: true, message: 'Mission deleted.' };
  },

  // ─── SEASONAL EVENTS CRUD ────────────────────────────────────────────────────
  async getEvents(request, reply) {
    const list = await db.select().from(seasonalEvents);
    return { success: true, data: list };
  },
  async createEvent(request, reply) {
    const body = request.body || {};
    const [inserted] = await db.insert(seasonalEvents).values({
      code: body.code,
      name: body.name,
      description: body.description,
      emoji: body.emoji || '🎉',
      themeColor: body.themeColor || 'from-pink-500 to-rose-500',
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      lessonsRequired: parseInt(body.lessonsRequired || 5),
      rewardItem: body.rewardItem,
      isActive: body.isActive !== false
    }).returning();
    await invalidateAdminCaches('events');
    return { success: true, data: inserted };
  },
  async updateEvent(request, reply) {
    const id = parseInt(request.params.id);
    const body = request.body || {};
    const [updated] = await db.update(seasonalEvents).set({
      code: body.code,
      name: body.name,
      description: body.description,
      emoji: body.emoji,
      themeColor: body.themeColor,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      lessonsRequired: body.lessonsRequired !== undefined ? parseInt(body.lessonsRequired) : undefined,
      rewardItem: body.rewardItem,
      isActive: body.isActive
    }).where(eq(seasonalEvents.id, id)).returning();
    await invalidateAdminCaches('events');
    return { success: true, data: updated };
  },
  async deleteEvent(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(seasonalEvents).where(eq(seasonalEvents.id, id));
    await invalidateAdminCaches('events');
    return { success: true, message: 'Event deleted.' };
  },

  // ─── AVATAR ITEMS CRUD ───────────────────────────────────────────────────────
  async getAvatarItems(request, reply) {
    const list = await db.select().from(avatarItems);
    return { success: true, data: list };
  },
  async createAvatarItem(request, reply) {
    const body = request.body || {};
    const [inserted] = await db.insert(avatarItems).values({
      code: body.code,
      name: body.name,
      category: body.category,
      imageUrl: body.imageUrl,
      emoji: body.emoji || '🤠',
      rarity: body.rarity || 'common',
      unlockCondition: body.unlockCondition,
      unlockType: body.unlockType || 'achievement',
      coinCost: parseInt(body.coinCost || 0),
      isDefault: body.isDefault === true,
      sortOrder: parseInt(body.sortOrder || 0)
    }).returning();
    await invalidateAdminCaches('avatar-items');
    return { success: true, data: inserted };
  },
  async updateAvatarItem(request, reply) {
    const id = parseInt(request.params.id);
    const body = request.body || {};
    const [updated] = await db.update(avatarItems).set({
      code: body.code,
      name: body.name,
      category: body.category,
      imageUrl: body.imageUrl,
      emoji: body.emoji,
      rarity: body.rarity,
      unlockCondition: body.unlockCondition,
      unlockType: body.unlockType,
      coinCost: body.coinCost !== undefined ? parseInt(body.coinCost) : undefined,
      isDefault: body.isDefault,
      sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder) : undefined
    }).where(eq(avatarItems.id, id)).returning();
    await invalidateAdminCaches('avatar-items');
    return { success: true, data: updated };
  },
  async deleteAvatarItem(request, reply) {
    const id = parseInt(request.params.id);
    await db.delete(avatarItems).where(eq(avatarItems.id, id));
    await invalidateAdminCaches('avatar-items');
    return { success: true, message: 'Avatar item deleted.' };
  }
};
