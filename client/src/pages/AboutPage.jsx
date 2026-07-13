import React from 'react';
import { Info, HelpCircle, Flame, Trophy, Award, Heart } from 'lucide-react';
import sound from '../components/SoundEngine.js';

export default function AboutPage() {
  const toggleClick = () => {
    sound.playClick();
  };

  const sections = [
    {
      title: 'Spaced Repetition Method',
      icon: Award,
      color: 'text-pink-500 bg-pink-500/10',
      desc: 'Varnam spaces out lesson reviews at increasing intervals (daily, weekly, monthly). If you answer a lesson perfectly, it unlocks advanced structures; if you make mistakes, it queues them for quick reviews to lock facts into long-term memory.'
    },
    {
      title: 'Daily Streak Rules',
      icon: Flame,
      color: 'text-orange-500 bg-orange-500/10',
      desc: 'Completing a lesson daily maintains your streak. If you skip a day, your streak will break unless you have a "Streak Freeze" purchased in the profile shop. Streak freezes protect your record automatically.'
    },
    {
      title: 'Competitive League Ranks',
      icon: Trophy,
      color: 'text-yellow-500 bg-yellow-500/10',
      desc: 'Learners are sorted into weekly 10-person leagues (Bronze, Silver, Gold, and Diamond). Top 3 scorers promote to the next league every Sunday, unlocking custom gold accolades, coins, and diamond bonuses.'
    }
  ];

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full space-y-12">
      
      {/* Header */}
      <header className="pb-6 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Info className="w-8 h-8 text-pink-500" />
          <span>About Varnam</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Discover the science behind Varnam's curriculum design and league mechanics.</p>
      </header>

      {/* Core Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div 
              key={sec.title}
              onClick={toggleClick}
              className="p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sec.color}`}>
                <Icon className="w-5 h-5 fill-current" />
              </div>
              <h3 className="font-heading font-bold text-lg text-zinc-800 dark:text-zinc-100">{sec.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{sec.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Developer note section */}
      <section className="p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent space-y-4">
        <h3 className="font-heading font-bold text-xl flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500 fill-current" />
          <span>Product Philosophy</span>
        </h3>
        <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed max-w-3xl">
          Varnam is built to feel clean, minimal, and premium. Unlike traditional language apps filled with distractions and colorful characters, we prioritize clean lines, dark modes, fast interactions, and rich animations inspired by the Arc Browser, Linear, and Notion.
        </p>
        <div className="pt-2">
          <a 
            href="https://gauravsahu.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={toggleClick}
            className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1"
          >
            Visit Gaurav Sahu website →
          </a>
        </div>
      </section>

    </div>
  );
}
