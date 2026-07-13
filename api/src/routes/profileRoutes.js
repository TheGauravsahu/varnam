import { profileController } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function profileRoutes(fastify, options) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', profileController.getProfile);
  fastify.post('/follow', profileController.followFriend);
  fastify.put('/settings', profileController.updateSettings);
}
