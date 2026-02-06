/**
 * Storage index - Token storage only (no SQLite for core data).
 * Backend is now the source of truth for all data.
 */

export {
  clearAuthData,
  deleteCurrentUser,
  deleteToken,
  getCurrentUser,
  getToken,
  saveCurrentUser,
  saveToken,
  type StoredUser,
} from "./token-storage";

// Note: SQLite database exports removed.
// Backend APIs are now the source of truth for users, files, and shares.
// SQLite can be re-added later as an optional offline cache if needed.
