import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Translucent Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Glassmorphic Modal Card */}
      <div className="relative w-full max-w-md p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-premium z-10 transition-all transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/40 mb-4">
          <h3 className="font-heading font-bold text-lg text-zinc-800 dark:text-zinc-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
