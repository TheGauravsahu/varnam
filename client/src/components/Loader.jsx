import React from 'react';
import Logo from './Logo.jsx';

export default function Loader({ message = 'Loading Varnam...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-pink-500/20 blur-xl animate-pulse scale-125" />
        
        {/* Spinning gradient ring */}
        <div className="w-16 h-16 rounded-full border-4 border-zinc-200/30 border-t-pink-500 border-r-rose-550 dark:border-zinc-800/30 animate-spin" />
        
        {/* Centered pulsing logo */}
        <div className="absolute flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <Logo className="w-5 h-5 text-pink-500 animate-pulse" />
        </div>
      </div>
      
      {message && (
        <p className="text-sm font-bold tracking-wide text-zinc-500 dark:text-zinc-400 animate-pulse text-center">
          {message}
        </p>
      )}
    </div>
  );
}
