import { lessonRepository } from '../repositories/lessonRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { calculateLevel } from '../utils/levelCalculator.js';
import { redisService } from '../services/redisService.js';
import { db } from '../db/index.js';
import { vocabularyNotebook, lessons, chapters, units } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const lessonController = {
  async getLesson(request, reply) {
    const { id } = request.params;
    try {
      const lesson = await lessonRepository.getLessonById(id);
      if (!lesson) {
        reply.status(404).send({ error: 'Lesson not found.' });
        return;
      }

      const exercises = await lessonRepository.getExercises(id);
      
      // Parse choices properly if stringified in database
      const cleanExercises = exercises.map(ex => ({
        id: ex.id,
        type: ex.type,
        instruction: ex.instruction,
        questionText: ex.questionText,
        correctAnswer: ex.correctAnswer,
        choices: typeof ex.choices === 'string' ? JSON.parse(ex.choices) : ex.choices,
        order: ex.order
      }));

      return {
        success: true,
        lesson,
        exercises: cleanExercises
      };
    } catch (error) {
      request.log.error('Error fetching lesson REST:', error);
      reply.status(500).send({ error: 'Internal server error loading lesson.' });
    }
  },

  async submitLesson(request, reply) {
    const { id } = request.params;
    const { score, total, perfectLesson, comboActive } = request.body || {};
    
    const scoreNum = parseInt(score || 0);
    const totalNum = parseInt(total || 1);
    const accuracy = Math.round((scoreNum / totalNum) * 100);
    const isPerfect = perfectLesson || accuracy === 100;

    try {
      const lesson = await lessonRepository.getLessonById(id);
      if (!lesson) {
        reply.status(404).send({ error: 'Lesson not found.' });
        return;
      }

      // Base XP reward
      let xpEarned = lesson.xpReward;
      let coinsEarned = 10;
      let diamondsEarned = 0;

      // Perfect score/lesson bonus
      if (isPerfect) {
        xpEarned += 25;      // +25 XP perfect lesson bonus
        coinsEarned += 15;    // +15 coins
        diamondsEarned += 5;  // +5 gems/diamonds
      }

      // Combo active multiplier (1.5x)
      if (comboActive) {
        xpEarned = Math.round(xpEarned * 1.5);
      }

      // Save user progress
      await progressRepository.saveProgress({
        userId: request.user.id,
        lessonId: lesson.id,
        score: accuracy
      });

      // Update XP
      await userRepository.addXP(request.user.id, xpEarned, `Lesson Complete: ${lesson.title}`);
      
      // Update currency
      await userRepository.addCurrency(request.user.id, { 
        coins: coinsEarned, 
        diamonds: diamondsEarned 
      });

      // Update active streak
      const updatedProfile = await userRepository.updateStreak(request.user.id);

      // Check for achievements
      const newlyUnlocked = await progressRepository.checkAndUnlockAchievements(request.user.id);

      // Calculate fresh level stats for real-time progress bar updating
      const freshLevelStats = calculateLevel(updatedProfile?.xpTotal || 0);

      // --- AUTO-SAVE VOCABULARY TO NOTEBOOK ---
      try {
        const exercisesList = await lessonRepository.getExercises(lesson.id);
        const [lessonWithLanguage] = await db
          .select({ languageId: units.languageId })
          .from(lessons)
          .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
          .innerJoin(units, eq(chapters.unitId, units.id))
          .where(eq(lessons.id, lesson.id))
          .limit(1);

        for (const ex of exercisesList) {
          if (ex.type !== 'true_false' && ex.correctAnswer && ex.questionText) {
            const wordStr = ex.correctAnswer.trim();
            const transStr = ex.questionText.trim();

            if (wordStr.length > 0 && wordStr.length < 100 && !wordStr.includes('_')) {
              // Check if already saved
              const existingWord = await db
                .select()
                .from(vocabularyNotebook)
                .where(and(
                  eq(vocabularyNotebook.userId, request.user.id),
                  eq(vocabularyNotebook.word, wordStr)
                ))
                .limit(1);

              if (existingWord.length === 0) {
                await db.insert(vocabularyNotebook).values({
                  userId: request.user.id,
                  languageId: lessonWithLanguage?.languageId || null,
                  word: wordStr,
                  translation: transStr,
                  sourceType: 'lesson',
                  sourceLessonId: lesson.id,
                });
              }
            }
          }
        }
      } catch (vocabErr) {
        request.log.error('Failed to auto-save vocabulary:', vocabErr);
      }

      // Clear redis cache blocks
      await redisService.del(`cache:dashboard:user:${request.user.id}`);
      await redisService.del('cache:leaderboard');

      return {
        success: true,
        accuracy,
        xpEarned,
        coinsEarned,
        diamondsEarned,
        perfectLesson: isPerfect,
        comboActive,
        profile: updatedProfile,
        levelStats: freshLevelStats,
        newlyUnlocked
      };
    } catch (error) {
      request.log.error('Error submitting lesson REST:', error);
      reply.status(500).send({ error: 'Internal server error evaluating lesson progress.' });
    }
  }
};

