/**
 * Adapters index - centralized exports for all response adapters.
 * Use these when mapping backend responses to internal models.
 */

// Auth adapter
export {
  adaptAuthTokenResponse,
  adaptUserResponse as adaptAuthUserResponse,
  extractToken,
  extractUser,
  type BackendAuthResponse,
  type BackendAuthTokenResponse,
} from "./auth-adapter";

// File adapter
export {
  adaptFileArray,
  adaptFileResponse,
  type BackendFileResponse,
} from "./file-adapter";

// User adapter
export {
  adaptPaginatedUserResponse,
  adaptUserResponse as adaptUserApiResponse,
  adaptUserArray,
  type BackendUserResponse,
} from "./user-adapter";

// Share adapter
export {
  adaptShareArray,
  adaptShareResponse,
  type BackendShareResponse,
} from "./share-adapter";
