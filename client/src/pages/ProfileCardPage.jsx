import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Flame, Award, Download, Share2, Sparkles, Zap } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';

const LEAGUE_COLORS = {
  Bronze: { bg: 'from-amber-700 to-amber-900', text: 'text-amber-300' },
  Silver: { bg: 'from-zinc-400 to-zinc-600', text: 'text-zinc-200' },
  Gold: { bg: 'from-yellow-500 to-amber-600', text: 'text-yellow-100' },
  Diamond: { bg: 'from-cyan-400 to-blue-600', text: 'text-cyan-100' },
};

export default function ProfileCardPage() {
  const cardRef = useRef(null);
  const { user: authUser } = useAuthStore();
  const [isSharing, setIsSharing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile-card'],
    queryFn: async () => {
      const res = await axiosClient.get('/profile');
      return res.data;
    }
  });

  const profile = data?.user || authUser;
  const achievements = (data?.achievements || []).filter(a => a.unlocked).slice(0, 5);
  const xpTotal = profile?.profile?.xpTotal || 0;
  const streak = profile?.profile?.streakCount || 0;
  const league = profile?.profile?.currentLeague || 'Bronze';
  const totalLessons = data?.totalLessons || 0;

  // Simple level calculation
  let level = 1;
  let xpLeft = xpTotal;
  let nextLevelXp = 100;
  while (xpLeft >= nextLevelXp) {
    xpLeft -= nextLevelXp;
    level++;
    nextLevelXp += 100;
  }
  const levelProgress = Math.min(100, Math.floor((xpLeft / nextLevelXp) * 100));

  const leagueStyle = LEAGUE_COLORS[league] || LEAGUE_COLORS.Bronze;

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${profile?.username || 'varnam'}-profile-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      // html2canvas not installed — fallback message
      alert('Please install html2canvas: run `pnpm add html2canvas` in the client folder.');
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.username}'s Varnam Profile`,
          text: `Check out my language learning progress on Varnam! Level ${level} | ${xpTotal} XP | ${streak} day streak 🔥`,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(`${profile?.username} is learning languages on Varnam! Level ${level} | ${xpTotal} XP | ${streak} day streak 🔥 — https://varnam-app.vercel.app`);
        alert('Profile link copied to clipboard!');
      }
    } catch (err) {
      // user cancelled
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full space-y-8">
      {/* Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Sparkles className="w-8 h-8 text-pink-500" />
          <span>Profile Card</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Share your language learning journey with the world.
        </p>
      </header>

      {/* The Shareable Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl p-8 space-y-6"
        style={{
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 40%, #3f3f46 100%)',
          border: '1px solid rgba(236,72,153,0.3)',
          boxShadow: '0 0 60px rgba(236,72,153,0.15), 0 0 120px rgba(236,72,153,0.05)',
          minHeight: 480,
        }}
      >
        {/* Background glow blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Varnam Branding */}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-400">varnam</span>
          <span className="text-xs text-zinc-500 font-number">varnam-app.vercel.app</span>
        </div>

        {/* User Identity Section */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white font-heading font-bold text-3xl shadow-lg shrink-0">
            {profile?.username?.substring(0, 2).toUpperCase() || 'VN'}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-heading font-bold text-white">{profile?.username || 'Learner'}</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${leagueStyle.bg} ${leagueStyle.text}`}>
                {league} League
              </span>
              <span className="text-xs text-zinc-400">
                Level {level}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-number">
              Learner since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Total XP', value: xpTotal.toLocaleString(), unit: 'XP', icon: Zap, color: 'text-pink-400' },
            { label: 'Day Streak', value: streak, unit: 'days', icon: Flame, color: 'text-orange-400' },
            { label: 'Lessons', value: totalLessons, unit: 'done', icon: Award, color: 'text-emerald-400' },
          ].map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <Icon className={`w-5 h-5 mx-auto ${color}`} />
              <p className={`text-xl font-bold font-number ${color}`}>{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-number">
            <span className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-pink-400 fill-current" />
              Level {level}
            </span>
            <span>{levelProgress}% to Level {level + 1}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400"
              style={{ width: `${levelProgress}%`, transition: 'width 1s ease' }}
            />
          </div>
        </div>

        {/* Achievements row */}
        {achievements.length > 0 && (
          <div className="space-y-2 relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Top Achievements</p>
            <div className="flex gap-2 flex-wrap">
              {achievements.map((ach) => (
                <span
                  key={ach.id}
                  className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-semibold"
                >
                  🏆 {ach.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer tagline */}
        <div className="text-center relative z-10 pt-2 border-t border-white/10">
          <p className="text-xs text-zinc-500 italic">Learning languages, one lesson at a time ✨</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          className="btn-premium flex-1 flex items-center justify-center gap-2 py-3"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="btn-premium-secondary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          {isSharing ? 'Sharing...' : 'Share'}
        </button>
      </div>

     
    </div>
  );
}
