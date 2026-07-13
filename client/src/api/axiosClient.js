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
      // Clear stored token on 401 so the user gets redirected to login
      localStorage.removeItem("varnam_token");
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
