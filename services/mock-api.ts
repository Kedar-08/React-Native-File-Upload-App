/**
 * Mock API adapter for development/testing.
 * Replaces axios's HTTP adapter so NO network requests are made.
 * Toggle ENABLE_MOCK_API to switch between mock and real backend.
 */

import { getCurrentUser } from "@/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  mockAuthUser,
  mockFiles,
  mockSharedFiles,
  mockTestUsers,
  mockUsers,
} from "./mock-data";

// ──────────────────────────────────────────────
// Toggle this to enable/disable mock API
export const ENABLE_MOCK_API = true;
// ──────────────────────────────────────────────

// Simulated network delay (ms) - helps catch timing bugs
const MOCK_DELAY = 500;

// Storage keys
const READ_SHARES_STORAGE_KEY = "@app/mock_read_shares";
const MOCK_USERS_STORAGE_KEY = "@app/mock_registered_users";

// ── Mock State Management ──────────────────────
// Track which shares have been marked as read (persisted to device storage)
let readShareIds = new Set<number>();
let isInitialized = false;
// Track currently logged-in user
let currentLoggedInUser: (typeof mockTestUsers)[0] | null = null;
// Track all registered users (persisted to device storage)
let registeredUsers: typeof mockTestUsers = [];

/**
 * Initialize read shares from persistent storage
 */
async function initializeReadShares(): Promise<void> {
  if (isInitialized) return;

  try {
    const stored = await AsyncStorage.getItem(READ_SHARES_STORAGE_KEY);
    if (stored) {
      readShareIds = new Set(JSON.parse(stored));
      console.log(`✓ Loaded ${readShareIds.size} previously read shares`);
    }

    // Load registered users
    const storedUsers = await AsyncStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (storedUsers) {
      registeredUsers = JSON.parse(storedUsers);
      console.log(`✓ Loaded ${registeredUsers.length} registered users`);
    } else {
      // Initialize with default test users
      registeredUsers = [...mockTestUsers];
    }

    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize mock state:", error);
    isInitialized = true;
  }
}

/**
 * Persist read share IDs to storage
 */
async function persistReadShares(): Promise<void> {
  try {
    const data = JSON.stringify(Array.from(readShareIds));
    await AsyncStorage.setItem(READ_SHARES_STORAGE_KEY, data);
  } catch (error) {
    console.error("Failed to persist read shares:", error);
  }
}

/**
 * Persist registered users to storage
 */
async function persistRegisteredUsers(): Promise<void> {
  try {
    const data = JSON.stringify(registeredUsers);
    await AsyncStorage.setItem(MOCK_USERS_STORAGE_KEY, data);
    console.log(`✓ Persisted ${registeredUsers.length} registered users`);
  } catch (error) {
    console.error("Failed to persist registered users:", error);
  }
}

function getSharedFilesWithReadStatus() {
  return mockSharedFiles.map((share) => ({
    ...share,
    isRead: share.isRead || readShareIds.has(share.id),
  }));
}

// ─────────────────────────────────────────────

/**
 * Sleep for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock response with proper axios structure
 */
function createMockResponse<T>(
  data: T,
  config: InternalAxiosRequestConfig,
  status = 200,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
  };
}

/**
 * Mock adapter — completely replaces the HTTP adapter.
 * Requests never hit the network; responses come from mock data.
 */
async function mockAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  // Initialize persistent storage on first request
  if (!isInitialized) {
    await initializeReadShares();
  }

  await delay(MOCK_DELAY);

  // Build the full URL the same way axios does
  const url = config.url || "";
  const method = (config.method || "get").toUpperCase();

  console.log(`📡 Mock API [${method}] ${url}`);

  // ── Auth endpoints ──────────────────────────
  if (url.includes("/auth/signup") && method === "POST") {
    const requestData = JSON.parse(config.data || "{}");

    // Check if user already exists in registered users
    const existingUser = registeredUsers.find(
      (u) => u.email === requestData.email,
    );
    if (existingUser) {
      return Promise.reject({
        response: {
          status: 400,
          data: {
            code: "EMAIL_EXISTS",
            message: "Email is already registered",
          },
        },
        message: "Email is already registered",
        isAxiosError: true,
      });
    }

    // Create new user from provided data
    const newUser = {
      id: Math.floor(Math.random() * 10000),
      email: requestData.email,
      password: requestData.password,
      fullName: requestData.fullName || requestData.email.split("@")[0],
      username:
        requestData.username || requestData.email.split("@")[0].toLowerCase(),
      token: `mock-token-${Date.now()}`,
    };

    // Store in registered users and persist
    registeredUsers.push(newUser);
    await persistRegisteredUsers();

    currentLoggedInUser = newUser;
    const { password, ...userWithoutPassword } = newUser;
    return createMockResponse(
      { user: userWithoutPassword, token: newUser.token },
      config,
    );
  }

  if (url.includes("/auth/login") && method === "POST") {
    const requestData = JSON.parse(config.data || "{}");

    // Check registered users (includes both predefined and newly signed up users)
    const user = registeredUsers.find(
      (u) =>
        u.email === requestData.email && u.password === requestData.password,
    );
    if (user) {
      currentLoggedInUser = user;
      const { password, ...userWithoutPassword } = user;
      return createMockResponse(
        { user: userWithoutPassword, token: user.token },
        config,
      );
    }

    // Return authentication error for invalid credentials (realistic behavior)
    return Promise.reject({
      response: {
        status: 401,
        data: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      },
      message: "Invalid email or password",
      isAxiosError: true,
    });
  }

  if (url.includes("/auth/refresh") && method === "GET") {
    return createMockResponse({ user: mockAuthUser }, config);
  }

  if (url.includes("/auth/me") && method === "GET") {
    // Read from persistent storage to return correct user after reload
    const storedUser = await getCurrentUser();
    console.log("📋 /auth/me - stored user:", storedUser);
    if (storedUser) {
      // Find matching test user to return full profile
      const testUser = mockTestUsers.find((u) => u.email === storedUser.email);
      if (testUser) {
        console.log("✓ Found matching test user:", testUser.email);
        const { password, ...userWithoutPassword } = testUser;
        return createMockResponse(userWithoutPassword, config);
      }
      // Return stored user data if no test user match (e.g., new signups)
      console.log("✓ Returning stored user (new signup):", storedUser.email);
      return createMockResponse(storedUser, config);
    }
    // Fallback to in-memory or default
    if (currentLoggedInUser) {
      console.log("⚠ Using in-memory user:", currentLoggedInUser.email);
      const { password, ...userWithoutPassword } = currentLoggedInUser;
      return createMockResponse(userWithoutPassword, config);
    }
    console.log("⚠ No user found, returning default mockAuthUser");
    return createMockResponse(mockAuthUser, config);
  }

  if (url.includes("/auth/logout") && method === "POST") {
    return createMockResponse({ success: true }, config);
  }

  // ── File endpoints ──────────────────────────
  if (url.includes("/files") && !url.includes("/download")) {
    if (method === "GET" && url.includes("/my-files")) {
      return createMockResponse(mockFiles, config);
    }

    if (method === "GET" && url.match(/\/files\/\d+$/)) {
      const id = parseInt(url.split("/").pop() || "0");
      const file = mockFiles.find((f) => f.id === id);
      return createMockResponse(file || null, config);
    }

    if (method === "POST") {
      const newFile = {
        id: mockFiles.length + 1,
        fileName: "new-file.pdf",
        fileType: "application/pdf",
        fileSize: 1024000,
        uploadedByUserId: mockAuthUser.id,
        uploadedByUsername: mockAuthUser.username,
        uploadedByEmail: mockAuthUser.email,
        timestamp: new Date().toISOString(),
        downloadUrl: "https://api.example.com/files/new/download",
      };
      return createMockResponse({ file: newFile, success: true }, config);
    }

    if (method === "DELETE") {
      return createMockResponse({ success: true }, config);
    }
  }

  // File download (separate check so it's not blocked by the above)
  if (url.includes("/files") && url.includes("/download")) {
    return createMockResponse({ success: true }, config);
  }

  // ── User endpoints ──────────────────────────
  if (url.includes("/users/search")) {
    const query = new URLSearchParams(url.split("?")[1]).get("q") || "";
    const filtered = mockUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()),
    );
    return createMockResponse(
      {
        items: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      config,
    );
  }

  if (url.includes("/users") && method === "GET") {
    if (url.match(/\/users\/\d+$/)) {
      const id = parseInt(url.split("/").pop() || "0");
      const user = mockUsers.find((u) => u.id === id);
      return createMockResponse(user || null, config);
    }

    if (url.includes("/username/")) {
      const username = url.split("/username/")[1];
      const user = mockUsers.find((u) => u.username === username);
      return createMockResponse(user || null, config);
    }

    return createMockResponse(mockUsers, config);
  }

  // ── Share endpoints ─────────────────────────
  if (url.includes("/shares")) {
    if (method === "GET" && url.includes("/shares/inbox")) {
      return createMockResponse(getSharedFilesWithReadStatus(), config);
    }

    if (method === "GET" && url.includes("/shares/sent")) {
      return createMockResponse([], config);
    }

    if (method === "GET" && url.includes("/unread-count")) {
      const unreadCount = getSharedFilesWithReadStatus().filter(
        (s) => !s.isRead,
      ).length;
      return createMockResponse({ count: unreadCount }, config);
    }

    if (method === "POST" && url.endsWith("/shares")) {
      // Share file endpoint - expects { fileId, fromUserId, toUserId }
      return createMockResponse(
        {
          id: Math.floor(Math.random() * 10000),
          message: "File shared successfully",
        },
        config,
      );
    }

    if (method === "PATCH" && url.includes("/read")) {
      // Extract share ID from URL like /shares/1/read
      const shareId = parseInt(url.split("/")[2] || "0");
      if (shareId) {
        readShareIds.add(shareId);
        console.log(`✓ Share ${shareId} marked as read`);
        // Persist to storage
        persistReadShares();
      }
      return createMockResponse({ success: true }, config);
    }

    if (method === "DELETE") {
      return createMockResponse({ success: true }, config);
    }
  }

  // ── Fallback ────────────────────────────────
  console.warn(`⚠️ No mock handler for [${method}] ${url}`);
  return createMockResponse({ message: "No mock handler" }, config, 404);
}

/**
 * Install mock adapter on the axios instance.
 * When enabled, ALL requests are handled locally — no network at all.
 */
export function installMockApiInterceptor(apiClient: AxiosInstance): void {
  if (!ENABLE_MOCK_API) return;

  console.log("🔧 Mock API interceptor installed (DEVELOPMENT MODE)");
  apiClient.defaults.adapter = mockAdapter;
}

/**
 * Check if mock API is enabled
 */
export function isMockApiEnabled(): boolean {
  return ENABLE_MOCK_API;
}

/**
 * Get mock API status for debugging
 */
export function getMockApiStatus() {
  return {
    enabled: ENABLE_MOCK_API,
    delay: MOCK_DELAY,
    mockDataCount: {
      users: mockUsers.length,
      files: mockFiles.length,
      sharedFiles: mockSharedFiles.length,
    },
  };
}
