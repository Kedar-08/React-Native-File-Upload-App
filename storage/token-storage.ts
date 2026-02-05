import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "current_user";

export interface StoredUser {
  id: number;
  email: string;
}

interface TokenData {
  token: string;
  expiresAt: number; // Unix timestamp
}

// Save auth token with expiry
export async function saveToken(
  token: string,
  expiryDays: number = 7,
): Promise<void> {
  const expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
  const tokenData: TokenData = { token, expiresAt };
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokenData));
}

// Get stored auth token (returns null if expired)
export async function getToken(): Promise<string | null> {
  const tokenDataJson = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!tokenDataJson) return null;

  try {
    const tokenData: TokenData = JSON.parse(tokenDataJson);

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      await deleteToken(); // Clean up expired token
      return null;
    }

    return tokenData.token;
  } catch {
    // If parsing fails, it might be an old format token, return it but consider migrating
    return tokenDataJson;
  }
}

// Delete auth token (logout)
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Save current user info
export async function saveCurrentUser(user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

// Get current user info
export async function getCurrentUser(): Promise<StoredUser | null> {
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  if (userJson) {
    return JSON.parse(userJson);
  }
  return null;
}

// Delete current user info (logout)
export async function deleteCurrentUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

// Clear all auth data
export async function clearAuthData(): Promise<void> {
  await deleteToken();
  await deleteCurrentUser();
}
