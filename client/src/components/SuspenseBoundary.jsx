import React from 'react';

export default function SuspenseBoundary() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="flex flex-col items-center gap-4 text-center">
        
        {/* Sleek rotating ring spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-pink-500/10" />
          <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Loading content</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Preparing language exercises...</p>
        </div>

      </div>
    </div>
  );
}
