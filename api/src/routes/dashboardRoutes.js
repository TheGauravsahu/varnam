import { dashboardController } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function dashboardRoutes(fastify, options) {
  // Add authentication hook for all dashboard endpoints
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', dashboardController.getDashboard);
  fastify.get('/leaderboard', dashboardController.getLeaderboard);
  fastify.post('/select-language', dashboardController.selectLanguage);
}
