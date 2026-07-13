import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Crown,
  User, 
  UserPlus, 
  Flame, 
  Award, 
  Trophy, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2,
  Users
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import sound from '../components/SoundEngine.js';
import Loader from '../components/Loader.jsx';

// Friend Follow validation schema
const followSchema = z.object({
  username: z.string().min(1, 'Username is required')
});

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);

  // Fetch Profile dataset
  const { data, isLoading, isError } = useQuery({
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
      sound.playLevelUp(); // play success chime
      setFeedback({ success: true, message: data.message || 'Followed successfully!' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      reset();
    },
    onError: (err) => {
      sound.playIncorrect(); // play thud
      setFeedback({ success: false, message: err.response?.data?.error || 'Failed to follow user.' });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full">
        <Loader message="Loading profile stats..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 border border-red-500/20 bg-red-500/10 rounded-2xl text-center">
        <p className="text-red-500 font-semibold">Failed to load profile. Please try again.</p>
      </div>
    );
  }

  const {
    user,
    achievements = [],
    friends = [],
    totalLessons = 0
  } = data || {};

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full space-y-8">
      
      {/* 1. Profile Header Card */}
      <div className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 shadow-premium relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="absolute top-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* User initials logo */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-heading font-bold text-4xl flex items-center justify-center shadow-premium relative z-10 shrink-0">
          {user?.username?.substring(0, 2).toUpperCase()}
        </div>

        {/* User stats overview */}
        <div className="space-y-4 w-full relative z-10 text-center md:text-left">
          <div>
            <h1 className="text-3xl font-heading font-bold text-zinc-900 dark:text-zinc-50">{user?.username}</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-number">
              Learner since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recent'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2 border-t border-zinc-150 dark:border-zinc-800/40">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Current Level</p>
              <p className="text-xl font-heading font-bold text-pink-600 dark:text-pink-400 font-number flex items-center gap-1 justify-center md:justify-start">
                <Crown className="w-4 h-4 fill-current" />
                <span>Level {user?.levelStats?.level || 1}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total XP</p>
              <p className="text-xl font-heading font-bold text-pink-600 dark:text-pink-400 font-number">{user?.profile?.xpTotal || 0} XP</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Streak</p>
              <p className="text-xl font-heading font-bold text-orange-500 font-number flex items-center gap-1 justify-center md:justify-start">
                <Flame className="w-4 h-4 fill-current" />
                <span>{user?.profile?.streakCount || 0} days</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Completed Lessons</p>
              <p className="text-xl font-heading font-bold text-zinc-800 dark:text-zinc-200 font-number">{totalLessons}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Achievements vs. Social */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Columns: Achievements Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Award className="w-6 h-6 text-pink-500" />
            <span>Achievements Badges</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative group ${
                  ach.unlocked 
                    ? 'border-pink-500/20 bg-white dark:bg-zinc-900 shadow-premium hover:shadow-premium-hover' 
                    : 'border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950/10 opacity-60'
                }`}
              >
                {/* Badge Circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  ach.unlocked 
                    ? 'bg-pink-500/10 text-pink-500' 
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {ach.unlocked ? <Award className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <h4 className={`font-heading font-bold text-sm ${ach.unlocked ? 'text-zinc-850 dark:text-zinc-100' : 'text-zinc-400'}`}>
                    {ach.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{ach.description}</p>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider font-number text-zinc-400">
                    {ach.unlocked ? 'Unlocked' : `+${ach.xpReward} XP | +${ach.coinReward} Coins`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Friends social arena */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Users className="w-6 h-6 text-pink-500" />
            <span>Friends list</span>
          </h2>

          <div className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-6">
            
            {/* Follow Form */}
            <form onSubmit={handleSubmit(onFollowSubmit)} className="space-y-2">
              <label htmlFor="friend-username" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Follow a Learner</label>
              
              {feedback && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  feedback.success 
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'border-red-500/20 bg-red-500/10 text-red-500'
                }`}>
                  {feedback.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input 
                  {...register('username')}
                  type="text" 
                  id="friend-username" 
                  placeholder="Username" 
                  className={`w-full min-w-0 px-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950/20 focus:outline-none focus:border-pink-500 text-sm ${
                    errors.username ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
                <button 
                  type="submit" 
                  disabled={followMutation.isPending}
                  className="btn-premium px-4 py-2.5 text-xs shadow-none flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Follow</span>
                </button>
              </div>
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </form>

            {/* Friends list map */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/40">
              {friends.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-150 dark:border-zinc-850 rounded-2xl">
                  <User className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Not following anyone yet. Search above to find friends!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/30 dark:border-zinc-800/30 bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-bold text-pink-500 uppercase text-sm">
                        {friend.username.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{friend.username}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-number">{friend.xpTotal || 0} XP</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-orange-500 font-number">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{friend.streakCount || 0}d</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
