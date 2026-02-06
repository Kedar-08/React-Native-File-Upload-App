/**
 * User service for backend-driven user operations.
 * Handles user search, list, and profile operations.
 */

import {
  adaptPaginatedUserResponse,
  adaptUserArray,
} from "./adapters/user-adapter";
import apiClient from "./api-client";
import { normalizeError } from "./normalize-error";

/**
 * User profile data.
 * NOTE: The `id` field is INTERNAL ONLY - never display it in the UI.
 * Users interact with each other using username/email, not numeric IDs.
 */
export interface User {
  id: number; // @internal - Backend/frontend use only, DO NOT SHOW IN UI
  username: string;
  fullName: string;
  email?: string; // May be hidden for privacy
}

export interface UserSearchResult {
  users: User[];
  hasMore: boolean;
}

/**
 * Search users by username or name (Instagram-style).
 * Call this as user types in the search field.
 */
export async function searchUsers(
  query: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<UserSearchResult> {
  try {
    if (!query || query.trim().length < 2) {
      return { users: [], hasMore: false };
    }

    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get("/users/search", {
      params: {
        q: query.trim(),
        page,
        pageSize,
      },
    });

    // Use adapter to handle different backend response shapes
    return adaptPaginatedUserResponse(response.data);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("User search failed:", ne);
    throw {
      message: ne.message || "Failed to search users",
      code: ne.code || "SEARCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get a list of all users (for sharing suggestions).
 */
export async function getUsers(
  page: number = 1,
  pageSize: number = 50,
): Promise<UserSearchResult> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get("/users", {
      params: { page, pageSize },
    });

    // Use adapter to handle different backend response shapes
    // Use adapter to handle different backend response shapes
    return adaptPaginatedUserResponse(response.data);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to get users:", ne);
    throw {
      message: ne.message || "Failed to load users",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get a specific user by ID.
 */
export async function getUserById(userId: number): Promise<User | null> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get(`/users/${userId}`);
    // Use adapter to handle different backend response shapes
    return adaptUserArray([response.data])[0] ?? null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    const ne = normalizeError(error);
    console.error("Failed to get user:", ne);
    throw {
      message: ne.message || "Failed to load user",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get a specific user by username.
 */
export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get(
      `/users/username/${username.toLowerCase()}`,
    );
    // Use adapter to handle different backend response shapes
    return adaptUserArray([response.data])[0] ?? null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    const ne = normalizeError(error);
    console.error("Failed to get user by username:", ne);
    throw {
      message: ne.message || "Failed to load user",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}
