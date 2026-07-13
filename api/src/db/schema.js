import { pgTable, serial, varchar, text, integer, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(), // 'user' or 'admin'
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationToken: varchar('verification_token', { length: 255 }),
  resetToken: varchar('reset_token', { length: 255 }),
  resetExpires: timestamp('reset_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Profiles Table
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  bio: text('bio'),
  nativeLanguage: varchar('native_language', { length: 100 }).default('Hindi').notNull(),
  currentLanguageId: integer('current_language_id'), // will be updated when language is selected
  currentLeague: varchar('current_league', { length: 50 }).default('Bronze').notNull(), // Bronze, Silver, Gold, Platinum, Diamond
  streakCount: integer('streak_count').default(0).notNull(),
  streakFreezeCount: integer('streak_freeze_count').default(0).notNull(),
  lastActiveDate: timestamp('last_active_date'),
  xpTotal: integer('xp_total').default(0).notNull(),
  coins: integer('coins').default(100).notNull(),
  diamonds: integer('diamonds').default(20).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Supported Languages Table
export const languages = pgTable('languages', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(), // e.g. 'en', 'es', 'hi'
  name: varchar('name', { length: 100 }).notNull(),        // e.g. 'English', 'Spanish', 'Hindi'
  flagEmoji: varchar('flag_emoji', { length: 10 }),         // e.g. '🇬🇧', '🇪🇸'
  isActive: boolean('is_active').default(true).notNull(),
});

// Course Units Table
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  languageId: integer('language_id').references(() => languages.id, { onDelete: 'cascade' }).notNull(),
  number: integer('number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
});

// Course Chapters Table
export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
  number: integer('number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
});

// Course Lessons Table
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  number: integer('number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  xpReward: integer('xp_reward').default(10).notNull(),
});

// Exercises Table (Exercises under a specific lesson)
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'multiple_choice', 'true_false', 'matching', 'fill_blank'
  instruction: text('instruction').notNull(),      // e.g. "Select the correct option"
  questionText: text('question_text').notNull(),    // e.g. "Hello" (for translation or select)
  correctAnswer: text('correct_answer').notNull(),  // e.g. "नमस्ते" or key/index
  choices: jsonb('choices'),                       // e.g. ['नमस्ते', 'धन्यवाद', 'शुभरात्रि'] or matching pairs
  order: integer('order').default(0).notNull(),
});

// User Lesson Progress
export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

// Achievements Table
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(), // e.g. 'first_lesson', 'streak_7'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 100 }).default('trophy').notNull(), // Lucide icon name
  xpReward: integer('xp_reward').default(0).notNull(),
  coinReward: integer('coin_reward').default(0).notNull(),
});

// User Achievements Table
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievementId: integer('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

// XP Transaction Log
export const xpLogs = pgTable('xp_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(),
  source: varchar('source', { length: 100 }).notNull(), // 'lesson', 'daily_login', 'streak', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Friends Table
export const friends = pgTable('friends', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  friendId: integer('friend_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'accepted'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('system').notNull(), // 'system', 'league', 'friend', 'achievement'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── GAMIFICATION TABLES ────────────────────────────────────────────────────

// Daily Quests Definition Table
export const dailyQuests = pgTable('daily_quests', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).default('target').notNull(),
  xpReward: integer('xp_reward').default(50).notNull(),
  coinReward: integer('coin_reward').default(20).notNull(),
  targetCount: integer('target_count').default(1).notNull(), // e.g., complete 3 lessons
  questType: varchar('quest_type', { length: 50 }).default('lesson').notNull(), // 'lesson', 'xp', 'streak', 'word'
  isActive: boolean('is_active').default(true).notNull(),
});

// User Daily Quest Progress (resets daily)
export const userDailyQuests = pgTable('user_daily_quests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  questId: integer('quest_id').references(() => dailyQuests.id, { onDelete: 'cascade' }).notNull(),
  progress: integer('progress').default(0).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  isClaimed: boolean('is_claimed').default(false).notNull(),
  date: varchar('date', { length: 20 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Weekly Missions Table
export const weeklyMissions = pgTable('weekly_missions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  xpRequired: integer('xp_required').default(1500).notNull(),
  reward: jsonb('reward').notNull(), // { type: 'golden_chest', xp: 500, coins: 200 }
  isActive: boolean('is_active').default(true).notNull(),
});

// User Weekly Mission Progress
export const userWeeklyMissions = pgTable('user_weekly_missions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  missionId: integer('mission_id').references(() => weeklyMissions.id, { onDelete: 'cascade' }).notNull(),
  xpEarnedThisWeek: integer('xp_earned_this_week').default(0).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  isClaimed: boolean('is_claimed').default(false).notNull(),
  weekStart: varchar('week_start', { length: 20 }).notNull(), // YYYY-MM-DD of Monday
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Seasonal Events Table
export const seasonalEvents = pgTable('seasonal_events', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(), // 'diwali_2025', 'holi_2026'
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  emoji: varchar('emoji', { length: 20 }),
  themeColor: varchar('theme_color', { length: 50 }), // CSS class or hex
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  lessonsRequired: integer('lessons_required').default(5).notNull(),
  rewardItem: varchar('reward_item', { length: 255 }), // unlocked avatar item or theme
  isActive: boolean('is_active').default(true).notNull(),
});

// User Seasonal Event Progress
export const userEventProgress = pgTable('user_event_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventId: integer('event_id').references(() => seasonalEvents.id, { onDelete: 'cascade' }).notNull(),
  collectiblesEarned: integer('collectibles_earned').default(0).notNull(), // e.g., diyas collected
  lessonsCompleted: integer('lessons_completed').default(0).notNull(),
  isRewardClaimed: boolean('is_reward_claimed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Treasure Chests
export const userChests = pgTable('user_chests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  chestType: varchar('chest_type', { length: 50 }).default('bronze').notNull(), // 'bronze', 'silver', 'gold', 'golden'
  isOpened: boolean('is_opened').default(false).notNull(),
  reward: jsonb('reward'), // filled when opened: { xp, coins, diamonds, item }
  earnedFrom: varchar('earned_from', { length: 100 }), // 'weekly_mission', 'spin_wheel', 'achievement'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  openedAt: timestamp('opened_at'),
});

// Spin Wheel Log (one spin per 24h)
export const spinWheelLog = pgTable('spin_wheel_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reward: jsonb('reward').notNull(), // { type: 'xp'|'coins'|'streak_freeze'|'diamonds'|'chest'|'theme', value: number, label: string }
  spunAt: timestamp('spun_at').defaultNow().notNull(),
});

// ─── AVATAR SYSTEM ───────────────────────────────────────────────────────────

// Avatar Items Catalog
export const avatarItems = pgTable('avatar_items', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'hair', 'clothes', 'pet', 'background', 'title', 'animation'
  imageUrl: varchar('image_url', { length: 500 }), // asset path
  emoji: varchar('emoji', { length: 20 }), // fallback emoji
  rarity: varchar('rarity', { length: 50 }).default('common').notNull(), // 'common', 'rare', 'epic', 'legendary'
  unlockCondition: varchar('unlock_condition', { length: 255 }), // human readable
  unlockType: varchar('unlock_type', { length: 50 }).default('achievement').notNull(), // 'achievement', 'spin', 'purchase', 'event', 'default'
  coinCost: integer('coin_cost').default(0).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

// User Unlocked Avatar Items
export const userAvatarItems = pgTable('user_avatar_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  itemId: integer('item_id').references(() => avatarItems.id, { onDelete: 'cascade' }).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

// User Currently Equipped Avatar
export const userAvatar = pgTable('user_avatar', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  hairItemId: integer('hair_item_id'),
  clothesItemId: integer('clothes_item_id'),
  petItemId: integer('pet_item_id'),
  backgroundItemId: integer('background_item_id'),
  titleItemId: integer('title_item_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── THEMES ──────────────────────────────────────────────────────────────────

// Themes Catalog
export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(), // 'violet', 'midnight', 'sakura', 'ocean', 'emerald', 'cyberpunk'
  name: varchar('name', { length: 255 }).notNull(),
  emoji: varchar('emoji', { length: 20 }),
  primaryColor: varchar('primary_color', { length: 20 }).notNull(), // hex
  secondaryColor: varchar('secondary_color', { length: 20 }),
  unlockCondition: varchar('unlock_condition', { length: 255 }),
  isDefault: boolean('is_default').default(false).notNull(),
});

// User Unlocked Themes
export const userThemes = pgTable('user_themes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  themeId: integer('theme_id').references(() => themes.id, { onDelete: 'cascade' }).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

// ─── VOCABULARY NOTEBOOK ──────────────────────────────────────────────────────

// Vocabulary Notebook
export const vocabularyNotebook = pgTable('vocabulary_notebook', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  languageId: integer('language_id'),
  word: varchar('word', { length: 255 }).notNull(),
  translation: varchar('translation', { length: 255 }).notNull(),
  exampleSentence: text('example_sentence'),
  synonyms: jsonb('synonyms'), // string[]
  notes: text('notes'),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  sourceType: varchar('source_type', { length: 50 }).default('lesson').notNull(), // 'lesson', 'manual'
  sourceLessonId: integer('source_lesson_id'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Flashcard Spaced Repetition State (SM-2 algorithm)
export const flashcardReviews = pgTable('flashcard_reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vocabId: integer('vocab_id').references(() => vocabularyNotebook.id, { onDelete: 'cascade' }).notNull(),
  easeFactor: integer('ease_factor').default(250).notNull(), // SM-2: starts at 2.5 * 100
  interval: integer('interval').default(1).notNull(), // days until next review
  repetitions: integer('repetitions').default(0).notNull(),
  nextReviewDate: timestamp('next_review_date').defaultNow().notNull(),
  lastReviewedAt: timestamp('last_reviewed_at'),
});

// ─── LANGUAGE CLUBS ──────────────────────────────────────────────────────────

// Language Clubs
export const clubs = pgTable('clubs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  languageId: integer('language_id'),
  emoji: varchar('emoji', { length: 20 }).default('🏛️'),
  createdBy: integer('created_by').references(() => users.id),
  memberCount: integer('member_count').default(0).notNull(),
  weeklyXp: integer('weekly_xp').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Club Membership
export const clubMembers = pgTable('club_members', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).default('member').notNull(), // 'admin', 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});
