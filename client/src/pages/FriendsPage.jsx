import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, UserPlus, Flame, Award, Trophy, Zap, AlertCircle, CheckCircle2, Search, Sword
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';

const followSchema = z.object({
  username: z.string().min(1, 'Username is required')
});

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [feedback, setFeedback] = useState(null);
  const [challengeFriend, setChallengeFriend] = useState(null);

  // Fetch friends list and user profiles from /profile
  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axiosClient.get('/profile');
      return res.data;
    }
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (username) => {
      const res = await axiosClient.post('/profile/follow', { username });
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp();
      setFeedback({ success: true, message: data.message || 'Followed successfully!' });
      addToast(data.message || 'Followed successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      reset();
    },
    onError: (err) => {
      sound.playIncorrect();
      const errMsg = err.response?.data?.error || 'Failed to follow user.';
      setFeedback({ success: false, message: errMsg });
      addToast(errMsg, 'error');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(followSchema),
    defaultValues: { username: '' }
  });

  const onFollowSubmit = (data) => {
    sound.playClick();
    setFeedback(null);
    followMutation.mutate(data.username);
  };

  const handleChallenge = (friend) => {
    sound.playClick();
    setChallengeFriend(friend);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 border border-red-500/20 bg-red-500/10 rounded-2xl text-center">
        <p className="text-red-500 font-semibold">Failed to load friends page. Please try again.</p>
      </div>
    );
  }

  const { user, friends = [] } = profileData || {};

  // Sort friends by XP
  const sortedFriends = [...friends].sort((a, b) => (b.xpTotal || 0) - (a.xpTotal || 0));

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Users className="w-8 h-8 text-pink-500" />
          <span>Friends & Social Arena</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Follow other language learners, compare your weekly XP stats, and challenge them!
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Friends List & Search */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Follow / Search card */}
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Add Friends</h3>
            
            {feedback && (
              <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                feedback.success 
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'border-red-500/20 bg-red-500/10 text-red-500'
              }`}>
                {feedback.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onFollowSubmit)} className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                <input 
                  {...register('username')}
                  type="text" 
                  placeholder="Enter username to follow..." 
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950/20 focus:outline-none focus:border-pink-500 text-sm ${
                    errors.username ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'
                  } text-zinc-800 dark:text-zinc-100`}
                />
              </div>
              <button 
                type="submit" 
                disabled={followMutation.isPending}
                className="btn-premium px-6 py-2.5 text-xs shadow-none flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>Follow</span>
              </button>
            </form>
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          {/* Friends list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Your Friends List</h3>
            
            {sortedFriends.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/40">
                <Users className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Not following anyone yet.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Search for usernames above to build your list!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedFriends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="p-5 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 font-bold uppercase flex items-center justify-center text-sm">
                          {friend.username.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-150">{friend.username}</p>
                          <span className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase font-number">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span>{friend.streakCount || 0}d streak</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleChallenge(friend)}
                        className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 hover:bg-pink-500 hover:text-white transition-all"
                        title="Challenge Friend"
                      >
                        <Sword className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Total XP</p>
                        <p className="text-sm font-bold text-pink-600 dark:text-pink-400 font-number mt-0.5">{friend.xpTotal || 0} XP</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Status</p>
                        <p className="text-sm font-bold text-emerald-500 mt-0.5">Connected</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: XP Stats / Comparison */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">XP Comparison</h3>

            <div className="space-y-4">
              {/* Current User */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-800 dark:text-zinc-250 font-bold">You ({user?.username})</span>
                  <span className="font-number text-pink-500">{user?.profile?.xpTotal || 0} XP</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Friends list comparison */}
              {sortedFriends.slice(0, 5).map((friend) => {
                const maxXP = Math.max(user?.profile?.xpTotal || 1, ...friends.map(f => f.xpTotal || 0));
                const pct = Math.max(5, Math.min(100, Math.floor(((friend.xpTotal || 0) / maxXP) * 100)));
                return (
                  <div key={friend.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-zinc-400">{friend.username}</span>
                      <span className="font-number text-zinc-700 dark:text-zinc-300">{friend.xpTotal || 0} XP</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-400 dark:bg-zinc-650 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              {sortedFriends.length > 5 && (
                <p className="text-[10px] text-zinc-400 text-center italic mt-2">Showing top 5 comparisons</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Challenge Coming Soon Modal */}
      {challengeFriend && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center mx-auto">
              <Sword className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-zinc-50">Challenge {challengeFriend.username}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Live Challenges system is under development. Get ready to go head-to-head soon!
              </p>
            </div>
            <button
              onClick={() => setChallengeFriend(null)}
              className="btn-premium w-full py-2.5 text-xs shadow-none"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
