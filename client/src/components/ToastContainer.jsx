import React from 'react';
import { useToastStore } from '../stores/toastStore.js';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl border bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-premium animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3 justify-between ${
            toast.type === 'success'
              ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/20 text-red-500'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            )}
            <p className="text-sm font-semibold leading-relaxed break-words">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
