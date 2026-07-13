import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useToastStore = create(
  persist(
    (set) => ({
      toasts: [],

      // Triggers a self-dismissing toast notification
      addToast: (message, type = 'error', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }));

        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
          }));
        }, duration);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      }
    }),
    {
      name: 'varnam-toasts',
      // Toasts are transient — don't persist them across sessions
      partialize: () => ({}),
    }
  )
);
