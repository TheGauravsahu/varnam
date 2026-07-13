import { userRepository } from '../repositories/userRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { friendRepository } from '../repositories/friendRepository.js';

export const profileController = {
  async getProfile(request, reply) {
    try {
      const userId = request.user.id;
      const user = await userRepository.findById(userId);
      
      const allAchievements = await progressRepository.getAchievements();
      const userUnlocks = await progressRepository.getUserAchievements(userId);
      const unlockedIds = new Set(userUnlocks.map(u => u.achievementId));

      const mappedAchievements = allAchievements.map(ach => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id)
      }));

      const friendsList = await friendRepository.getFriends(userId);
      const totalLessonsCompleted = (await progressRepository.getCompletedLessons(userId)).length;

      // Remove sensitive data
      if (user) delete user.password;

      return {
        success: true,
        user,
        achievements: mappedAchievements,
        friends: friendsList,
        totalLessons: totalLessonsCompleted
      };
    } catch (error) {
      request.log.error('Error loading profile REST:', error);
      reply.status(500).send({ error: 'Internal server error loading profile data.' });
    }
  },

  async followFriend(request, reply) {
    const { username } = request.body || {};
    const currentUserId = request.user.id;

    if (!username) {
      reply.status(400).send({ error: 'Username is required to follow.' });
      return;
    }

    if (username.toLowerCase() === request.user.username.toLowerCase()) {
      reply.status(400).send({ error: 'You cannot follow yourself.' });
      return;
    }

    try {
      const targetUser = await userRepository.findByUsername(username);
      if (!targetUser) {
        reply.status(404).send({ error: `User '${username}' not found.` });
        return;
      }

      const followResult = await friendRepository.followFriend(currentUserId, targetUser.id);
      if (!followResult) {
        reply.status(400).send({ error: `You are already following ${username}.` });
        return;
      }

      return { success: true, message: `Successfully followed ${username}!` };
    } catch (error) {
      request.log.error('Error following friend REST:', error);
      reply.status(500).send({ error: 'Failed to follow user.' });
    }
  },

  async updateSettings(request, reply) {
    const { nativeLanguage, currentLeague } = request.body || {};
    const updateData = {};
    
    if (nativeLanguage) updateData.nativeLanguage = nativeLanguage;
    if (currentLeague) updateData.currentLeague = currentLeague;

    try {
      const updated = await userRepository.updateProfile(request.user.id, updateData);
      return { success: true, message: 'Settings updated successfully.', profile: updated };
    } catch (error) {
      request.log.error('Error updating settings REST:', error);
      reply.status(500).send({ error: 'Failed to save settings.' });
    }
  }
};
export default profileController;
