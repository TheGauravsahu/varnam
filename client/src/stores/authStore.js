import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Resolves the current session user on initial SPA load
  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/auth/me');
      if (response.data?.success && response.data.user) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      if (response.data?.success) {
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
      set({ user: null, isAuthenticated: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
