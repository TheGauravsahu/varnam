import { vocabularyController } from '../controllers/vocabularyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export default async function vocabularyRoutes(fastify, options) {
  // All vocabulary endpoints require authentication
  fastify.addHook('preHandler', requireAuth);

  // ── Vocabulary Notebook ───────────────────────────────────────────────────────
  // GET    /api/vocabulary          → list all words (?favorite=true, ?search=term)
  fastify.get('/', vocabularyController.getVocabulary);

  // POST   /api/vocabulary          → add a word manually
  fastify.post('/', vocabularyController.addWord);

  // PUT    /api/vocabulary/:vocabId → update notes / favorite / translation
  fastify.put('/:vocabId', vocabularyController.updateWord);

  // DELETE /api/vocabulary/:vocabId → remove a word
  fastify.delete('/:vocabId', vocabularyController.deleteWord);

  // ── Flashcards (SM-2) ─────────────────────────────────────────────────────────
  // GET  /api/vocabulary/flashcards              → words due for review
  fastify.get('/flashcards', vocabularyController.getFlashcards);

  // POST /api/vocabulary/flashcards/:vocabId/review → submit review result
  fastify.post('/flashcards/:vocabId/review', vocabularyController.reviewFlashcard);
}
