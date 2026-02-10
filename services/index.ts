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
  handleTokenExpired,
  isCurrentTokenExpired,
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

// JWT Utilities
export {
  decodeJwt,
  getTokenExpiryDate,
  getTokenExpiryIn,
  isJwtExpired,
  isTokenExpiringsoon,
  type JwtPayload,
} from "./jwt-utils";

// User Service
export {
  getUserById,
  getUserByUsername,
  getUsers,
  type User,
  type UserSearchResult,
} from "./user-service";

// File Service
export {
  deleteFile,
  downloadAndOpenFile,
  formatFileSize,
  formatTimestamp,
  getFileDetailsById,
  getMyFiles,
  openMyFile,
  pickFile,
  uploadFile,
  uploadMultipleFiles,
  type FileMetadata,
  type MultiUploadResult,
  type UploadResult,
} from "./file-service";

// Share Service
export {
  getSharedWithMe,
  shareFile,
  type SharedFile,
  type ShareFileRequest,
  type ShareResult,
} from "./share-service";

// File Utilities
export { getFileIcon, getFriendlyFileLabel, validateEmail } from "./file-utils";
