import { db } from '../db/index.js';
import { friends, users, profiles } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const friendRepository = {
  async followFriend(userId, friendId) {
    const userIdNum = parseInt(userId);
    const friendIdNum = parseInt(friendId);

    const exists = await db.select().from(friends)
      .where(and(eq(friends.userId, userIdNum), eq(friends.friendId, friendIdNum)))
      .limit(1);
    
    if (exists.length > 0) return null;

    const [inserted] = await db.insert(friends).values({
      userId: userIdNum,
      friendId: friendIdNum,
      status: 'accepted'
    }).returning();
    return inserted;
  },

  async getFriends(userId) {
    const userIdNum = parseInt(userId);
    return await db.select({
      id: users.id,
      username: users.username,
      streakCount: profiles.streakCount,
      xpTotal: profiles.xpTotal
    })
    .from(friends)
    .innerJoin(users, eq(friends.friendId, users.id))
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(friends.userId, userIdNum));
  }
};
export default friendRepository;
