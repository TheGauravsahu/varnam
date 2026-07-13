import { lessonController } from '../controllers/lessonController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function lessonRoutes(fastify, options) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/:id', lessonController.getLesson);
  fastify.post('/:id/submit', lessonController.submitLesson);
}
