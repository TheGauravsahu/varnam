/**
 * seedGamification.js
 *
 * Idempotent seed script for all gamification reference data.
 * Uses onConflictDoNothing() on unique code/name columns so it is safe to
 * run multiple times without duplicating rows.
 *
 * Run with:
 *   node src/db/seedGamification.js
 */

import { db } from './index.js';
import {
  dailyQuests,
  weeklyMissions,
  seasonalEvents,
  themes,
  avatarItems,
  users,
  vocabularyNotebook,
  flashcardReviews,
} from './schema.js';
import { eq } from 'drizzle-orm';

// ─── 1. DAILY QUEST DEFINITIONS ───────────────────────────────────────────────

const DAILY_QUEST_SEEDS = [
  {
    code: 'complete_3_lessons',
    title: 'Lesson Streak',
    description: 'Complete 3 lessons today to earn bonus rewards.',
    icon: 'book-open',
    xpReward: 75,
    coinReward: 30,
    targetCount: 3,
    questType: 'lesson',
    isActive: true,
  },
  {
    code: 'earn_50_xp',
    title: 'XP Hunter',
    description: 'Earn at least 50 XP from any activity today.',
    icon: 'zap',
    xpReward: 50,
    coinReward: 20,
    targetCount: 50,
    questType: 'xp',
    isActive: true,
  },
  {
    code: 'maintain_streak',
    title: 'Streak Keeper',
    description: "Don't break your streak — complete at least one lesson today.",
    icon: 'flame',
    xpReward: 40,
    coinReward: 15,
    targetCount: 1,
    questType: 'streak',
    isActive: true,
  },
];

// ─── 2. WEEKLY MISSION DEFINITIONS ────────────────────────────────────────────

const WEEKLY_MISSION_SEEDS = [
  {
    code: 'weekly_xp_1500',
    title: 'Weekly Champion',
    description: 'Earn 1,500 XP this week to unlock a golden chest.',
    xpRequired: 1500,
    reward: { type: 'golden_chest', xp: 500, coins: 200 },
    isActive: true,
  },
];

// ─── 3. SEASONAL EVENTS ───────────────────────────────────────────────────────

const SEASONAL_EVENT_SEEDS = [
  {
    code: 'diwali_2025',
    name: 'Diwali Festival of Light',
    description: 'Celebrate Diwali by completing lessons and collecting diyas! Earn a special Diwali avatar frame.',
    emoji: '🪔',
    themeColor: '#F59E0B',
    startDate: new Date('2025-10-15T00:00:00Z'),
    endDate: new Date('2025-11-15T23:59:59Z'),
    lessonsRequired: 10,
    rewardItem: 'diwali_avatar_frame',
    isActive: true,
  },
  {
    code: 'christmas_2025',
    name: 'Christmas Special',
    description: 'Spread holiday cheer! Complete festive challenges and unlock a Christmas avatar bundle.',
    emoji: '🎄',
    themeColor: '#16A34A',
    startDate: new Date('2025-12-20T00:00:00Z'),
    endDate: new Date('2025-12-31T23:59:59Z'),
    lessonsRequired: 5,
    rewardItem: 'santa_hat_avatar',
    isActive: true,
  },
  {
    code: 'new_year_2026',
    name: 'New Year 2026 Blitz',
    description: 'Start the new year strong! 8-day challenge with exclusive fireworks avatar background.',
    emoji: '🎆',
    themeColor: '#7C3AED',
    startDate: new Date('2025-12-28T00:00:00Z'),
    endDate: new Date('2026-01-08T23:59:59Z'),
    lessonsRequired: 8,
    rewardItem: 'fireworks_background',
    isActive: true,
  },
  {
    code: 'holi_2026',
    name: 'Holi - Festival of Colors',
    description: 'Play Holi with vocabulary! Collect color splashes by completing lessons all month.',
    emoji: '🌈',
    themeColor: '#EC4899',
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: new Date('2026-03-31T23:59:59Z'),
    lessonsRequired: 12,
    rewardItem: 'holi_colors_background',
    isActive: true,
  },
  {
    code: 'independence_day_2026',
    name: 'Independence Day Challenge',
    description: 'Celebrate with a patriotic learning sprint! Unlock the tricolor avatar border.',
    emoji: '🇮🇳',
    themeColor: '#FF6600',
    startDate: new Date('2026-08-01T00:00:00Z'),
    endDate: new Date('2026-08-20T23:59:59Z'),
    lessonsRequired: 7,
    rewardItem: 'tricolor_avatar_border',
    isActive: true,
  },
];

// ─── 4. THEMES ────────────────────────────────────────────────────────────────

const THEME_SEEDS = [
  {
    code: 'default',
    name: 'Rose (Default)',
    emoji: '🌸',
    primaryColor: '#F43F5E',
    secondaryColor: '#FB7185',
    unlockCondition: null,
    isDefault: true,
  },
  {
    code: 'violet',
    name: 'Violet',
    emoji: '💜',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    unlockCondition: 'Reach Silver League',
    isDefault: false,
  },
  {
    code: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    primaryColor: '#1E1B4B',
    secondaryColor: '#4338CA',
    unlockCondition: 'Complete 50 lessons',
    isDefault: false,
  },
  {
    code: 'sakura',
    name: 'Sakura',
    emoji: '🌺',
    primaryColor: '#FDA4AF',
    secondaryColor: '#FECDD3',
    unlockCondition: 'Maintain a 7-day streak',
    isDefault: false,
  },
  {
    code: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    primaryColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    unlockCondition: 'Earn 1,000 total XP',
    isDefault: false,
  },
  {
    code: 'emerald',
    name: 'Emerald',
    emoji: '💚',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
    unlockCondition: 'Spin the wheel 10 times',
    isDefault: false,
  },
  {
    code: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '⚡',
    primaryColor: '#F59E0B',
    secondaryColor: '#FCD34D',
    unlockCondition: 'Reach Gold League',
    isDefault: false,
  },
];

// ─── 5. AVATAR ITEMS ──────────────────────────────────────────────────────────

const AVATAR_ITEM_SEEDS = [
  // ── Hair (4) ──────────────────────────────────────────────────────────────
  {
    code: 'hair_default_black',
    name: 'Natural Black',
    category: 'hair',
    emoji: '🖤',
    rarity: 'common',
    unlockCondition: 'Default',
    unlockType: 'default',
    coinCost: 0,
    isDefault: true,
    sortOrder: 1,
  },
  {
    code: 'hair_ponytail',
    name: 'Ponytail',
    category: 'hair',
    emoji: '🎀',
    rarity: 'common',
    unlockCondition: 'Purchase for 100 coins',
    unlockType: 'purchase',
    coinCost: 100,
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: 'hair_curly_brown',
    name: 'Curly Brunette',
    category: 'hair',
    emoji: '🟫',
    rarity: 'rare',
    unlockCondition: 'Reach Gold League',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 3,
  },
  {
    code: 'hair_silver_streak',
    name: 'Silver Streak',
    category: 'hair',
    emoji: '⚪',
    rarity: 'epic',
    unlockCondition: 'Maintain a 30-day streak',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 4,
  },

  // ── Clothes (5) ───────────────────────────────────────────────────────────
  {
    code: 'clothes_default_tshirt',
    name: 'Classic T-Shirt',
    category: 'clothes',
    emoji: '👕',
    rarity: 'common',
    unlockCondition: 'Default',
    unlockType: 'default',
    coinCost: 0,
    isDefault: true,
    sortOrder: 1,
  },
  {
    code: 'clothes_kurta',
    name: 'Traditional Kurta',
    category: 'clothes',
    emoji: '🧥',
    rarity: 'common',
    unlockCondition: 'Complete first lesson',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: 'clothes_hoodie',
    name: 'Study Hoodie',
    category: 'clothes',
    emoji: '🧣',
    rarity: 'rare',
    unlockCondition: 'Purchase for 150 coins',
    unlockType: 'purchase',
    coinCost: 150,
    isDefault: false,
    sortOrder: 3,
  },
  {
    code: 'clothes_graduation_gown',
    name: 'Graduation Gown',
    category: 'clothes',
    emoji: '🎓',
    rarity: 'epic',
    unlockCondition: 'Complete 100 lessons',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 4,
  },
  {
    code: 'clothes_galaxy_suit',
    name: 'Galaxy Suit',
    category: 'clothes',
    emoji: '🌌',
    rarity: 'legendary',
    unlockCondition: 'Win the weekly leaderboard',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 5,
  },

  // ── Pets (4) ──────────────────────────────────────────────────────────────
  {
    code: 'pet_none',
    name: 'No Pet',
    category: 'pet',
    emoji: '✖️',
    rarity: 'common',
    unlockCondition: 'Default',
    unlockType: 'default',
    coinCost: 0,
    isDefault: true,
    sortOrder: 0,
  },
  {
    code: 'pet_owl',
    name: 'Wise Owl',
    category: 'pet',
    emoji: '🦉',
    rarity: 'rare',
    unlockCondition: 'Complete 20 lessons',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 1,
  },
  {
    code: 'pet_cat',
    name: 'Lucky Cat',
    category: 'pet',
    emoji: '🐱',
    rarity: 'rare',
    unlockCondition: 'Purchase for 200 coins',
    unlockType: 'purchase',
    coinCost: 200,
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: 'pet_dragon',
    name: 'Mini Dragon',
    category: 'pet',
    emoji: '🐉',
    rarity: 'legendary',
    unlockCondition: 'Reach Diamond League',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 3,
  },

  // ── Backgrounds (4) ───────────────────────────────────────────────────────
  {
    code: 'bg_default_white',
    name: 'Clean White',
    category: 'background',
    emoji: '⬜',
    rarity: 'common',
    unlockCondition: 'Default',
    unlockType: 'default',
    coinCost: 0,
    isDefault: true,
    sortOrder: 1,
  },
  {
    code: 'bg_library',
    name: 'Grand Library',
    category: 'background',
    emoji: '📚',
    rarity: 'common',
    unlockCondition: 'Complete 10 lessons',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: 'bg_starry_night',
    name: 'Starry Night',
    category: 'background',
    emoji: '🌃',
    rarity: 'epic',
    unlockCondition: 'Land on chest in the spin wheel',
    unlockType: 'spin',
    coinCost: 0,
    isDefault: false,
    sortOrder: 3,
  },
  {
    code: 'bg_fireworks',
    name: 'Fireworks',
    category: 'background',
    emoji: '🎆',
    rarity: 'rare',
    unlockCondition: 'Complete New Year 2026 event',
    unlockType: 'event',
    coinCost: 0,
    isDefault: false,
    sortOrder: 4,
  },

  // ── Titles (3) ────────────────────────────────────────────────────────────
  {
    code: 'title_none',
    name: 'No Title',
    category: 'title',
    emoji: '—',
    rarity: 'common',
    unlockCondition: 'Default',
    unlockType: 'default',
    coinCost: 0,
    isDefault: true,
    sortOrder: 0,
  },
  {
    code: 'title_language_lover',
    name: '❤️ Language Lover',
    category: 'title',
    emoji: '❤️',
    rarity: 'common',
    unlockCondition: 'Complete your first lesson',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 1,
  },
  {
    code: 'title_polyglot',
    name: '🌍 Polyglot',
    category: 'title',
    emoji: '🌍',
    rarity: 'legendary',
    unlockCondition: 'Reach 10,000 total XP',
    unlockType: 'achievement',
    coinCost: 0,
    isDefault: false,
    sortOrder: 2,
  },
];

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────

async function seedGamification() {
  console.log('🌱 Starting gamification seed...\n');

  // 1. Daily Quests
  console.log('📋 Seeding daily quest definitions...');
  await db.insert(dailyQuests).values(DAILY_QUEST_SEEDS).onConflictDoNothing();
  console.log(`   ✅ ${DAILY_QUEST_SEEDS.length} daily quests seeded.\n`);

  // 2. Weekly Missions
  console.log('🎯 Seeding weekly mission definitions...');
  await db.insert(weeklyMissions).values(WEEKLY_MISSION_SEEDS).onConflictDoNothing();
  console.log(`   ✅ ${WEEKLY_MISSION_SEEDS.length} weekly missions seeded.\n`);

  // 3. Seasonal Events
  console.log('🎉 Seeding seasonal events...');
  await db.insert(seasonalEvents).values(SEASONAL_EVENT_SEEDS).onConflictDoNothing();
  console.log(`   ✅ ${SEASONAL_EVENT_SEEDS.length} seasonal events seeded.\n`);

  // 4. Themes
  console.log('🎨 Seeding themes...');
  await db.insert(themes).values(THEME_SEEDS).onConflictDoNothing();
  console.log(`   ✅ ${THEME_SEEDS.length} themes seeded.\n`);

  // 5. Avatar Items
  console.log('👤 Seeding avatar items...');
  await db.insert(avatarItems).values(AVATAR_ITEM_SEEDS).onConflictDoNothing();
  console.log(`   ✅ ${AVATAR_ITEM_SEEDS.length} avatar items seeded.\n`);

  // 6. Vocabulary / Flashcards for existing users
  console.log('📚 Seeding flashcards for existing users...');
  const allUsers = await db.select().from(users);
  
  const wordsToSeed = [
    { word: 'Hello', translation: 'Hola', exampleSentence: 'Hello, how are you? (¡Hola! ¿Cómo estás?)', languageId: 1 },
    { word: 'Goodbye', translation: 'Adiós', exampleSentence: 'Goodbye, my friend. (Adiós, mi amigo.)', languageId: 1 },
    { word: 'Thank you', translation: 'Gracias', exampleSentence: 'Thank you for the delicious food. (Gracias por la comida deliciosa.)', languageId: 1 },
    { word: 'Please', translation: 'Por favor', exampleSentence: 'A coffee, please. (Un café, por favor.)', languageId: 1 },
    { word: 'Friend', translation: 'Amigo', exampleSentence: 'He is my best friend. (Él es mi mejor amigo.)', languageId: 1 }
  ];

  for (const user of allUsers) {
    const existingVocab = await db.select().from(vocabularyNotebook).where(eq(vocabularyNotebook.userId, user.id));
    if (existingVocab.length === 0) {
      for (const entry of wordsToSeed) {
        const [vocabRow] = await db.insert(vocabularyNotebook).values({
          userId: user.id,
          languageId: entry.languageId,
          word: entry.word,
          translation: entry.translation,
          exampleSentence: entry.exampleSentence,
          isFavorite: Math.random() > 0.5,
          sourceType: 'manual',
          addedAt: new Date(),
          updatedAt: new Date()
        }).returning();

        await db.insert(flashcardReviews).values({
          userId: user.id,
          vocabId: vocabRow.id,
          easeFactor: 250,
          interval: 1,
          repetitions: 0,
          nextReviewDate: new Date(),
        });
      }
    }
  }
  console.log(`   ✅ Flashcards seeded for ${allUsers.length} users.\n`);

  console.log('🎮 Gamification seed complete!');
  console.log('\nSummary:');
  console.log(`  • Daily Quests  : ${DAILY_QUEST_SEEDS.length}`);
  console.log(`  • Weekly Missions: ${WEEKLY_MISSION_SEEDS.length}`);
  console.log(`  • Seasonal Events: ${SEASONAL_EVENT_SEEDS.length}`);
  console.log(`  • Themes        : ${THEME_SEEDS.length}`);
  console.log(`  • Avatar Items  : ${AVATAR_ITEM_SEEDS.length}`);
  process.exit(0);
}

seedGamification().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
