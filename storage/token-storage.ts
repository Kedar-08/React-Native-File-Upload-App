import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "current_user";

export interface StoredUser {
  id: number;
  email: string;
}

// Save auth token securely
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// Get stored auth token
export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
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
