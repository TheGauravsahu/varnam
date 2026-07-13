import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Flame, Award, Download, Share2, Sparkles, Zap } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';
import { useToastStore } from '../stores/toastStore.js';
import html2canvas from 'html2canvas';
import Loader from '../components/Loader.jsx';

const LEAGUE_COLORS = {
  Bronze: { bg: 'linear-gradient(to right, #b45309, #78350f)', text: '#fcd34d' },
  Silver: { bg: 'linear-gradient(to right, #6b7280, #374151)', text: '#f3f4f6' },
  Gold: { bg: 'linear-gradient(to right, #d97706, #92400e)', text: '#fef08a' },
  Diamond: { bg: 'linear-gradient(to right, #06b6d4, #1d4ed8)', text: '#cffafe' },
};

export default function ProfileCardPage() {
  const cardRef = useRef(null);
  const { user: authUser } = useAuthStore();
  const { addToast } = useToastStore();
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
    // Intercept computed styles to filter out oklch color parsing errors in html2canvas
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (el, pseudo) {
      const style = originalGetComputedStyle(el, pseudo);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return (propertyName) => {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && val.includes('oklch')) {
                return 'rgba(0, 0, 0, 0)';
              }
              return val;
            };
          }
          const value = target[prop];
          if (typeof value === 'string' && value.includes('oklch')) {
            return 'rgba(0, 0, 0, 0)';
          }
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      });
    };

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${profile?.username || 'varnam'}-profile-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Profile card downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to download profile card. Try sharing instead.', 'error');
    } finally {
      // Restore original computed styles lookup method
      window.getComputedStyle = originalGetComputedStyle;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.username}'s Varnam Profile`,
          text: `Check out my progress on Varnam! Level ${level} | ${xpTotal} XP | ${streak} day streak 🔥`,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(`${profile?.username} is learning on Varnam! Level ${level} | ${xpTotal} XP | ${streak} day streak 🔥 — https://varnam-app.vercel.app`);
        addToast('Profile link copied to clipboard!', 'success');
      }
    } catch (err) {
      // user cancelled
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full">
        <Loader message="Loading profile card data..." />
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
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)' }} />

        {/* Varnam Branding */}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#f472b6' }}>varnam</span>
          <span className="text-xs font-number" style={{ color: '#71717a' }}>varnam-app.vercel.app</span>
        </div>

        {/* User Identity Section */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-heading font-bold text-3xl shadow-lg shrink-0" style={{ background: 'linear-gradient(to top right, #ec4899, #e11d48)', color: '#ffffff' }}>
            {profile?.username?.substring(0, 2).toUpperCase() || 'VN'}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-heading font-bold" style={{ color: '#ffffff' }}>{profile?.username || 'Learner'}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full text-center animate-pulse" style={{ background: leagueStyle.bg, color: leagueStyle.text }}>
                {league} League
              </span>
              <span className="text-xs" style={{ color: '#a1a1aa' }}>
                Level {level}
              </span>
            </div>
            <p className="text-xs font-number" style={{ color: '#71717a' }}>
              Learner since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Total XP', value: xpTotal.toLocaleString(), unit: 'XP', icon: Zap, color: '#f472b6' },
            { label: 'Day Streak', value: streak, unit: 'days', icon: Flame, color: '#fb923c' },
            { label: 'Lessons', value: totalLessons, unit: 'done', icon: Award, color: '#34d399' },
          ].map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-2xl text-center space-y-1" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Icon className="w-5 h-5 mx-auto" style={{ color }} />
              <p className="text-xl font-bold font-number" style={{ color }}>{value}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#71717a' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-number" style={{ color: '#a1a1aa' }}>
            <span className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-current" style={{ color: '#f472b6' }} />
              Level {level}
            </span>
            <span>{levelProgress}% to Level {level + 1}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${levelProgress}%`, transition: 'width 1s ease', background: 'linear-gradient(to right, #ec4899, #fb7185)' }}
            />
          </div>
        </div>

        {/* Achievements row */}
        {achievements.length > 0 && (
          <div className="space-y-2 relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#71717a' }}>Top Achievements</p>
            <div className="flex gap-2 flex-wrap">
              {achievements.map((ach) => (
                <span
                  key={ach.id}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', color: '#f472b6' }}
                >
                  🏆 {ach.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer tagline */}
        <div className="text-center relative z-10 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <p className="text-xs italic" style={{ color: '#71717a' }}>Learning languages, one lesson at a time ✨</p>
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
