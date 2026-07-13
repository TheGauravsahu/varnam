import { db } from '../db/index.js';
import { vocabularyNotebook, flashcardReviews } from '../db/schema.js';
import { eq, and, lte, ilike, or } from 'drizzle-orm';

export const vocabularyController = {
  /**
   * GET /api/vocabulary
   * Returns all vocabulary entries for the current user.
   * Supports optional query params:
   *   ?favorite=true  — filter to favorites only
   *   ?search=term    — filter by word or translation containing term
   */
  async getVocabulary(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { favorite, search } = request.query || {};

    try {
      // Build conditions array
      const conditions = [eq(vocabularyNotebook.userId, userIdNum)];

      if (favorite === 'true') {
        conditions.push(eq(vocabularyNotebook.isFavorite, true));
      }

      // Fetch with conditions
      let results = await db
        .select()
        .from(vocabularyNotebook)
        .where(and(...conditions))
        .orderBy(vocabularyNotebook.addedAt);

      // Apply search filter in JS (simpler than composing complex drizzle OR queries)
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        results = results.filter(
          v =>
            v.word.toLowerCase().includes(term) ||
            v.translation.toLowerCase().includes(term) ||
            (v.notes && v.notes.toLowerCase().includes(term))
        );
      }

      return { success: true, count: results.length, vocabulary: results };
    } catch (error) {
      request.log.error('Error fetching vocabulary:', error);
      reply.status(500).send({ error: 'Failed to load vocabulary.' });
    }
  },

  /**
   * POST /api/vocabulary
   * Body: { word, translation, exampleSentence?, synonyms?, notes?, languageId? }
   * Manually adds a word to the user's vocabulary notebook.
   */
  async addWord(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { word, translation, exampleSentence, synonyms, notes, languageId } = request.body || {};

    if (!word || !translation) {
      reply.status(400).send({ error: 'word and translation are required.' });
      return;
    }

    try {
      const [entry] = await db
        .insert(vocabularyNotebook)
        .values({
          userId: userIdNum,
          languageId: languageId ? parseInt(languageId) : null,
          word: word.trim(),
          translation: translation.trim(),
          exampleSentence: exampleSentence || null,
          synonyms: synonyms || null,
          notes: notes || null,
          isFavorite: false,
          sourceType: 'manual',
        })
        .returning();

      return { success: true, message: 'Word added to notebook.', entry };
    } catch (error) {
      request.log.error('Error adding vocabulary word:', error);
      reply.status(500).send({ error: 'Failed to add word.' });
    }
  },

  /**
   * PUT /api/vocabulary/:vocabId
   * Body: { notes?, isFavorite?, exampleSentence?, synonyms?, translation? }
   * Updates a vocabulary entry belonging to the current user.
   */
  async updateWord(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { vocabId } = request.params;
    const { notes, isFavorite, exampleSentence, synonyms, translation } = request.body || {};

    try {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(vocabularyNotebook)
        .where(and(eq(vocabularyNotebook.id, parseInt(vocabId)), eq(vocabularyNotebook.userId, userIdNum)))
        .limit(1);

      if (!existing) {
        reply.status(404).send({ error: 'Vocabulary entry not found.' });
        return;
      }

      // Build update payload — only include defined fields
      const updates = { updatedAt: new Date() };
      if (notes !== undefined)          updates.notes = notes;
      if (isFavorite !== undefined)     updates.isFavorite = isFavorite;
      if (exampleSentence !== undefined) updates.exampleSentence = exampleSentence;
      if (synonyms !== undefined)       updates.synonyms = synonyms;
      if (translation !== undefined)    updates.translation = translation;

      const [updated] = await db
        .update(vocabularyNotebook)
        .set(updates)
        .where(eq(vocabularyNotebook.id, parseInt(vocabId)))
        .returning();

      return { success: true, message: 'Vocabulary entry updated.', entry: updated };
    } catch (error) {
      request.log.error('Error updating vocabulary word:', error);
      reply.status(500).send({ error: 'Failed to update word.' });
    }
  },

  /**
   * DELETE /api/vocabulary/:vocabId
   * Deletes a vocabulary entry (cascade deletes its flashcard_review).
   */
  async deleteWord(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { vocabId } = request.params;

    try {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(vocabularyNotebook)
        .where(and(eq(vocabularyNotebook.id, parseInt(vocabId)), eq(vocabularyNotebook.userId, userIdNum)))
        .limit(1);

      if (!existing) {
        reply.status(404).send({ error: 'Vocabulary entry not found.' });
        return;
      }

      await db
        .delete(vocabularyNotebook)
        .where(eq(vocabularyNotebook.id, parseInt(vocabId)));

      return { success: true, message: 'Word removed from notebook.' };
    } catch (error) {
      request.log.error('Error deleting vocabulary word:', error);
      reply.status(500).send({ error: 'Failed to delete word.' });
    }
  },

  // ── Flashcards (SM-2) ────────────────────────────────────────────────────────

  /**
   * GET /api/vocabulary/flashcards
   * Returns vocabulary items due for review (nextReviewDate <= now).
   * Auto-creates flashcard_reviews rows for vocab items that don't have them yet.
   */
  async getFlashcards(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const now = new Date();

    try {
      // Fetch all vocab entries for this user
      const allVocab = await db
        .select()
        .from(vocabularyNotebook)
        .where(eq(vocabularyNotebook.userId, userIdNum));

      if (allVocab.length === 0) {
        return { success: true, flashcards: [] };
      }

      // Fetch existing flashcard review rows
      const existingReviews = await db
        .select()
        .from(flashcardReviews)
        .where(eq(flashcardReviews.userId, userIdNum));

      const reviewMap = Object.fromEntries(existingReviews.map(r => [r.vocabId, r]));

      // Create missing review rows (due now for first review)
      const missingVocabIds = allVocab.filter(v => !reviewMap[v.id]);
      if (missingVocabIds.length > 0) {
        const inserted = await db
          .insert(flashcardReviews)
          .values(
            missingVocabIds.map(v => ({
              userId: userIdNum,
              vocabId: v.id,
              easeFactor: 250,
              interval: 1,
              repetitions: 0,
              nextReviewDate: now, // due immediately
              lastReviewedAt: null,
            }))
          )
          .returning();
        inserted.forEach(r => { reviewMap[r.vocabId] = r; });
      }

      // Filter to vocab whose nextReviewDate <= now
      const dueVocab = allVocab.filter(v => {
        const review = reviewMap[v.id];
        return review && new Date(review.nextReviewDate) <= now;
      });

      // Merge review state into vocab objects
      const flashcards = dueVocab.map(v => ({
        ...v,
        review: reviewMap[v.id],
      }));

      return { success: true, count: flashcards.length, flashcards };
    } catch (error) {
      request.log.error('Error fetching flashcards:', error);
      reply.status(500).send({ error: 'Failed to load flashcards.' });
    }
  },

  /**
   * POST /api/vocabulary/flashcards/:vocabId/review
   * Body: { result: 'remember' | 'forgot' }
   *
   * Implements a simplified SM-2 algorithm:
   *   forgot  → interval = 1, repetitions = 0  (reset)
   *   remember → interval = max(1, min(365, interval * 2)), repetitions++
   *
   * nextReviewDate = now + interval days
   */
  async reviewFlashcard(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { vocabId } = request.params;
    const { result } = request.body || {};

    if (!result || !['remember', 'forgot'].includes(result)) {
      reply.status(400).send({ error: 'result must be "remember" or "forgot".' });
      return;
    }

    const vocabIdNum = parseInt(vocabId);

    try {
      // Verify vocab belongs to user
      const [vocab] = await db
        .select()
        .from(vocabularyNotebook)
        .where(and(eq(vocabularyNotebook.id, vocabIdNum), eq(vocabularyNotebook.userId, userIdNum)))
        .limit(1);

      if (!vocab) {
        reply.status(404).send({ error: 'Vocabulary entry not found.' });
        return;
      }

      // Fetch or create review row
      let [review] = await db
        .select()
        .from(flashcardReviews)
        .where(and(eq(flashcardReviews.vocabId, vocabIdNum), eq(flashcardReviews.userId, userIdNum)))
        .limit(1);

      const now = new Date();

      let newInterval;
      let newRepetitions;
      let newEaseFactor = 250; // keep constant per simplified spec

      if (result === 'forgot') {
        // Reset to beginning
        newInterval = 1;
        newRepetitions = 0;
      } else {
        // remember: double the interval, cap at 365 days
        const currentInterval = review ? review.interval : 1;
        const currentRepetitions = review ? review.repetitions : 0;
        newInterval = Math.min(365, Math.max(1, currentInterval * 2));
        newRepetitions = currentRepetitions + 1;
      }

      // nextReviewDate = now + newInterval days
      const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

      if (!review) {
        // Create new review row
        [review] = await db
          .insert(flashcardReviews)
          .values({
            userId: userIdNum,
            vocabId: vocabIdNum,
            easeFactor: newEaseFactor,
            interval: newInterval,
            repetitions: newRepetitions,
            nextReviewDate,
            lastReviewedAt: now,
          })
          .returning();
      } else {
        // Update existing
        [review] = await db
          .update(flashcardReviews)
          .set({
            easeFactor: newEaseFactor,
            interval: newInterval,
            repetitions: newRepetitions,
            nextReviewDate,
            lastReviewedAt: now,
          })
          .where(eq(flashcardReviews.id, review.id))
          .returning();
      }

      return {
        success: true,
        result,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReviewDate: nextReviewDate.toISOString(),
        review,
      };
    } catch (error) {
      request.log.error('Error reviewing flashcard:', error);
      reply.status(500).send({ error: 'Failed to record flashcard review.' });
    }
  },
};
