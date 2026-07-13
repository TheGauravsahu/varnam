import { db } from '../db/index.js';
import { users, profiles, friends, clubs, clubMembers, xpLogs } from '../db/schema.js';
import { eq, and, or, desc, asc, sql, gte, count } from 'drizzle-orm';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Returns the ISO date string (YYYY-MM-DD) of N days ago from today (UTC).
 */
function daysAgoISO(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── CONTROLLER ───────────────────────────────────────────────────────────────

export const communityController = {
  // ── Leaderboard ─────────────────────────────────────────────────────────────

  /**
   * GET /api/community/leaderboard?type=global|weekly|monthly|friends
   * Returns top 50 users ranked by XP.
   *
   * - global/friends: sorted by xpTotal (all time). friends filters to accepted friends.
   * - weekly/monthly: sorted by XP earned in last 7/30 days via xp_logs.
   *
   * All responses include rank numbers starting from 1.
   */
  async getLeaderboard(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { type = 'global' } = request.query || {};

    try {
      let rows = [];

      if (type === 'weekly' || type === 'monthly') {
        // Compute XP earned in the time window using xp_logs aggregation
        const daysBack = type === 'weekly' ? 7 : 30;
        const since = daysAgoISO(daysBack);

        // Aggregate XP per user for the window, join to users + profiles
        const aggregated = await db
          .select({
            userId: xpLogs.userId,
            username: users.username,
            xpEarned: sql`SUM(${xpLogs.amount})`.as('xp_earned'),
            streakCount: profiles.streakCount,
            currentLeague: profiles.currentLeague,
          })
          .from(xpLogs)
          .innerJoin(users, eq(xpLogs.userId, users.id))
          .innerJoin(profiles, eq(xpLogs.userId, profiles.userId))
          .where(gte(xpLogs.createdAt, since))
          .groupBy(xpLogs.userId, users.username, profiles.streakCount, profiles.currentLeague)
          .orderBy(desc(sql`SUM(${xpLogs.amount})`))
          .limit(50);

        rows = aggregated.map((r, idx) => ({ rank: idx + 1, ...r }));

      } else if (type === 'friends') {
        // Find accepted friend IDs for this user
        const friendships = await db
          .select()
          .from(friends)
          .where(
            and(
              or(eq(friends.userId, userIdNum), eq(friends.friendId, userIdNum)),
              eq(friends.status, 'accepted')
            )
          );

        const friendIds = friendships.map(f =>
          f.userId === userIdNum ? f.friendId : f.userId
        );

        // Always include self
        const participantIds = Array.from(new Set([userIdNum, ...friendIds]));

        // Fetch profiles + users for all participants
        const leaderboardRows = await db
          .select({
            userId: profiles.userId,
            username: users.username,
            xpTotal: profiles.xpTotal,
            streakCount: profiles.streakCount,
            currentLeague: profiles.currentLeague,
          })
          .from(profiles)
          .innerJoin(users, eq(profiles.userId, users.id))
          .where(sql`${profiles.userId} = ANY(${sql.raw(`ARRAY[${participantIds.join(',')}]`)})`)
          .orderBy(desc(profiles.xpTotal));

        rows = leaderboardRows.map((r, idx) => ({ rank: idx + 1, ...r }));

      } else {
        // Global: top 50 by all-time xpTotal
        const globalRows = await db
          .select({
            userId: profiles.userId,
            username: users.username,
            xpTotal: profiles.xpTotal,
            streakCount: profiles.streakCount,
            currentLeague: profiles.currentLeague,
          })
          .from(profiles)
          .innerJoin(users, eq(profiles.userId, users.id))
          .orderBy(desc(profiles.xpTotal))
          .limit(50);

        rows = globalRows.map((r, idx) => ({ rank: idx + 1, ...r }));
      }

      // Mark the current user's row
      const enriched = rows.map(r => ({
        ...r,
        isCurrentUser: r.userId === userIdNum,
      }));

      return { success: true, type, leaderboard: enriched };
    } catch (error) {
      request.log.error('Error fetching leaderboard:', error);
      reply.status(500).send({ error: 'Failed to load leaderboard.' });
    }
  },

  // ── Clubs ────────────────────────────────────────────────────────────────────

  /**
   * GET /api/community/clubs?page=1&limit=20
   * Returns a paginated list of clubs ordered by weeklyXp desc.
   */
  async getClubs(request, reply) {
    const { page = 1, limit = 20 } = request.query || {};
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    try {
      const clubList = await db
        .select()
        .from(clubs)
        .orderBy(desc(clubs.weeklyXp), asc(clubs.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Total count for pagination metadata
      const [{ total }] = await db
        .select({ total: sql`COUNT(*)`.as('total') })
        .from(clubs);

      return {
        success: true,
        clubs: clubList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: parseInt(total),
          totalPages: Math.ceil(parseInt(total) / limitNum),
        },
      };
    } catch (error) {
      request.log.error('Error fetching clubs:', error);
      reply.status(500).send({ error: 'Failed to load clubs.' });
    }
  },

  /**
   * GET /api/community/clubs/:clubId
   * Returns club details with full member list (username, xpTotal, streak, role).
   */
  async getClub(request, reply) {
    const { clubId } = request.params;

    try {
      const [club] = await db
        .select()
        .from(clubs)
        .where(eq(clubs.id, parseInt(clubId)))
        .limit(1);

      if (!club) {
        reply.status(404).send({ error: 'Club not found.' });
        return;
      }

      // Fetch members with their profile stats
      const members = await db
        .select({
          memberId: clubMembers.id,
          userId: clubMembers.userId,
          username: users.username,
          role: clubMembers.role,
          joinedAt: clubMembers.joinedAt,
          xpTotal: profiles.xpTotal,
          streakCount: profiles.streakCount,
          currentLeague: profiles.currentLeague,
        })
        .from(clubMembers)
        .innerJoin(users, eq(clubMembers.userId, users.id))
        .innerJoin(profiles, eq(clubMembers.userId, profiles.userId))
        .where(eq(clubMembers.clubId, parseInt(clubId)))
        .orderBy(desc(profiles.xpTotal));

      return { success: true, club, members };
    } catch (error) {
      request.log.error('Error fetching club:', error);
      reply.status(500).send({ error: 'Failed to load club.' });
    }
  },

  /**
   * POST /api/community/clubs
   * Body: { name, description?, languageId?, emoji? }
   * Creates a new club and auto-joins the creator as admin.
   */
  async createClub(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { name, description, languageId, emoji } = request.body || {};

    if (!name || !name.trim()) {
      reply.status(400).send({ error: 'Club name is required.' });
      return;
    }

    try {
      // Create the club
      const [club] = await db
        .insert(clubs)
        .values({
          name: name.trim(),
          description: description || null,
          languageId: languageId ? parseInt(languageId) : null,
          emoji: emoji || '🏛️',
          createdBy: userIdNum,
          memberCount: 1,
          weeklyXp: 0,
        })
        .returning();

      // Auto-join creator as admin
      await db.insert(clubMembers).values({
        clubId: club.id,
        userId: userIdNum,
        role: 'admin',
      });

      return {
        success: true,
        message: `Club "${club.name}" created successfully!`,
        club,
      };
    } catch (error) {
      request.log.error('Error creating club:', error);
      reply.status(500).send({ error: 'Failed to create club.' });
    }
  },

  /**
   * POST /api/community/clubs/:clubId/join
   * Toggles membership: joins if not a member, leaves if already a member.
   * Club admins cannot leave via this endpoint (they must transfer ownership first).
   */
  async joinClub(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { clubId } = request.params;
    const clubIdNum = parseInt(clubId);

    try {
      const [club] = await db
        .select()
        .from(clubs)
        .where(eq(clubs.id, clubIdNum))
        .limit(1);

      if (!club) {
        reply.status(404).send({ error: 'Club not found.' });
        return;
      }

      // Check if already a member
      const [existing] = await db
        .select()
        .from(clubMembers)
        .where(and(eq(clubMembers.clubId, clubIdNum), eq(clubMembers.userId, userIdNum)))
        .limit(1);

      if (existing) {
        // Leave logic
        if (existing.role === 'admin') {
          reply.status(400).send({ error: 'Club admins cannot leave. Transfer ownership first.' });
          return;
        }

        await db.delete(clubMembers).where(eq(clubMembers.id, existing.id));

        // Decrement member count (floor at 0)
        await db
          .update(clubs)
          .set({ memberCount: Math.max(0, club.memberCount - 1) })
          .where(eq(clubs.id, clubIdNum));

        return { success: true, action: 'left', message: `Left club "${club.name}".` };
      } else {
        // Join logic
        await db.insert(clubMembers).values({
          clubId: clubIdNum,
          userId: userIdNum,
          role: 'member',
        });

        await db
          .update(clubs)
          .set({ memberCount: club.memberCount + 1 })
          .where(eq(clubs.id, clubIdNum));

        return { success: true, action: 'joined', message: `Joined club "${club.name}"!` };
      }
    } catch (error) {
      request.log.error('Error joining/leaving club:', error);
      reply.status(500).send({ error: 'Failed to update club membership.' });
    }
  },
};
