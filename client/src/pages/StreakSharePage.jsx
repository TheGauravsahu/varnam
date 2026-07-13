import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Download, Share2, ArrowLeft, Sparkles, Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';
import { useToastStore } from '../stores/toastStore.js';
import sound from '../components/SoundEngine.js';

export default function StreakSharePage() {
  const cardRef = useRef(null);
  const { user: authUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch the latest profile data to get the exact streak count
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axiosClient.get('/profile');
      return res.data;
    }
  });

  const user = profileData?.user || authUser;
  const streakCount = user?.profile?.streakCount || 0;

  const handleDownload = async () => {
    sound.playClick();
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${user?.username || 'varnam'}-streak-${streakCount}.png`;
      link.href = dataUrl;
      link.click();
      addToast('Streak card downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to download image. Try copying instead.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      const text = `I'm on a ${streakCount}-day learning streak on Varnam! 🎯 Join me and learn languages together: ${window.location.origin}`;
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      addToast('Share text copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      addToast('Failed to copy text.', 'error');
    }
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Back button */}
      <div>
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Sparkles className="w-8 h-8 text-pink-500" />
          <span>Share Your Streak</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Show off your commitment! Generate a beautiful streak card for Instagram, WhatsApp, or Twitter.
        </p>
      </header>

      {/* Preview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Preview Card (This gets screenshotted by html2canvas) */}
        <div className="flex justify-center">
          <div 
            ref={cardRef}
            className="w-[350px] h-[525px] rounded-[32px] p-8 flex flex-col justify-between text-white relative overflow-hidden streak-card-gradient shadow-2xl"
          >
            {/* Glossy circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/10 rounded-full blur-2xl" />

            {/* Header info */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">VARNAM APP</span>
              <span className="text-[9px] font-mono opacity-60">varnam-app.vercel.app</span>
            </div>

            {/* Main streak value */}
            <div className="text-center space-y-6 relative z-10 py-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
                <Flame className="w-14 h-14 text-yellow-350 fill-yellow-400 drop-shadow-[0_4px_10px_rgba(251,191,36,0.6)] animate-pulse" />
              </div>

              <div className="space-y-1">
                <p className="text-6xl font-heading font-black tracking-tight font-number">
                  {streakCount}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-85">
                  Day Streak
                </p>
              </div>
            </div>

            {/* User profile details */}
            <div className="space-y-4 relative z-10 border-t border-white/15 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 font-heading font-bold flex items-center justify-center text-sm uppercase">
                  {user?.username?.substring(0,2) || 'VN'}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">{user?.username || 'Learner'}</h3>
                  <p className="text-[9px] opacity-60 mt-0.5">Language Champion</p>
                </div>
              </div>
              <p className="text-xs italic opacity-90 leading-relaxed">
                "Consistency is key. I'm building a daily habit on Varnam, learning Sanskrit & Hindi one day at a time! 🚀"
              </p>
            </div>
          </div>
        </div>

        {/* Action column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 shadow-premium space-y-4">
            <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-zinc-50">Generate & Share</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Clicking download will bundle this card into a premium high-resolution image suitable for social networks.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn-premium w-full py-3.5 flex items-center justify-center gap-2 text-sm shadow-none disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Generating Image...' : 'Download PNG Card'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="btn-premium-secondary w-full py-3.5 flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>Copy Share Text</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10 text-xs text-pink-500 leading-relaxed">
            💡 **Tip:** Tag us with `#VarnamLearning` so we can repost your milestone achievements!
          </div>
        </div>

      </div>

    </div>
  );
}
