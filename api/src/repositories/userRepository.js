import { db } from '../db/index.js';
import { users, profiles, xpLogs } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const userRepository = {
  async findByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) return null;
    const user = result[0];
    const profileResult = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    user.profile = profileResult[0] || null;
    return user;
  },

  async findByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (result.length === 0) return null;
    const user = result[0];
    const profileResult = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    user.profile = profileResult[0] || null;
    return user;
  },

  async findById(id) {
    const userIdNum = parseInt(id);
    const result = await db.select().from(users).where(eq(users.id, userIdNum)).limit(1);
    if (result.length === 0) return null;
    const user = result[0];
    const profileResult = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    user.profile = profileResult[0] || null;
    return user;
  },

  async createUser({ email, username, password, role = 'user' }) {
    const [insertedUser] = await db.insert(users).values({
      email,
      username,
      password,
      role,
      isVerified: false,
      verificationToken: 'token-' + Math.random().toString(36).substring(2),
    }).returning();

    const [insertedProfile] = await db.insert(profiles).values({
      userId: insertedUser.id,
      nativeLanguage: 'Hindi',
      currentLanguageId: 1,
      currentLeague: 'Bronze',
      streakCount: 0,
      streakFreezeCount: 0,
      xpTotal: 0,
      coins: 100,
      diamonds: 20
    }).returning();

    return { ...insertedUser, profile: insertedProfile };
  },

  async verifyUser(id) {
    const userIdNum = parseInt(id);
    const result = await db.update(users)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(users.id, userIdNum))
      .returning();
    return result.length > 0;
  },

  async updateProfile(userId, updateData) {
    const userIdNum = parseInt(userId);
    const [updated] = await db.update(profiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(profiles.userId, userIdNum))
      .returning();
    return updated;
  },

  async addXP(userId, amount, source) {
    const userIdNum = parseInt(userId);
    await db.insert(xpLogs).values({
      userId: userIdNum,
      amount,
      source
    });

    const profileResult = await db.select().from(profiles).where(eq(profiles.userId, userIdNum)).limit(1);
    if (profileResult.length > 0) {
      const currentXp = profileResult[0].xpTotal;
      const [updated] = await db.update(profiles)
        .set({ xpTotal: currentXp + amount, updatedAt: new Date() })
        .where(eq(profiles.userId, userIdNum))
        .returning();
      return updated;
    }
    return null;
  },

  async addCurrency(userId, { coins = 0, diamonds = 0 }) {
    const userIdNum = parseInt(userId);
    const profileResult = await db.select().from(profiles).where(eq(profiles.userId, userIdNum)).limit(1);
    if (profileResult.length > 0) {
      const currentCoins = profileResult[0].coins;
      const currentDiamonds = profileResult[0].diamonds;
      const [updated] = await db.update(profiles)
        .set({ 
          coins: currentCoins + coins, 
          diamonds: currentDiamonds + diamonds, 
          updatedAt: new Date() 
        })
        .where(eq(profiles.userId, userIdNum))
        .returning();
      return updated;
    }
    return null;
  },

  async updateStreak(userId) {
    const userIdNum = parseInt(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [profileData] = await db.select().from(profiles).where(eq(profiles.userId, userIdNum)).limit(1);
    if (!profileData) return null;

    let newStreak = profileData.streakCount;
    const lastActive = profileData.lastActiveDate ? new Date(profileData.lastActiveDate) : null;

    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already active today, streak stays the same
      } else if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // broken streak reset
      }
    } else {
      newStreak = 1; // start new streak
    }

    const [updated] = await db.update(profiles)
      .set({
        streakCount: newStreak,
        lastActiveDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, userIdNum))
      .returning();
    
    return updated;
  },

  async getLeaderboard(limit = 10) {
    return await db.select({
      userId: profiles.userId,
      username: users.username,
      xpTotal: profiles.xpTotal,
      streakCount: profiles.streakCount,
      currentLeague: profiles.currentLeague
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .orderBy(desc(profiles.xpTotal))
    .limit(limit);
  }
};
export default userRepository;
