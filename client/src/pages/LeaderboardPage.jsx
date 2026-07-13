import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Flame } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';

export default function LeaderboardPage() {
  const { user } = useAuthStore();

  // Fetch leaderboard rankings
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await axiosClient.get('/dashboard/leaderboard');
      return res.data;
    }
  });

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
        <p className="text-red-500 font-semibold">Failed to load leaderboard. Please try again.</p>
      </div>
    );
  }

  const list = data?.leaderboard || [];
  const topThree = list.slice(0, 3);
  const remaining = list.slice(3);

  // Helper colors for top rank badges
  const rankColors = [
    { bg: 'bg-yellow-500/10 border-yellow-500/35 text-yellow-600 dark:text-yellow-400', label: 'Gold' },
    { bg: 'bg-zinc-400/10 border-zinc-400/35 text-zinc-500 dark:text-zinc-300', label: 'Silver' },
    { bg: 'bg-amber-600/10 border-amber-600/35 text-amber-700 dark:text-amber-500', label: 'Bronze' }
  ];

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full space-y-8">
      
      {/* Page Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Trophy className="w-8 h-8 text-pink-500" />
          <span>Leagues Leaderboard</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Compete weekly with learners around the world. Top 3 gain promotion bonuses!</p>
      </header>

      {/* 1. Podium Layout for Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topThree.map((player, index) => {
            const isSelf = player.username === user?.username;
            const colors = rankColors[index] || rankColors[2];
            return (
              <div 
                key={player.userId || player.username}
                className={`p-6 rounded-3xl border text-center flex flex-col items-center justify-center gap-3 relative shadow-premium transition-all duration-300 hover:shadow-premium-hover ${
                  isSelf 
                    ? 'border-pink-500/50 bg-pink-500/5' 
                    : 'border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl'
                }`}
              >
                {/* Crown / Rank Medal Badge */}
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold ${colors.bg}`}>
                  <Medal className={`w-6 h-6 ${
                    index === 0 ? 'text-yellow-500 fill-yellow-500/30' : 
                    index === 1 ? 'text-zinc-400 fill-zinc-400/35' : 
                    'text-amber-700 fill-amber-700/30'
                  }`} />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-number">{colors.label} Medal</span>
                  <h3 className="font-heading font-bold text-lg truncate max-w-[150px]">{player.username}</h3>
                </div>

                {/* Score Stats */}
                <div className="flex items-center gap-4 text-xs font-semibold pt-2 border-t border-zinc-100 dark:border-zinc-800/40 w-full justify-around font-number">
                  <div>
                    <p className="text-zinc-400 uppercase text-[9px] tracking-wider">XP Total</p>
                    <p className="text-pink-600 dark:text-pink-400 text-sm font-bold">{player.xpTotal} XP</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 uppercase text-[9px] tracking-wider">Streak</p>
                    <p className="text-orange-500 text-sm font-bold flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{player.streakCount}d</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Leaderboard list for remaining positions */}
      <div className="space-y-3">
        {remaining.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-850 rounded-3xl bg-white dark:bg-zinc-900 shadow-premium">
            <p className="text-sm text-zinc-400">No other players in this league yet. Keep learning!</p>
          </div>
        ) : (
          remaining.map((player, idx) => {
            const rankNum = idx + 4;
            const isSelf = player.username === user?.username;
            return (
              <div 
                key={player.userId || player.username}
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                  isSelf 
                    ? 'border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-pink-500/5 shadow-premium' 
                    : 'border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/60 shadow-premium hover:shadow-premium-hover'
                }`}
              >
                {/* Left Section: Rank + Avatar + Name */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-6 text-center font-number font-bold text-zinc-400 dark:text-zinc-500 text-sm">
                    {rankNum}
                  </span>
                  
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-850 border border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-center font-heading font-bold text-zinc-600 dark:text-zinc-350 uppercase shrink-0 text-sm">
                    {player.username.substring(0, 2)}
                  </div>
                  
                  <h4 className={`font-heading font-semibold text-sm truncate ${isSelf ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {player.username}
                  </h4>
                </div>

                {/* Right Section: Streak + XP */}
                <div className="flex items-center gap-6 shrink-0 font-number text-sm font-semibold">
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>{player.streakCount}d</span>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="font-bold text-pink-600 dark:text-pink-400">{player.xpTotal} XP</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
