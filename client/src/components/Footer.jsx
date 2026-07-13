import React from 'react';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950/20 py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Branding */}
        <div className="flex items-center gap-2 text-base font-heading font-semibold text-pink-600 dark:text-pink-400">
          <Logo className="w-5 h-5" />
          <span>Varnam</span>
        </div>

        {/* Gaurav Sahu Link Attribution */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Made with 💖 by{' '}
          <a
            href="https://gauravsahu.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-pink-600 dark:text-pink-400 hover:underline transition-all"
          >
            Gaurav Sahu
          </a>
        </p>

        {/* License & Copyright */}
        <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <span>© 2026 Varnam</span>
        </div>
      </div>
    </footer>
  );
}
