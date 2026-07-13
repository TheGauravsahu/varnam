import { avatarController } from '../controllers/avatarController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function avatarRoutes(fastify, options) {
  // All avatar endpoints require authentication
  fastify.addHook('preHandler', requireAuth);

  // GET  /api/avatar/items     → catalog with isUnlocked flag per user
  fastify.get('/items', avatarController.getAvatarItems);

  // POST /api/avatar/equip     → equip an item (body: { itemId, category })
  fastify.post('/equip', avatarController.equipItem);

  // GET  /api/avatar/equipped  → full equipped loadout for the current user
  fastify.get('/equipped', avatarController.getEquippedAvatar);
}
