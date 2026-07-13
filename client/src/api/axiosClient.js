import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Crucial for HTTP-only JWT cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle authorization errors globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If receiving 401 from backend, we could clear local auth state
    if (error.response && error.response.status === 401) {
      // Avoid circular dependencies in import: resolve via global storage if needed
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
