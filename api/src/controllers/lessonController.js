import { lessonRepository } from '../repositories/lessonRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { calculateLevel } from '../utils/levelCalculator.js';
import { redisService } from '../services/redisService.js';

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
    const { score, total } = request.body || {};
    
    const scoreNum = parseInt(score || 0);
    const totalNum = parseInt(total || 1);
    const accuracy = Math.round((scoreNum / totalNum) * 100);

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

      // Perfect score bonus
      if (accuracy === 100) {
        xpEarned += 10;      // +10 XP bonus
        coinsEarned += 5;     // +5 coins
        diamondsEarned += 2;  // +2 gems/diamonds
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

      // Clear redis cache blocks
      await redisService.del(`cache:dashboard:user:${request.user.id}`);
      await redisService.del('cache:leaderboard');

      return {
        success: true,
        accuracy,
        xpEarned,
        coinsEarned,
        diamondsEarned,
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
