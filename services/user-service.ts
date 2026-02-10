/**
 * User service for backend-driven user operations.
 * Handles user search, list, and profile operations.
 */

import { adaptUserArray } from "./adapters/user-adapter";
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
 * Get a list of all users (for sharing suggestions).
 */
export async function getUsers(
  page: number = 1,
  pageSize: number = 50,
): Promise<UserSearchResult> {
  try {
    console.log(
      "📥 [getUsers] Fetching user list with page:",
      page,
      "pageSize:",
      pageSize,
    );

    // Call backend API to get list of users
    const response = await apiClient.get("/api/v1/users/user_list");
    console.log("📨 [getUsers] Raw response.data type:", typeof response.data);
    console.log(
      "📨 [getUsers] Is response.data an array?",
      Array.isArray(response.data),
    );
    console.log("📨 [getUsers] response.data:", response.data);

    // Use adapter to handle different backend response shapes
    // Backend returns array directly: [{id, fullname, username, email, phone_number}]
    const users = adaptUserArray(response.data);
    console.log("✅ [getUsers] Adapted users count:", users.length);
    console.log("✅ [getUsers] Adapted users sample:", users.slice(0, 2));

    const result: UserSearchResult = {
      users,
      hasMore: false, // No pagination in this API
    };
    console.log("✅ [getUsers] Returning result:", result);
    return result;
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("❌ [getUsers] Failed to get users:", ne);
    throw {
      message: ne.message || "Failed to load users",
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

/**
 * Get a specific user by ID.
 * Fetches all users and finds the one with matching ID (simple cache-free approach).
 */
export async function getUserById(userId: number): Promise<User | null> {
  try {
    const result = await getUsers();
    return result.users.find((u) => u.id === userId) ?? null;
  } catch (error: any) {
    console.error("Failed to get user by ID:", error);
    return null;
  }
}
