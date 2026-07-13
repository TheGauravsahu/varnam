import { authController } from '../controllers/authController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

export default async function authRoutes(fastify, options) {
  fastify.post('/signup', authController.postSignup);
  fastify.post('/login', authController.postLogin);
  fastify.post('/logout', authController.postLogout);
  fastify.get('/me', { preHandler: optionalAuth }, authController.getMe);
}
