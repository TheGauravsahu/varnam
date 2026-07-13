import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../stores/authStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import sound from '../components/SoundEngine.js';

// Schema for updating settings
const settingsSchema = z.object({
  nativeLanguage: z.string().min(1, 'Native language is required'),
  currentLeague: z.string().min(1, 'League is required')
});

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [feedback, setFeedback] = useState(null);

  // Settings update mutation
  const settingsMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosClient.put('/profile/settings', data);
      return res.data;
    },
    onSuccess: (data) => {
      sound.playLevelUp(); // play success chime
      setFeedback({ success: true, message: data.message || 'Settings updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (err) => {
      sound.playIncorrect(); // play thud
      setFeedback({ success: false, message: err.response?.data?.error || 'Failed to save settings.' });
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      nativeLanguage: user?.profile?.nativeLanguage || 'Hindi',
      currentLeague: user?.profile?.currentLeague || 'Bronze'
    }
  });

  const onSettingsSubmit = (data) => {
    sound.playClick();
    setFeedback(null);
    settingsMutation.mutate(data);
  };

  const { colorTheme, setColorTheme, bgAnimation, setBgAnimation } = useThemeStore();

  const themesList = [
    { code: 'default', name: 'Default Pink', color: '#ec4899', border: '#fda4af' },
    { code: 'violet', name: 'Violet', color: '#8b5cf6', border: '#c4b5fd' },
    { code: 'midnight', name: 'Midnight', color: '#6366f1', border: '#a5b4fc' },
    { code: 'sakura', name: 'Sakura Sakura', color: '#f472b6', border: '#fbcfe8' },
    { code: 'ocean', name: 'Ocean Cyan', color: '#06b6d4', border: '#67e8f9' },
    { code: 'emerald', name: 'Emerald Green', color: '#10b981', border: '#6ee7b7' },
    { code: 'cyberpunk', name: 'Cyber Amber', color: '#f59e0b', border: '#fcd34d' },
  ];

  const handleThemeChange = (themeCode) => {
    sound.playClick();
    setColorTheme(themeCode);
  };

  const handleBgChange = (bgName) => {
    sound.playClick();
    setBgAnimation(bgName);
  };

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Settings className="w-8 h-8 text-pink-500" />
          <span>Account Settings</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Update your learning preferences and profile options.</p>
      </header>

      {/* Settings Card */}
      <div className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-6">
        
        {feedback && (
          <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
            feedback.success 
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'border-red-500/20 bg-red-500/10 text-red-500'
          }`}>
            {feedback.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSettingsSubmit)} className="space-y-6">
          
          {/* Native Language Select */}
          <div className="space-y-2">
            <label htmlFor="nativeLanguage" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Native language</label>
            <select 
              {...register('nativeLanguage')}
              id="nativeLanguage" 
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none focus:border-pink-500 dark:text-white dark:bg-zinc-900"
            >
              <option value="Hindi" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Hindi (हिन्दी)</option>
              <option value="English" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">English</option>
              <option value="Spanish" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Spanish (Español)</option>
              <option value="Sanskrit" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Sanskrit (संस्कृतम्)</option>
            </select>
            {errors.nativeLanguage && <p className="text-xs text-red-500">{errors.nativeLanguage.message}</p>}
          </div>

          {/* Current League Select */}
          <div className="space-y-2">
            <label htmlFor="currentLeague" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active League</label>
            <select 
              {...register('currentLeague')}
              id="currentLeague" 
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-sm focus:outline-none focus:border-pink-500 dark:text-white dark:bg-zinc-900"
            >
              <option value="Bronze" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Bronze League</option>
              <option value="Silver" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Silver League</option>
              <option value="Gold" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Gold League</option>
              <option value="Diamond" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Diamond League</option>
            </select>
            {errors.currentLeague && <p className="text-xs text-red-500">{errors.currentLeague.message}</p>}
          </div>

          {/* Warning Note */}
          <div className="p-4 rounded-2xl border border-amber-500/10 bg-amber-500/5 text-amber-600 dark:text-amber-500 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Privacy Note</p>
              <p className="leading-relaxed">Username and native language statistics are public to users in your active league leaderboard.</p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={settingsMutation.isPending}
            className="btn-premium px-8 py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{settingsMutation.isPending ? 'Saving Preferences...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>

      {/* Theme Customization Card */}
      <div className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-6">
        <div>
          <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-zinc-50">App Customization</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Unlock new looks by achieving learning milestones.</p>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Color Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themesList.map((t) => {
              const isSelected = colorTheme === t.code;
              return (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => handleThemeChange(t.code)}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all hover:scale-102 ${
                    isSelected 
                      ? 'border-pink-500/60 bg-pink-500/5 font-bold shadow-md' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 hover:border-pink-300'
                  }`}
                >
                  <span className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ backgroundColor: t.color, borderColor: t.border }} />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Background Animations */}
        <div className="space-y-3 pt-4 border-t border-zinc-150 dark:border-zinc-800/40">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Animated Backgrounds</label>
          <div className="flex flex-wrap gap-2">
            {[
              { code: 'none', name: 'None/Static' },
              { code: 'stars', name: '🌠 Stars Twinkle' },
              { code: 'aurora', name: '🌌 Aurora Waves' },
            ].map((bgOption) => {
              const isSelected = bgAnimation === bgOption.code;
              return (
                <button
                  key={bgOption.code}
                  type="button"
                  onClick={() => handleBgChange(bgOption.code)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 text-zinc-600 dark:text-zinc-300 hover:border-pink-300'
                  }`}
                >
                  {bgOption.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
