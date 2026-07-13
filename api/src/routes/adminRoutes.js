import { adminController } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

export default async function adminRoutes(fastify, options) {
  // Guard all admin routes with authentication and admin authorizations hooks
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireAdmin);

  // Analytics Stats & Seeding
  fastify.get('/stats', adminController.getStats);
  fastify.post('/seed', adminController.handleSeed);

  // Languages CRUD
  fastify.get('/languages', adminController.getLanguages);
  fastify.post('/languages', adminController.createLanguage);
  fastify.put('/languages/:id', adminController.updateLanguage);
  fastify.delete('/languages/:id', adminController.deleteLanguage);

  // Units CRUD
  fastify.get('/units', adminController.getUnits);
  fastify.post('/units', adminController.createUnit);
  fastify.put('/units/:id', adminController.updateUnit);
  fastify.delete('/units/:id', adminController.deleteUnit);

  // Chapters CRUD
  fastify.get('/chapters', adminController.getChapters);
  fastify.post('/chapters', adminController.createChapter);
  fastify.put('/chapters/:id', adminController.updateChapter);
  fastify.delete('/chapters/:id', adminController.deleteChapter);

  // Lessons CRUD
  fastify.get('/lessons', adminController.getLessons);
  fastify.post('/lessons', adminController.createLesson);
  fastify.put('/lessons/:id', adminController.updateLesson);
  fastify.delete('/lessons/:id', adminController.deleteLesson);

  // Exercises CRUD
  fastify.get('/exercises', adminController.getExercises);
  fastify.post('/exercises', adminController.createExercise);
  fastify.put('/exercises/:id', adminController.updateExercise);
  fastify.delete('/exercises/:id', adminController.deleteExercise);

  // Users CRUD
  fastify.get('/users', adminController.getUsers);
  fastify.put('/users/:id', adminController.updateUser);
  fastify.delete('/users/:id', adminController.deleteUser);
}
