import { lessonRepository } from '../repositories/lessonRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { redisService } from '../services/redisService.js';

export const dashboardController = {
  async getDashboard(request, reply) {
    const userId = request.user.id;
    const cacheKey = `cache:dashboard:user:${userId}`;
    try {
      // Return cached dashboard data if available
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const profile = request.user.profile;
      const currentLanguageId = profile?.currentLanguageId || 1;

      // Fetch active languages
      const activeLanguages = await lessonRepository.getLanguages();
      const currentLanguage = activeLanguages.find(l => l.id === currentLanguageId) || activeLanguages[0];

      if (!currentLanguage) {
        reply.status(400).send({ error: 'No active languages seeded. Please configure initial tracks first.' });
        return;
      }

      // Fetch all units, chapters, and lessons for this language
      const unitsList = await lessonRepository.getUnits(currentLanguage.id);
      const unitsWithChapters = [];

      for (const unit of unitsList) {
        const chaptersList = await lessonRepository.getChapters(unit.id);
        const chaptersWithLessons = [];

        for (const chapter of chaptersList) {
          const lessonsList = await lessonRepository.getLessons(chapter.id);
          chaptersWithLessons.push({
            ...chapter,
            lessons: lessonsList
          });
        }
        unitsWithChapters.push({
          ...unit,
          chapters: chaptersWithLessons
        });
      }

      // Fetch completed lessons for curriculum map lock states
      const completedLessons = await progressRepository.getCompletedLessons(request.user.id);
      const completedSet = new Set(completedLessons);

      // Determine next lesson for onboarding
      let nextLesson = null;
      let firstLockedFound = false;

      for (const unit of unitsWithChapters) {
        for (const chapter of unit.chapters) {
          for (const lesson of chapter.lessons) {
            if (!completedSet.has(lesson.id)) {
              if (!firstLockedFound) {
                nextLesson = lesson;
                firstLockedFound = true;
              }
            }
          }
        }
      }

      // If all lessons are completed, review the first one
      if (!nextLesson && unitsWithChapters.length > 0 && unitsWithChapters[0].chapters.length > 0 && unitsWithChapters[0].chapters[0].lessons.length > 0) {
        nextLesson = unitsWithChapters[0].chapters[0].lessons[0];
      }

      // Fetch achievements list
      const userUnlocks = await progressRepository.getUserAchievements(request.user.id);

      const dailyGoalXp = 50;
      const currentXp = request.user.profile?.xpTotal || 0;

      const result = {
        success: true,
        currentLanguage,
        activeLanguages,
        units: unitsWithChapters,
        completedLessons: Array.from(completedSet),
        nextLesson,
        achievements: userUnlocks,
        dailyGoalXp,
        currentXp
      };

      // Cache user dashboard for 5 minutes
      await redisService.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      request.log.error('Dashboard REST error:', error);
      reply.status(500).send({ error: 'Internal server error loading dashboard.' });
    }
  },

  async getLeaderboard(request, reply) {
    const cacheKey = 'cache:leaderboard';
    try {
      // Return cached leaderboard list if available
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const leaderboardData = await userRepository.getLeaderboard(10);
      
      // Inject mock competitors to make leagues feel alive in development
      const mockCompetitors = [
        { userId: 991, username: 'aria_notion', xpTotal: 1420, streakCount: 12, currentLeague: 'Bronze' },
        { userId: 992, username: 'arc_surfer', xpTotal: 1150, streakCount: 8, currentLeague: 'Bronze' },
        { userId: 993, username: 'linear_flow', xpTotal: 980, streakCount: 15, currentLeague: 'Bronze' },
        { userId: 994, username: 'bhasha_ninja', xpTotal: 650, streakCount: 4, currentLeague: 'Bronze' },
        { userId: 995, username: 'pixel_perfect', xpTotal: 410, streakCount: 19, currentLeague: 'Bronze' }
      ];

      const userInList = leaderboardData.some(p => p.userId === request.user.id);
      if (!userInList) {
        leaderboardData.push({
          userId: request.user.id,
          username: request.user.username,
          xpTotal: request.user.profile?.xpTotal || 0,
          streakCount: request.user.profile?.streakCount || 0,
          currentLeague: request.user.profile?.currentLeague || 'Bronze'
        });
      }

      const mergedList = [...leaderboardData];
      mockCompetitors.forEach(comp => {
        if (!mergedList.some(p => p.username === comp.username)) {
          mergedList.push(comp);
        }
      });

      mergedList.sort((a, b) => b.xpTotal - a.xpTotal);

      const result = {
        success: true,
        leaderboard: mergedList
      };

      // Cache leaderboard for 2 minutes
      await redisService.set(cacheKey, result, 120);

      return result;
    } catch (error) {
      request.log.error('Leaderboard REST error:', error);
      reply.status(500).send({ error: 'Internal server error loading leaderboard.' });
    }
  },

  async selectLanguage(request, reply) {
    const { languageId } = request.body || {};
    if (!languageId) {
      reply.status(400).send({ error: 'Language ID is required.' });
      return;
    }

    try {
      await userRepository.updateProfile(request.user.id, { currentLanguageId: parseInt(languageId) });
      // Invalidate cached dashboard for this user
      await redisService.del(`cache:dashboard:user:${request.user.id}`);
      return { success: true, message: 'Language updated successfully.' };
    } catch (error) {
      request.log.error('Language selection error:', error);
      reply.status(500).send({ error: 'Failed to update current language.' });
    }
  }
};
