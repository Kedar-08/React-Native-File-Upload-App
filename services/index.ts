/**
 * Services index - centralized exports for all service modules.
 * UI components should import from here, not directly from service files.
 */

// API Client (for advanced use cases only)
export { default as apiClient } from "./api-client";
export type { ApiResponse, PaginatedResponse } from "./api-client";

// Auth Service
export {
  getLoggedInUser,
  isLoggedIn,
  login,
  logout,
  refreshUserProfile,
  signup,
  type AuthResult,
  type LoginData,
  type SignupData,
  type StoredUserProfile,
} from "./auth-service";

// User Service
export {
  getUserById,
  getUserByUsername,
  getUsers,
  searchUsers,
  type User,
  type UserSearchResult,
} from "./user-service";

// File Service
export {
  checkDuplicateFile,
  deleteFile,
  downloadAndOpenFile,
  formatFileSize,
  formatTimestamp,
  getFileById,
  getMyFiles,
  pickFile,
  uploadFile,
  uploadMultipleFiles,
  type FileMetadata,
  type MultiUploadResult,
  type UploadResult,
} from "./file-service";

// Share Service
export {
  getSharedByMe,
  getSharedWithMe,
  getUnreadShareCount,
  markShareAsRead,
  removeFromInbox,
  shareFile,
  type SharedFile,
  type ShareFileRequest,
  type ShareResult,
} from "./share-service";

// File Utilities
export { getFileIcon, getFriendlyFileLabel, validateEmail } from "./file-utils";
