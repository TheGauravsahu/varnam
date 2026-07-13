import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '../api/axiosClient.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // Resolves the current session user on initial SPA load
      checkAuth: async () => {
        // If no token stored, skip the network call immediately
        const storedToken = localStorage.getItem('varnam_token');
        if (!storedToken) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get('/auth/me');
          if (response.data?.success && response.data.user) {
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
          } else {
            localStorage.removeItem('varnam_token');
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          localStorage.removeItem('varnam_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.post('/auth/login', { email, password });
          if (response.data?.success) {
            // Store JWT for cross-domain Bearer auth (cookie may be blocked cross-site)
            if (response.data.token) {
              localStorage.setItem('varnam_token', response.data.token);
            }
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            return { success: true };
          }
          return { success: false, error: 'Login failed.' };
        } catch (err) {
          const errMsg = err.response?.data?.error || 'Login failed.';
          set({ error: errMsg, isLoading: false });
          return { success: false, error: errMsg };
        }
      },

      signup: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.post('/auth/signup', { username, email, password });
          if (response.data?.success) {
            // Store JWT for cross-domain Bearer auth (cookie may be blocked cross-site)
            if (response.data.token) {
              localStorage.setItem('varnam_token', response.data.token);
            }
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            return { success: true };
          }
          return { success: false, error: 'Signup failed.' };
        } catch (err) {
          const errMsg = err.response?.data?.error || 'Signup failed.';
          set({ error: errMsg, isLoading: false });
          return { success: false, error: errMsg };
        }
      },

      logout: async () => {
        try {
          await axiosClient.post('/auth/logout');
        } catch (err) {
          // Continue with local logout even if server call fails
        } finally {
          localStorage.removeItem('varnam_token');
          set({ user: null, isAuthenticated: false });
        }
      }
    }),
    {
      name: 'varnam-auth',       // localStorage key
      // Only persist user and isAuthenticated — isLoading is transient
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
