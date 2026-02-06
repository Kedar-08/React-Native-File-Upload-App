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
import { installMockApiInterceptor } from "./mock-api";
import { normalizeError } from "./normalize-error";

// Base URL for the backend API
// TODO: Replace with actual backend URL when available
const API_BASE_URL = "https://api.example.com/v1";

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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      await clearAuthData();
      // Note: Navigation should be handled by the calling code
    }
    return Promise.reject(normalizeError(error));
  },
);

// Install mock API interceptor for development (comment out when backend is ready)
installMockApiInterceptor(apiClient);

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
