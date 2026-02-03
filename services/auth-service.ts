import {
  clearAuthData,
  getCurrentUser,
  getToken,
  saveCurrentUser,
  saveToken,
  type StoredUser,
} from "@/storage";
import { createUser, findUserByEmail, verifyPassword } from "./db-service";

export interface AuthResult {
  success: boolean;
  message: string;
  user?: StoredUser;
  token?: string;
  field?: "email" | "password";
}

// Generate a simple auth token
function generateToken(userId: number, email: string): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${userId}-${timestamp}-${randomPart}`;
}

// Sign up a new user
export async function signup(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
        field: !email ? "email" : "password",
      };
    }

    if (!email.includes("@")) {
      return {
        success: false,
        message: "Please enter a valid email",
        field: "email",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
        field: "password",
      };
    }

    // Create user in database
    const user = await createUser(email.toLowerCase().trim(), password);

    // Generate token
    const token = generateToken(user.id, user.email);

    // Store token and user info
    const storedUser: StoredUser = { id: user.id, email: user.email };
    await saveToken(token);
    await saveCurrentUser(storedUser);

    return {
      success: true,
      message: "Account created successfully",
      user: storedUser,
      token,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Signup failed";
    return { success: false, message: errorMessage };
  }
}

// Login an existing user
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, message: "Email and password are required" };
    }

    // Find user
    const user = await findUserByEmail(email.toLowerCase().trim());

    if (!user) {
      return { success: false, message: "Invalid email", field: "email" };
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return { success: false, message: "Invalid password", field: "password" };
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Store token and user info
    const storedUser: StoredUser = { id: user.id, email: user.email };
    await saveToken(token);
    await saveCurrentUser(storedUser);

    return {
      success: true,
      message: "Login successful",
      user: storedUser,
      token,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Login failed";
    return { success: false, message: errorMessage };
  }
}

// Logout the current user
export async function logout(): Promise<void> {
  await clearAuthData();
}

// Check if user is logged in
export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  const user = await getCurrentUser();
  return !!(token && user);
}

// Get current logged in user
export async function getLoggedInUser(): Promise<StoredUser | null> {
  const token = await getToken();
  if (!token) return null;

  return await getCurrentUser();
}
