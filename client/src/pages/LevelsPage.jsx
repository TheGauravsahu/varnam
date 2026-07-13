import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Star, Shield, Award, Sparkles } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import sound from '../components/SoundEngine.js';

export default function LevelsPage() {
  // Fetch active profile details for level progress calculations
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axiosClient.get('/profile');
      return res.data;
    }
  });

  const handleLevelClick = () => {
    sound.playClick();
  };

  const user = profileData?.user;
  const xpTotal = user?.profile?.xpTotal || 0;

  // List of standard Varnam level tiers (Apple & Linear design system)
  const levels = [
    { lvl: 1, title: 'A1 Novice', desc: 'Starting your language journey. Learn basic vocabulary and greetings.', threshold: 0, icon: Star, color: 'text-amber-500 bg-amber-500/10' },
    { lvl: 2, title: 'A2 Beginner I', desc: 'Can ask and answer simple everyday questions.', threshold: 100, icon: Star, color: 'text-emerald-500 bg-emerald-500/10' },
    { lvl: 3, title: 'A2 Beginner II', desc: 'Understand short phrases and express basic personal details.', threshold: 300, icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
    { lvl: 4, title: 'B1 Intermediate I', desc: 'Can navigate travel situations and simple text dialogs.', threshold: 600, icon: Shield, color: 'text-indigo-500 bg-indigo-500/10' },
    { lvl: 5, title: 'B1 Intermediate II', desc: 'Can describe dreams, hopes, ambitions, and give quick explanations.', threshold: 1000, icon: Award, color: 'text-purple-500 bg-purple-500/10' },
    { lvl: 6, title: 'B2 Conversational I', desc: 'Understand core ideas of complex texts and discuss technical fields.', threshold: 1500, icon: Award, color: 'text-fuchsia-500 bg-fuchsia-500/10' },
    { lvl: 7, title: 'B2 Conversational II', desc: 'Express opinions spontaneously without strain for native speakers.', threshold: 2100, icon: Crown, color: 'text-pink-500 bg-pink-500/10' },
    { lvl: 8, title: 'C1 Advanced speaker', desc: 'Understand demanding texts and express meanings implicitly.', threshold: 2800, icon: Crown, color: 'text-rose-500 bg-rose-500/10' },
    { lvl: 9, title: 'C2 Fluent Master', desc: 'Understand practically everything heard or read with ease.', threshold: 3600, icon: Sparkles, color: 'text-cyan-500 bg-cyan-500/10' },
    { lvl: 10, title: 'Polylgot Legend', desc: 'Maximum fluency. Can synthesize complex details with native speed.', threshold: 4500, icon: Sparkles, color: 'text-yellow-500 bg-yellow-500/10' }
  ];

  // Dynamic user level math
  let userLevel = 1;
  let nextLevelXp = 100;
  let remainingXp = xpTotal;
  while (remainingXp >= nextLevelXp) {
    remainingXp -= nextLevelXp;
    userLevel += 1;
    nextLevelXp += 100;
  }
  const currentLevelProgress = Math.min(100, Math.floor((remainingXp / nextLevelXp) * 100));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full space-y-12 animate-in fade-in duration-300">
      
      {/* 1. Header Hero Panel */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Crown className="w-8 h-8 text-pink-500" />
            <span>Mastery Levels</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Monitor your language classification ranks. Gain XP to unlock advanced tiers.</p>
        </div>

        {/* Current Active Progress Card */}
        <div className="p-5 rounded-2xl border border-pink-500/20 bg-pink-500/5 max-w-sm w-full space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-pink-600 dark:text-pink-400">
            <span className="flex items-center gap-1">
              <Crown className="w-4 h-4 fill-current" />
              <strong>Level {userLevel}</strong>
            </span>
            <span className="font-number">{remainingXp} / {nextLevelXp} XP</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500 rounded-full transition-all duration-1000" 
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* 2. Grid list of levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levels.map((lvl) => {
          const IconComponent = lvl.icon;
          const isUnlocked = xpTotal >= lvl.threshold;
          const progressLeft = Math.max(0, lvl.threshold - xpTotal);
          
          return (
            <div 
              key={lvl.lvl}
              onClick={handleLevelClick}
              className={`p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer hover:shadow-premium ${
                isUnlocked 
                  ? 'border-zinc-200/50 dark:border-zinc-805 bg-white dark:bg-zinc-900 shadow-premium' 
                  : 'border-zinc-200/20 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 opacity-55'
              }`}
            >
              {/* Badge Icon Wrapper */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isUnlocked ? lvl.color : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
              }`}>
                <IconComponent className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-heading font-bold text-sm truncate ${
                    isUnlocked ? 'text-zinc-850 dark:text-zinc-100' : 'text-zinc-400'
                  }`}>
                    Level {lvl.lvl}: {lvl.title}
                  </h3>
                  {isUnlocked ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded-full font-number">
                      Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {lvl.desc}
                </p>

                {/* Requirements / Threshold tags */}
                <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400 font-number font-semibold border-t border-zinc-100 dark:border-zinc-800/40 mt-2">
                  <span>Required: {lvl.threshold} XP</span>
                  {!isUnlocked && <span>{progressLeft} XP remaining</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
