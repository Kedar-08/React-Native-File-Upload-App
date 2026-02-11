/**
 * Centralized API client using axios.
 * All HTTP requests flow through this module.
 */

import { clearAuthData, getToken } from "@/storage";
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { normalizeError } from "./normalize-error";

// Base URL for the backend API (from environment variable)
// Environment variable set per build profile in eas.json
// Available profiles: preview (ngrok), render (Render deployment)
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to attach auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    console.log("🔐 Request interceptor:", {
      url: config.url,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Token attached to request");
    } else {
      console.warn("⚠️ No token available for request:", config.url);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(normalizeError(error));
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      url: error.response?.config?.url,
      data: error.response?.data,
    });

    // Handle 401 Unauthorized - token may be invalid or expired
    if (error.response?.status === 401) {
      console.warn("🚫 Unauthorized (401) - clearing auth data");
      await clearAuthData();
      // IMPORTANT: Frontend components should detect 401 errors and redirect to login.
      // Example: if (error.status === 401) { router.replace("/login"); }
      // This gives us flexibility to show session expired messages before redirecting.
    }
    return Promise.reject(normalizeError(error));
  },
);

// Export configured instance
export default apiClient;

// Helper type for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Helper type for paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
