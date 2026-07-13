import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Kept for same-domain cookie support
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach stored JWT token as Bearer header for cross-domain support.
// Cookies (sameSite: 'none') work on modern browsers, but localStorage + Authorization
// header is the reliable cross-domain fallback between Vercel and Render.
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("varnam_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle authorization errors globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored token on 401 and log out the user from auth state
      localStorage.removeItem("varnam_token");
      import("../stores/authStore.js").then((m) => {
        m.useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
      });
      import("../stores/toastStore.js").then((m) => {
        m.useToastStore.getState().addToast("Session expired. Please login again.", "error");
      });
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
