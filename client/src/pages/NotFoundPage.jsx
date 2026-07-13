import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import sound from '../components/SoundEngine.js';

export default function NotFoundPage() {
  const handleNavClick = () => {
    sound.playClick();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* 404 Card container */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-premium space-y-6">
        
        {/* Animated Compass icon */}
        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto text-pink-500 animate-pulse">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-bold text-zinc-900 dark:text-zinc-50 font-number">404</h1>
          <h2 className="text-xl font-heading font-bold">Page Not Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
            The page you are looking for does not exist or has been moved to another path.
          </p>
        </div>

        <Link 
          to="/dashboard"
          onClick={handleNavClick}
          className="btn-premium w-full py-3.5 flex items-center justify-center gap-2"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
