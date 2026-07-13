import { db } from './index.js';
import { languages, units, chapters, lessons, exercises, achievements } from './schema.js';
import { eq } from 'drizzle-orm';
import * as seedData from './seedData.js';

async function seed() {
  console.log('🌱 Starting standalone seeding script on Neon cloud DB...');
  
  try {
    // 1. Seed Achievements
    console.log(' - Seeding Achievements...');
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
    console.log(' - Seeding Languages...');
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
    console.log(' - Seeding Units...');
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
    console.log(' - Seeding Chapters...');
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
    console.log(' - Seeding Lessons...');
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
    console.log(' - Seeding Exercises...');
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

    console.log('✅ Seeding Standalone Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Standalone seeding script failed:', error);
    process.exit(1);
  }
}

seed();
