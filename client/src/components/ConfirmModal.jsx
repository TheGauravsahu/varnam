import React from 'react';
import { useConfirmStore } from '../stores/confirmStore.js';
import { AlertTriangle } from 'lucide-react';
import sound from './SoundEngine.js';

export default function ConfirmModal() {
  const { isOpen, title, message, confirmText, cancelText, onConfirm, onCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-premium space-y-6 text-center animate-in scale-in duration-200">
        
        {/* Warning Icon Banner */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>
        
        {/* Texts */}
        <div className="space-y-2">
          <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{message}</p>
        </div>

        {/* Buttons layout */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { sound.playClick(); onCancel(); }}
            className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-350 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { sound.playClick(); onConfirm(); }}
            className="flex-1 px-4 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer border-none"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
