import { gamificationController } from '../controllers/gamificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function gamificationRoutes(fastify, options) {
  // All gamification endpoints require authentication
  fastify.addHook('preHandler', requireAuth);

  // ── Daily Quests ─────────────────────────────────────────────────────────────
  // GET  /api/gamification/quests          → today's quests with user progress
  fastify.get('/quests', gamificationController.getDailyQuests);

  // POST /api/gamification/quests/:userQuestId/claim → claim a completed quest
  fastify.post('/quests/:userQuestId/claim', gamificationController.claimDailyQuest);

  // ── Weekly Missions ───────────────────────────────────────────────────────────
  // GET  /api/gamification/missions        → this week's missions with progress
  fastify.get('/missions', gamificationController.getWeeklyMissions);

  // ── Seasonal Events ───────────────────────────────────────────────────────────
  // GET  /api/gamification/events          → active seasonal events with progress
  fastify.get('/events', gamificationController.getSeasonalEvents);

  // ── Spin Wheel ────────────────────────────────────────────────────────────────
  // GET  /api/gamification/spin            → check if user can spin + time remaining
  fastify.get('/spin', gamificationController.getSpinWheel);

  // POST /api/gamification/spin            → execute a spin (24h cooldown enforced)
  fastify.post('/spin', gamificationController.doSpinWheel);

  // ── Treasure Chests ───────────────────────────────────────────────────────────
  // GET  /api/gamification/chests          → get user's unopened chests
  fastify.get('/chests', gamificationController.getUserChests);

  // POST /api/gamification/chests/:chestId/open → open a specific chest
  fastify.post('/chests/:chestId/open', gamificationController.openChest);
}
