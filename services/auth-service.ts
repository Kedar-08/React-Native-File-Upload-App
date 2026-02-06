/**
 * Authentication service for backend-driven auth.
 * Handles signup, login, logout, and session management.
 */

import {
  clearAuthData,
  getCurrentUser,
  getToken,
  saveCurrentUser,
  saveToken,
  type StoredUser,
} from "@/storage";
import { adaptAuthTokenResponse } from "./adapters/auth-adapter";
import apiClient from "./api-client";
import { normalizeError } from "./normalize-error";

// Extended stored user with backend fields
export interface StoredUserProfile extends StoredUser {
  fullName?: string;
  username?: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: StoredUserProfile;
  token?: string;
  field?: "fullName" | "username" | "email" | "password" | "confirmPassword";
}

export interface SignupData {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Backend response types
interface AuthResponse {
  token: string;
  userId: number;
  user: {
    id: number;
    email: string;
    username: string;
    fullName: string;
  };
}

/**
 * Sign up a new user via backend API.
 */
export async function signup(data: SignupData): Promise<AuthResult> {
  try {
    // Frontend validation
    if (!data.fullName?.trim()) {
      return {
        success: false,
        message: "Full name is required",
        field: "fullName",
      };
    }

    if (!data.username?.trim()) {
      return {
        success: false,
        message: "Username is required",
        field: "username",
      };
    }

    if (data.username.length < 3) {
      return {
        success: false,
        message: "Username must be at least 3 characters",
        field: "username",
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      return {
        success: false,
        message: "Username can only contain letters, numbers, and underscores",
        field: "username",
      };
    }

    if (!data.email?.trim()) {
      return {
        success: false,
        message: "Email is required",
        field: "email",
      };
    }

    if (!data.email.includes("@")) {
      return {
        success: false,
        message: "Please enter a valid email",
        field: "email",
      };
    }

    if (!data.password) {
      return {
        success: false,
        message: "Password is required",
        field: "password",
      };
    }

    if (data.password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
        field: "password",
      };
    }

    // Call backend signup API
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.post<AuthResponse>("/auth/signup", {
      fullName: data.fullName.trim(),
      username: data.username.trim().toLowerCase(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    // Use adapter to map backend response to internal model
    const { token, user } = adaptAuthTokenResponse(response.data);

    // Store token and user info
    const storedUser: StoredUserProfile = user;

    await saveToken(token);
    await saveCurrentUser(storedUser);

    return {
      success: true,
      message: "Account created successfully",
      user: storedUser,
      token,
    };
  } catch (error: any) {
    const ne = normalizeError(error);
    // Handle specific backend errors
    if (ne.code === "USERNAME_TAKEN") {
      return {
        success: false,
        message: "Username is already taken",
        field: "username",
      };
    }
    if (ne.code === "EMAIL_EXISTS") {
      return {
        success: false,
        message: "Email is already registered",
        field: "email",
      };
    }

    return {
      success: false,
      message: ne.message || "Signup failed",
    };
  }
}

/**
 * Login an existing user via backend API.
 */
export async function login(data: LoginData): Promise<AuthResult> {
  try {
    // Frontend validation
    if (!data.email || !data.password) {
      return {
        success: false,
        message: "Email and password are required",
      };
    }

    // Call backend login API
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    // Use adapter to map backend response to internal model
    const { token, user } = adaptAuthTokenResponse(response.data);

    // Store token and user info
    const storedUser: StoredUserProfile = user;

    await saveToken(token);
    await saveCurrentUser(storedUser);

    return {
      success: true,
      message: "Login successful",
      user: storedUser,
      token,
    };
  } catch (error: any) {
    const ne = normalizeError(error);
    if (ne.code === "INVALID_CREDENTIALS") {
      return {
        success: false,
        message: "Invalid email or password",
        field: "password",
      };
    }
    if (ne.code === "USER_NOT_FOUND") {
      return {
        success: false,
        message: "No account found with this email",
        field: "email",
      };
    }

    return {
      success: false,
      message: ne.message || "Login failed",
    };
  }
}

/**
 * Logout the current user.
 */
export async function logout(): Promise<void> {
  try {
    // Optionally notify backend of logout
    await apiClient.post("/auth/logout").catch(() => {
      // Ignore errors - we'll clear local data anyway
    });
  } finally {
    await clearAuthData();
  }
}

/**
 * Check if user is logged in with a valid token.
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  const user = await getCurrentUser();
  return !!(token && user);
}

/**
 * Get current logged in user from local storage.
 */
export async function getLoggedInUser(): Promise<StoredUserProfile | null> {
  return getCurrentUser() as Promise<StoredUserProfile | null>;
}

/**
 * Refresh user profile from backend.
 */
export async function refreshUserProfile(): Promise<StoredUserProfile | null> {
  try {
    const response = await apiClient.get("/auth/me");
    // Use adapter to map backend user response
    const adaptUserResponse = (await import("./adapters/auth-adapter"))
      .adaptUserResponse;
    const storedUser = adaptUserResponse(response.data);

    await saveCurrentUser(storedUser);
    return storedUser;
  } catch (error) {
    console.error("Failed to refresh user profile:", error);
    return null;
  }
}
