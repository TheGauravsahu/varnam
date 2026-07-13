import { communityController } from '../controllers/communityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function communityRoutes(fastify, options) {
  // All community endpoints require authentication
  fastify.addHook('preHandler', requireAuth);

  // ── Leaderboard ───────────────────────────────────────────────────────────────
  // GET  /api/community/leaderboard?type=global|weekly|monthly|friends
  fastify.get('/leaderboard', communityController.getLeaderboard);

  // ── Clubs ─────────────────────────────────────────────────────────────────────
  // GET  /api/community/clubs               → paginated list (?page=1&limit=20)
  fastify.get('/clubs', communityController.getClubs);

  // POST /api/community/clubs               → create a new club
  fastify.post('/clubs', communityController.createClub);

  // GET  /api/community/clubs/:clubId       → club detail + member list
  fastify.get('/clubs/:clubId', communityController.getClub);

  // POST /api/community/clubs/:clubId/join  → join or leave a club (toggle)
  fastify.post('/clubs/:clubId/join', communityController.joinClub);
}
