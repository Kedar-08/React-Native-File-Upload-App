/**
 * File Response Adapter
 * Maps backend file responses to internal FileMetadata model.
 * Handles different backend response shapes and key naming conventions.
 */

import type { FileMetadata } from "../file-service";

export interface BackendFileResponse {
  id?: number;
  file_id?: string; // UUID from backend
  fileName?: string;
  file_name?: string;
  name?: string;
  fileType?: string;
  file_type?: string;
  type?: string;
  mimeType?: string;
  mime_type?: string;
  fileSize?: number;
  file_size?: number | string; // Backend sends as string
  size?: number;
  downloadUrl?: string;
  download_url?: string;
  url?: string;
  uploadedByUserId?: number;
  uploaded_by_user_id?: number;
  uploaded_by?: string | number | { id: number }; // API #12: userId as string or number, or object
  owner_id?: number | string; // Backend sends as string
  uploadedBy?: { id: number };
  uploadedByUsername?: string;
  uploaded_by_username?: string;
  uploadedByEmail?: string;
  uploaded_by_email?: string;
  timestamp?: string;
  createdAt?: string;
  created_at?: string;
  uploadedAt?: string;
  uploaded_at?: string;
  upload_time?: string;
  file_path?: string; // API #12
  [key: string]: any;
}

/**
 * Adapt backend file response to internal FileMetadata model.
 * Flexible mapping handles snake_case, camelCase, and abbreviated keys.
 * NOTE: File list endpoint doesn't return username/email, so we use owner_id instead.
 * For current user's files, display "You". For shared files, fetch user info separately.
 */
export function adaptFileResponse(
  backendFile: BackendFileResponse,
): FileMetadata {
  // Handle uploaded_by: can be string (userId), number, or object with id
  let uploadedByUserId = 0;
  if (typeof backendFile.uploaded_by === "string") {
    uploadedByUserId = parseInt(backendFile.uploaded_by) || 0;
  } else if (typeof backendFile.uploaded_by === "number") {
    uploadedByUserId = backendFile.uploaded_by;
  } else if (
    backendFile.uploaded_by &&
    typeof backendFile.uploaded_by === "object" &&
    "id" in backendFile.uploaded_by
  ) {
    uploadedByUserId = backendFile.uploaded_by.id;
  }

  // Fallback to owner_id or uploadedByUserId
  if (uploadedByUserId === 0) {
    uploadedByUserId = parseInt(
      String(backendFile.owner_id ?? backendFile.uploadedByUserId ?? 0),
    );
  }

  return {
    id: backendFile.file_id ?? backendFile.id ?? "",
    fileName: decodeURIComponent(
      backendFile.file_name ??
        backendFile.fileName ??
        backendFile.name ??
        "File",
    ),
    fileType:
      backendFile.file_type ??
      backendFile.fileType ??
      backendFile.mimeType ??
      "application/octet-stream",
    fileSize: parseInt(
      String(backendFile.file_size ?? backendFile.fileSize ?? 0),
    ),
    uploadedByUserId,
    // Backend doesn't return username/email in file list
    // For current user's uploaded files, use "You"
    // For shared files, fetch user info separately via API
    uploadedByUsername:
      backendFile.uploaded_by_username ??
      backendFile.uploadedByUsername ??
      "You",
    uploadedByEmail:
      backendFile.uploaded_by_email ?? backendFile.uploadedByEmail ?? "",
    timestamp:
      backendFile.upload_time ??
      backendFile.uploaded_at ??
      backendFile.created_at ??
      new Date().toISOString(),
    downloadUrl:
      backendFile.download_url ?? backendFile.downloadUrl ?? backendFile.url,
  };
}

/**
 * Adapt array of backend file responses.
 */
export function adaptFileArray(
  backendFiles: BackendFileResponse[],
): FileMetadata[] {
  return (backendFiles ?? []).map(adaptFileResponse);
}
