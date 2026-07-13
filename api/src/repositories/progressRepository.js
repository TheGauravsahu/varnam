import { db } from '../db/index.js';
import { userProgress, userAchievements, achievements } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { userRepository } from './userRepository.js';

export const progressRepository = {
  async saveProgress({ userId, lessonId, score }) {
    const userIdNum = parseInt(userId);
    const lessonIdNum = parseInt(lessonId);

    const [inserted] = await db.insert(userProgress).values({
      userId: userIdNum,
      lessonId: lessonIdNum,
      score
    }).returning();
    return inserted;
  },

  async getCompletedLessons(userId) {
    const userIdNum = parseInt(userId);
    const results = await db.select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(eq(userProgress.userId, userIdNum));
    return results.map(r => r.lessonId);
  },

  async getAchievements() {
    return await db.select().from(achievements);
  },

  async getUserAchievements(userId) {
    const userIdNum = parseInt(userId);
    return await db.select({
      id: userAchievements.id,
      userId: userAchievements.userId,
      achievementId: userAchievements.achievementId,
      unlockedAt: userAchievements.unlockedAt,
      achievement: {
        id: achievements.id,
        code: achievements.code,
        title: achievements.title,
        description: achievements.description,
        icon: achievements.icon,
        xpReward: achievements.xpReward,
        coinReward: achievements.coinReward
      }
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userIdNum));
  },

  async unlockAchievement(userId, achievementId) {
    const userIdNum = parseInt(userId);
    const achIdNum = parseInt(achievementId);

    // Check if already unlocked
    const exists = await db.select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userIdNum), eq(userAchievements.achievementId, achIdNum)))
      .limit(1);
    
    if (exists.length > 0) return null;

    const [inserted] = await db.insert(userAchievements).values({
      userId: userIdNum,
      achievementId: achIdNum
    }).returning();
    return inserted;
  },

  async checkAndUnlockAchievements(userId) {
    const userIdNum = parseInt(userId);
    
    // Fetch all achievements
    const allAchievements = await this.getAchievements();
    const userUnlocks = await this.getUserAchievements(userIdNum);
    const unlockedCodes = new Set(userUnlocks.map(u => u.achievement.code));

    // Get user details for checking criteria
    const user = await userRepository.findById(userIdNum);
    if (!user || !user.profile) return [];

    const completedLessonIds = await this.getCompletedLessons(userIdNum);
    const hasPerfectScore = (await db.select().from(userProgress).where(and(eq(userProgress.userId, userIdNum), eq(userProgress.score, 100))).limit(1)).length > 0;

    const newlyUnlocked = [];

    for (const ach of allAchievements) {
      if (unlockedCodes.has(ach.code)) continue;

      let meetsCriteria = false;

      if (ach.code === 'first_lesson' && completedLessonIds.length >= 1) {
        meetsCriteria = true;
      } else if (ach.code === 'streak_3' && user.profile.streakCount >= 3) {
        meetsCriteria = true;
      } else if (ach.code === 'streak_7' && user.profile.streakCount >= 7) {
        meetsCriteria = true;
      } else if (ach.code === 'perfect_lesson' && hasPerfectScore) {
        meetsCriteria = true;
      }

      if (meetsCriteria) {
        const unlock = await this.unlockAchievement(userIdNum, ach.id);
        if (unlock) {
          // Award XP and Coins
          await userRepository.addXP(userIdNum, ach.xpReward, `Achievement: ${ach.title}`);
          await userRepository.addCurrency(userIdNum, { coins: ach.coinReward });
          newlyUnlocked.push(ach);
        }
      }
    }

    return newlyUnlocked;
  }
};
export default progressRepository;
