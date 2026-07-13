import { db } from '../db/index.js';
import {
  dailyQuests,
  userDailyQuests,
  weeklyMissions,
  userWeeklyMissions,
  seasonalEvents,
  userEventProgress,
  spinWheelLog,
  userChests,
  profiles,
  xpLogs,
} from '../db/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
function getTodayString() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Returns the ISO date string (YYYY-MM-DD) of the most recent Monday.
 */
function getWeekStartString() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/**
 * Weighted random selection from the SPIN_REWARDS array.
 * Each item must have a `probability` field that sums to 1.
 */
function weightedRandom(rewards) {
  const roll = Math.random();
  let cumulative = 0;
  for (const reward of rewards) {
    cumulative += reward.probability;
    if (roll <= cumulative) return reward;
  }
  // Fallback: return the first reward (should never reach here if probs sum to 1)
  return rewards[0];
}

// ─── SPIN WHEEL CONFIG ────────────────────────────────────────────────────────

const SPIN_REWARDS = [
  { type: 'xp',            value: 100,      label: '100 XP',        probability: 0.30 },
  { type: 'coins',         value: 50,       label: '50 Coins',      probability: 0.25 },
  { type: 'streak_freeze', value: 1,        label: 'Streak Freeze', probability: 0.15 },
  { type: 'diamonds',      value: 5,        label: '5 Diamonds',    probability: 0.12 },
  { type: 'chest',         value: 'bronze', label: 'Bronze Chest',  probability: 0.10 },
  { type: 'xp_boost',      value: 200,      label: '200 XP',        probability: 0.05 },
  { type: 'diamonds',      value: 20,       label: '20 Diamonds',   probability: 0.02 },
  { type: 'chest',         value: 'golden', label: 'Golden Chest',  probability: 0.01 },
];

// ─── CHEST REWARD TABLES ──────────────────────────────────────────────────────

const CHEST_REWARDS = {
  bronze: [
    { xp: 50,  coins: 20,  diamonds: 0  },
    { xp: 100, coins: 0,   diamonds: 5  },
    { xp: 0,   coins: 75,  diamonds: 0  },
    { xp: 75,  coins: 30,  diamonds: 2  },
  ],
  silver: [
    { xp: 150, coins: 50,  diamonds: 5  },
    { xp: 200, coins: 0,   diamonds: 10 },
    { xp: 0,   coins: 150, diamonds: 0  },
    { xp: 100, coins: 80,  diamonds: 8  },
  ],
  gold: [
    { xp: 300, coins: 100, diamonds: 15 },
    { xp: 400, coins: 0,   diamonds: 25 },
    { xp: 0,   coins: 300, diamonds: 0  },
    { xp: 250, coins: 150, diamonds: 20 },
  ],
  golden: [
    { xp: 500,  coins: 200, diamonds: 30  },
    { xp: 1000, coins: 0,   diamonds: 50  },
    { xp: 0,    coins: 500, diamonds: 20  },
    { xp: 750,  coins: 250, diamonds: 40  },
  ],
};

/**
 * Picks a random reward from the chest reward table for a given chest type.
 */
function generateChestReward(chestType) {
  const table = CHEST_REWARDS[chestType] ?? CHEST_REWARDS.bronze;
  return table[Math.floor(Math.random() * table.length)];
}

/**
 * Applies a numeric reward (xp, coins, diamonds, streak_freeze) to the user's profile.
 * Also inserts an xp_log entry if XP is awarded.
 */
async function applyRewardToProfile(userId, reward) {
  const userIdNum = parseInt(userId);
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userIdNum)).limit(1);
  if (!profile) return null;

  const updates = { updatedAt: new Date() };

  if (reward.xp && reward.xp > 0) {
    updates.xpTotal = profile.xpTotal + reward.xp;
    await db.insert(xpLogs).values({ userId: userIdNum, amount: reward.xp, source: reward.source || 'gamification' });
  }
  if (reward.coins && reward.coins > 0) {
    updates.coins = profile.coins + reward.coins;
  }
  if (reward.diamonds && reward.diamonds > 0) {
    updates.diamonds = profile.diamonds + reward.diamonds;
  }
  if (reward.streakFreeze && reward.streakFreeze > 0) {
    updates.streakFreezeCount = profile.streakFreezeCount + reward.streakFreeze;
  }

  const [updated] = await db.update(profiles).set(updates).where(eq(profiles.userId, userIdNum)).returning();
  return updated;
}

// ─── DEFAULT QUEST DEFINITIONS ────────────────────────────────────────────────

const DEFAULT_QUEST_CODES = ['complete_3_lessons', 'earn_50_xp', 'maintain_streak'];

/**
 * Ensures the 3 default quest definitions exist in the DB, and that user_daily_quests
 * rows exist for today. Returns the user's quests with progress merged in.
 */
async function ensureUserDailyQuests(userId, today) {
  const userIdNum = parseInt(userId);

  // Fetch active quests matching our default codes
  const questDefs = await db
    .select()
    .from(dailyQuests)
    .where(eq(dailyQuests.isActive, true));

  const relevantDefs = questDefs.filter(q => DEFAULT_QUEST_CODES.includes(q.code));

  // Fetch existing progress for today
  const existing = await db
    .select()
    .from(userDailyQuests)
    .where(and(eq(userDailyQuests.userId, userIdNum), eq(userDailyQuests.date, today)));

  const existingQuestIds = new Set(existing.map(e => e.questId));

  // Insert missing rows for today
  const toInsert = relevantDefs
    .filter(def => !existingQuestIds.has(def.id))
    .map(def => ({
      userId: userIdNum,
      questId: def.id,
      progress: 0,
      isCompleted: false,
      isClaimed: false,
      date: today,
    }));

  if (toInsert.length > 0) {
    const inserted = await db.insert(userDailyQuests).values(toInsert).returning();
    existing.push(...inserted);
  }

  // Merge definition data into progress rows
  const defMap = Object.fromEntries(relevantDefs.map(d => [d.id, d]));
  return existing.map(row => ({
    ...row,
    quest: defMap[row.questId] ?? null,
  }));
}

// ─── CONTROLLER ───────────────────────────────────────────────────────────────

export const gamificationController = {
  // ── Daily Quests ────────────────────────────────────────────────────────────

  /**
   * GET /api/gamification/quests
   * Returns today's daily quests with user progress.
   * Auto-creates user_daily_quests rows if missing for today.
   */
  async getDailyQuests(request, reply) {
    try {
      const today = getTodayString();
      const quests = await ensureUserDailyQuests(request.user.id, today);
      return { success: true, date: today, quests };
    } catch (error) {
      request.log.error('Error fetching daily quests:', error);
      reply.status(500).send({ error: 'Failed to load daily quests.' });
    }
  },

  /**
   * POST /api/gamification/quests/:userQuestId/claim
   * Claims a completed quest reward, credits XP + coins to profile.
   */
  async claimDailyQuest(request, reply) {
    const { userQuestId } = request.params;
    const userIdNum = parseInt(request.user.id);

    try {
      // Fetch the user quest row
      const [userQuest] = await db
        .select()
        .from(userDailyQuests)
        .where(and(eq(userDailyQuests.id, parseInt(userQuestId)), eq(userDailyQuests.userId, userIdNum)))
        .limit(1);

      if (!userQuest) {
        reply.status(404).send({ error: 'Quest not found.' });
        return;
      }
      if (!userQuest.isCompleted) {
        reply.status(400).send({ error: 'Quest is not yet completed.' });
        return;
      }
      if (userQuest.isClaimed) {
        reply.status(400).send({ error: 'Quest reward already claimed.' });
        return;
      }

      // Fetch the quest definition for reward amounts
      const [questDef] = await db
        .select()
        .from(dailyQuests)
        .where(eq(dailyQuests.id, userQuest.questId))
        .limit(1);

      if (!questDef) {
        reply.status(404).send({ error: 'Quest definition not found.' });
        return;
      }

      // Mark as claimed
      await db
        .update(userDailyQuests)
        .set({ isClaimed: true })
        .where(eq(userDailyQuests.id, parseInt(userQuestId)));

      // Apply rewards to profile
      const updatedProfile = await applyRewardToProfile(userIdNum, {
        xp: questDef.xpReward,
        coins: questDef.coinReward,
        source: `Daily Quest: ${questDef.title}`,
      });

      return {
        success: true,
        message: `Claimed "${questDef.title}" reward!`,
        xpEarned: questDef.xpReward,
        coinsEarned: questDef.coinReward,
        profile: updatedProfile,
      };
    } catch (error) {
      request.log.error('Error claiming daily quest:', error);
      reply.status(500).send({ error: 'Failed to claim quest reward.' });
    }
  },

  // ── Weekly Missions ──────────────────────────────────────────────────────────

  /**
   * GET /api/gamification/missions
   * Returns this week's active missions with user progress.
   * Auto-creates user_weekly_missions rows if missing for this week.
   */
  async getWeeklyMissions(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const weekStart = getWeekStartString();

    try {
      // Fetch all active mission definitions
      const missionDefs = await db
        .select()
        .from(weeklyMissions)
        .where(eq(weeklyMissions.isActive, true));

      // Fetch existing user progress for this week
      const existing = await db
        .select()
        .from(userWeeklyMissions)
        .where(and(eq(userWeeklyMissions.userId, userIdNum), eq(userWeeklyMissions.weekStart, weekStart)));

      const existingMissionIds = new Set(existing.map(e => e.missionId));

      // Insert missing rows for this week
      const toInsert = missionDefs
        .filter(def => !existingMissionIds.has(def.id))
        .map(def => ({
          userId: userIdNum,
          missionId: def.id,
          xpEarnedThisWeek: 0,
          isCompleted: false,
          isClaimed: false,
          weekStart,
        }));

      if (toInsert.length > 0) {
        await db.insert(userWeeklyMissions).values(toInsert);
      }

      // Re-fetch and merge
      const freshProgress = await db
        .select()
        .from(userWeeklyMissions)
        .where(and(eq(userWeeklyMissions.userId, userIdNum), eq(userWeeklyMissions.weekStart, weekStart)));

      const defMap = Object.fromEntries(missionDefs.map(d => [d.id, d]));
      const missions = freshProgress.map(row => ({
        ...row,
        mission: defMap[row.missionId] ?? null,
      }));

      return { success: true, weekStart, missions };
    } catch (error) {
      request.log.error('Error fetching weekly missions:', error);
      reply.status(500).send({ error: 'Failed to load weekly missions.' });
    }
  },

  // ── Seasonal Events ──────────────────────────────────────────────────────────

  /**
   * GET /api/gamification/events
   * Returns currently active seasonal events with user progress.
   */
  async getSeasonalEvents(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const now = new Date();

    try {
      // Fetch events that are currently active (startDate <= now <= endDate)
      const activeEvents = await db
        .select()
        .from(seasonalEvents)
        .where(and(eq(seasonalEvents.isActive, true), lte(seasonalEvents.startDate, now), gte(seasonalEvents.endDate, now)));

      if (activeEvents.length === 0) {
        return { success: true, events: [] };
      }

      // Fetch user progress for each active event
      const userProgress = await db
        .select()
        .from(userEventProgress)
        .where(eq(userEventProgress.userId, userIdNum));

      const progressMap = Object.fromEntries(userProgress.map(p => [p.eventId, p]));

      // Merge progress into events, auto-create missing progress rows
      const toInsert = activeEvents
        .filter(ev => !progressMap[ev.id])
        .map(ev => ({
          userId: userIdNum,
          eventId: ev.id,
          collectiblesEarned: 0,
          lessonsCompleted: 0,
          isRewardClaimed: false,
        }));

      if (toInsert.length > 0) {
        const inserted = await db.insert(userEventProgress).values(toInsert).returning();
        inserted.forEach(row => { progressMap[row.eventId] = row; });
      }

      const events = activeEvents.map(ev => ({
        ...ev,
        userProgress: progressMap[ev.id] ?? null,
      }));

      return { success: true, events };
    } catch (error) {
      request.log.error('Error fetching seasonal events:', error);
      reply.status(500).send({ error: 'Failed to load seasonal events.' });
    }
  },

  // ── Spin Wheel ───────────────────────────────────────────────────────────────

  /**
   * GET /api/gamification/spin
   * Returns whether the user can spin and time until next spin in ms.
   */
  async getSpinWheel(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    try {
      // Get last spin log entry
      const [lastSpin] = await db
        .select()
        .from(spinWheelLog)
        .where(eq(spinWheelLog.userId, userIdNum))
        .orderBy(desc(spinWheelLog.spunAt))
        .limit(1);

      const now = Date.now();

      if (!lastSpin) {
        return { success: true, canSpin: true, timeUntilNextSpin: 0 };
      }

      const lastSpunAt = new Date(lastSpin.spunAt).getTime();
      const elapsed = now - lastSpunAt;
      const remaining = COOLDOWN_MS - elapsed;

      if (remaining <= 0) {
        return { success: true, canSpin: true, timeUntilNextSpin: 0, lastSpun: lastSpin.spunAt };
      }

      return {
        success: true,
        canSpin: false,
        timeUntilNextSpin: remaining,
        lastSpun: lastSpin.spunAt,
        nextSpinAt: new Date(lastSpunAt + COOLDOWN_MS).toISOString(),
      };
    } catch (error) {
      request.log.error('Error checking spin wheel:', error);
      reply.status(500).send({ error: 'Failed to check spin wheel status.' });
    }
  },

  /**
   * POST /api/gamification/spin
   * Executes a spin. Enforces 24h cooldown. Generates weighted-random reward.
   * Applies reward to profile and logs the spin.
   */
  async doSpinWheel(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;

    try {
      // 24h cooldown check
      const [lastSpin] = await db
        .select()
        .from(spinWheelLog)
        .where(eq(spinWheelLog.userId, userIdNum))
        .orderBy(desc(spinWheelLog.spunAt))
        .limit(1);

      if (lastSpin) {
        const elapsed = Date.now() - new Date(lastSpin.spunAt).getTime();
        if (elapsed < COOLDOWN_MS) {
          const remaining = COOLDOWN_MS - elapsed;
          reply.status(429).send({
            error: 'Spin not ready yet.',
            timeUntilNextSpin: remaining,
            nextSpinAt: new Date(Date.now() + remaining).toISOString(),
          });
          return;
        }
      }

      // Pick a reward using weighted probability
      const reward = weightedRandom(SPIN_REWARDS);

      // Apply reward to profile
      let updatedProfile = null;
      let chestCreated = null;

      if (reward.type === 'xp' || reward.type === 'xp_boost') {
        updatedProfile = await applyRewardToProfile(userIdNum, { xp: reward.value, source: 'Spin Wheel' });
      } else if (reward.type === 'coins') {
        updatedProfile = await applyRewardToProfile(userIdNum, { coins: reward.value });
      } else if (reward.type === 'diamonds') {
        updatedProfile = await applyRewardToProfile(userIdNum, { diamonds: reward.value });
      } else if (reward.type === 'streak_freeze') {
        updatedProfile = await applyRewardToProfile(userIdNum, { streakFreeze: reward.value });
      } else if (reward.type === 'chest') {
        // Grant the chest to the user
        const [chest] = await db.insert(userChests).values({
          userId: userIdNum,
          chestType: reward.value,
          isOpened: false,
          earnedFrom: 'spin_wheel',
        }).returning();
        chestCreated = chest;
      }

      // Log the spin
      const [logEntry] = await db.insert(spinWheelLog).values({
        userId: userIdNum,
        reward: { type: reward.type, value: reward.value, label: reward.label },
      }).returning();

      return {
        success: true,
        reward: { type: reward.type, value: reward.value, label: reward.label },
        profile: updatedProfile,
        chest: chestCreated,
        spunAt: logEntry.spunAt,
      };
    } catch (error) {
      request.log.error('Error executing spin:', error);
      reply.status(500).send({ error: 'Failed to execute spin.' });
    }
  },

  // ── Treasure Chests ──────────────────────────────────────────────────────────

  /**
   * GET /api/gamification/chests
   * Returns all unopened chests for the current user.
   */
  async getUserChests(request, reply) {
    const userIdNum = parseInt(request.user.id);

    try {
      const chests = await db
        .select()
        .from(userChests)
        .where(and(eq(userChests.userId, userIdNum), eq(userChests.isOpened, false)))
        .orderBy(desc(userChests.createdAt));

      return { success: true, chests };
    } catch (error) {
      request.log.error('Error fetching chests:', error);
      reply.status(500).send({ error: 'Failed to load chests.' });
    }
  },

  /**
   * POST /api/gamification/chests/:chestId/open
   * Opens a chest, generates a random reward, applies it to the profile.
   */
  async openChest(request, reply) {
    const { chestId } = request.params;
    const userIdNum = parseInt(request.user.id);

    try {
      // Verify the chest belongs to this user and is unopened
      const [chest] = await db
        .select()
        .from(userChests)
        .where(and(eq(userChests.id, parseInt(chestId)), eq(userChests.userId, userIdNum)))
        .limit(1);

      if (!chest) {
        reply.status(404).send({ error: 'Chest not found.' });
        return;
      }
      if (chest.isOpened) {
        reply.status(400).send({ error: 'Chest has already been opened.' });
        return;
      }

      // Generate reward based on chest type
      const reward = generateChestReward(chest.chestType);

      // Apply rewards to profile
      const updatedProfile = await applyRewardToProfile(userIdNum, {
        xp: reward.xp,
        coins: reward.coins,
        diamonds: reward.diamonds,
        source: `${chest.chestType} Chest`,
      });

      // Mark chest as opened
      const [updatedChest] = await db
        .update(userChests)
        .set({ isOpened: true, reward, openedAt: new Date() })
        .where(eq(userChests.id, parseInt(chestId)))
        .returning();

      return {
        success: true,
        message: `${chest.chestType.charAt(0).toUpperCase() + chest.chestType.slice(1)} chest opened!`,
        reward,
        chest: updatedChest,
        profile: updatedProfile,
      };
    } catch (error) {
      request.log.error('Error opening chest:', error);
      reply.status(500).send({ error: 'Failed to open chest.' });
    }
  },
};
