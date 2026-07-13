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
