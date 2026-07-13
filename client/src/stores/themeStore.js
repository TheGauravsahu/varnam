import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      colorTheme: 'default', // default, violet, midnight, sakura, ocean, emerald, cyberpunk
      bgAnimation: 'none',   // none, stars, aurora

      setColorTheme: (colorTheme) => {
        if (colorTheme !== 'default') {
          document.documentElement.setAttribute('data-theme', colorTheme);
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        set({ colorTheme });
      },

      setBgAnimation: (bgAnimation) => {
        document.body.classList.remove('animated-bg-stars', 'animated-bg-aurora');
        if (bgAnimation !== 'none') {
          document.body.classList.add(`animated-bg-${bgAnimation}`);
        }
        set({ bgAnimation });
      },

      initializeTheme: () => {
        const state = useThemeStore.getState();
        if (state.colorTheme !== 'default') {
          document.documentElement.setAttribute('data-theme', state.colorTheme);
        } else {
          document.documentElement.removeAttribute('data-theme');
        }

        document.body.classList.remove('animated-bg-stars', 'animated-bg-aurora');
        if (state.bgAnimation !== 'none') {
          document.body.classList.add(`animated-bg-${state.bgAnimation}`);
        }
      }
    }),
    {
      name: 'varnam-theme',
    }
  )
);
export default useThemeStore;
