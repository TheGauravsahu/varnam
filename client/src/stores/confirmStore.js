import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConfirmStore = create(
  persist(
    (set, get) => ({
      isOpen: false,
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      resolveRef: null,

      confirm: (options = {}) => {
        return new Promise((resolve) => {
          set({
            isOpen: true,
            title: options.title || 'Confirm Action',
            message: options.message || 'Are you sure you want to proceed?',
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            resolveRef: resolve
          });
        });
      },

      onConfirm: () => {
        const resolve = get().resolveRef;
        if (resolve) resolve(true);
        set({ isOpen: false, resolveRef: null });
      },

      onCancel: () => {
        const resolve = get().resolveRef;
        if (resolve) resolve(false);
        set({ isOpen: false, resolveRef: null });
      }
    }),
    {
      name: 'varnam-confirm',
      // Modal dialog state is transient — don't persist across sessions
      partialize: () => ({}),
    }
  )
);
