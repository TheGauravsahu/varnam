/**
 * Manual migration for new gamification tables.
 * Uses CREATE TABLE IF NOT EXISTS — safe to run multiple times.
 * Bypasses drizzle-kit to avoid primary key constraint errors on existing tables.
 *
 * Usage: node src/db/migrateGamification.js
 */
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- ============================================================
-- GAMIFICATION TABLES — additive only, never touches existing
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_quests (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'target',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 20,
  target_count INTEGER NOT NULL DEFAULT 1,
  quest_type VARCHAR(50) NOT NULL DEFAULT 'lesson',
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_daily_quests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id INTEGER NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  date VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_missions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  xp_required INTEGER NOT NULL DEFAULT 1500,
  reward JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_weekly_missions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id INTEGER NOT NULL REFERENCES weekly_missions(id) ON DELETE CASCADE,
  xp_earned_this_week INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  week_start VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seasonal_events (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(20),
  theme_color VARCHAR(50),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  lessons_required INTEGER NOT NULL DEFAULT 5,
  reward_item VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_event_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
  collectibles_earned INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  is_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_chests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chest_type VARCHAR(50) NOT NULL DEFAULT 'bronze',
  is_opened BOOLEAN NOT NULL DEFAULT false,
  reward JSONB,
  earned_from VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spin_wheel_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward JSONB NOT NULL,
  spun_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avatar_items (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(500),
  emoji VARCHAR(20),
  rarity VARCHAR(50) NOT NULL DEFAULT 'common',
  unlock_condition VARCHAR(255),
  unlock_type VARCHAR(50) NOT NULL DEFAULT 'achievement',
  coin_cost INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_avatar_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES avatar_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_avatar (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  hair_item_id INTEGER,
  clothes_item_id INTEGER,
  pet_item_id INTEGER,
  background_item_id INTEGER,
  title_item_id INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  emoji VARCHAR(20),
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20),
  unlock_condition VARCHAR(255),
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_themes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vocabulary_notebook (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_id INTEGER,
  word VARCHAR(255) NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example_sentence TEXT,
  synonyms JSONB,
  notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  source_type VARCHAR(50) NOT NULL DEFAULT 'lesson',
  source_lesson_id INTEGER,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id INTEGER NOT NULL REFERENCES vocabulary_notebook(id) ON DELETE CASCADE,
  ease_factor INTEGER NOT NULL DEFAULT 250,
  interval INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date TIMESTAMP NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language_id INTEGER,
  emoji VARCHAR(20) DEFAULT '🏛️',
  created_by INTEGER REFERENCES users(id),
  member_count INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running gamification migration...');
    await client.query(SQL);
    console.log('✅ All 16 new tables created successfully (CREATE TABLE IF NOT EXISTS — safe to re-run)');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
