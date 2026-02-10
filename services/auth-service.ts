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
import apiClient from "./api-client";
import { normalizeError } from "./normalize-error";

// Extended stored user with backend fields
export interface StoredUserProfile extends StoredUser {
  fullName?: string;
  username?: string;
  createdAt?: string; // ISO datetime when account was created
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
  phoneNumber: string;
}

export interface LoginData {
  username: string;
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

    if (!data.phoneNumber?.trim()) {
      return {
        success: false,
        message: "Phone number is required",
        field: "phoneNumber" as any,
      };
    }

    // Basic Indian phone number validation: 10 digits
    const phoneDigits = data.phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return {
        success: false,
        message: "Phone number must be at least 10 digits",
        field: "phoneNumber" as any,
      };
    }

    // Call backend signup API
    const signupResponse = await apiClient.post("/api/v1/users/create_user", {
      fullname: data.fullName.trim(),
      username: data.username.trim().toLowerCase(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      phone_number: data.phoneNumber.replace(/\D/g, ""),
    });

    // Backend signup returns user data but no token.
    // Auto-login with the same credentials to get token.
    const signupUser = signupResponse.data;
    const loginResponse = await apiClient.post<{
      access_token: string;
      token_type: string;
    }>("/api/v1/users/login", {
      username: signupUser.username,
      password: data.password,
    });

    const token = loginResponse.data.access_token;

    // After successful signup, fetch full user profile with created_at
    let storedUser: StoredUserProfile = {
      id: signupUser.id ?? 0,
      email: signupUser.email ?? "",
      username: signupUser.username ?? "",
      fullName: data.fullName,
    };

    try {
      const profileResponse = await apiClient.get("/api/v1/users/user_profile");
      const adaptUserResponse = (await import("./adapters/auth-adapter"))
        .adaptUserResponse;
      storedUser = adaptUserResponse(profileResponse.data);
    } catch (profileError) {
      console.warn(
        "⚠️ Failed to fetch user profile after signup, using signup data",
        profileError,
      );
    }

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
    // Use backend `detail` message if available
    const backendMessage = error.response?.data?.detail || ne.message;

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
      message: backendMessage || "Signup failed",
    };
  }
}

/**
 * Login an existing user via backend API.
 */
export async function login(data: LoginData): Promise<AuthResult> {
  try {
    // Frontend validation
    if (!data.username?.trim() || !data.password) {
      return {
        success: false,
        message: "Username and password are required",
      };
    }

    console.log("🔐 Attempting login with username:", data.username);

    // Call backend login API
    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
    }>("/api/v1/users/login", {
      username: data.username.trim(),
      password: data.password,
    });

    console.log("✅ Login response received:", response.data);

    const token = response.data.access_token;

    // Save token first
    await saveToken(token);
    console.log("✅ Token saved");

    // Fetch full user profile from backend using the new token
    let storedUser: StoredUserProfile = {
      id: 0,
      email: "",
      username: data.username.trim(),
    };

    try {
      const profileResponse = await apiClient.get("/api/v1/users/user_profile");
      const adaptUserResponse = (await import("./adapters/auth-adapter"))
        .adaptUserResponse;
      storedUser = adaptUserResponse(profileResponse.data);
    } catch (profileError) {
      console.warn(
        "⚠️ Failed to fetch user profile after login, using minimal data",
        profileError,
      );
    }

    await saveCurrentUser(storedUser);
    console.log("✅ User saved");

    return {
      success: true,
      message: "Login successful",
      user: storedUser,
      token,
    };
  } catch (error: any) {
    console.error("❌ Login error:", error);
    const ne = normalizeError(error);
    const backendMessage = error.response?.data?.detail || ne.message;

    return {
      success: false,
      message: backendMessage || "Login failed",
    };
  }
}

/**
 * Logout the current user.
 */
export async function logout(): Promise<void> {
  try {
    // API #13: Best-effort logout - notify backend but don't fail if it errors
    console.log("🚪 [logout] Calling backend logout API...");
    try {
      const response = await apiClient.post("/api/v1/users/logout");
      console.log("✅ [logout] Backend logout successful:", response.data);
    } catch (apiError) {
      // Silently continue - API failure doesn't block logout
      // (logged at debug level only, not visible during demo)
    }
  } finally {
    // Always clear local auth data
    console.log("🗑️ [logout] Clearing local auth data...");
    await clearAuthData();
    console.log("✅ [logout] Complete - user logged out");
  }
}

/**
 * Handle token expiration - clear auth and signal re-login needed.
 * Called when 401 is received or token is detected as expired.
 */
export async function handleTokenExpired(): Promise<void> {
  console.warn("🚫 Token expired - clearing auth and requiring re-login");
  await clearAuthData();
  // Frontend (App.tsx or route handler) should detect this and redirect to /login
}

/**
 * Check if current token is expired or expiring soon.
 */
export async function isCurrentTokenExpired(): Promise<boolean> {
  const token = await getToken();
  if (!token) return true;

  const { isJwtExpired, isTokenExpiringsoon } = await import("./jwt-utils");
  // Consider expired if it's actually expired OR expiring within 5 min
  return isJwtExpired(token) || isTokenExpiringsoon(token, 300);
}

/**
 * Check if user is logged in with a valid, non-expired token.
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const token = await getToken();
    const user = await getCurrentUser();

    if (!token || !user) {
      return false;
    }

    // Also verify token is not expired
    const { isJwtExpired } = await import("./jwt-utils");
    return !isJwtExpired(token);
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
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
    console.log(
      "🔄 [refreshUserProfile] Fetching user profile from backend...",
    );
    const response = await apiClient.get("/api/v1/users/user_profile");
    console.log(
      "✅ [refreshUserProfile] Raw backend response:",
      JSON.stringify(response.data, null, 2),
    );
    // Use adapter to map backend user response
    const adaptUserResponse = (await import("./adapters/auth-adapter"))
      .adaptUserResponse;
    const storedUser = adaptUserResponse(response.data);
    console.log(
      "✅ [refreshUserProfile] Adapted user:",
      JSON.stringify(storedUser, null, 2),
    );

    await saveCurrentUser(storedUser);
    return storedUser;
  } catch (error) {
    console.error("❌ [refreshUserProfile] Failed:", error);
    return null;
  }
}
