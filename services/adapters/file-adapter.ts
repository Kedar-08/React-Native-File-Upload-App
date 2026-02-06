/**
 * File Response Adapter
 * Maps backend file responses to internal FileMetadata model.
 * Handles different backend response shapes and key naming conventions.
 */

import type { FileMetadata } from "../file-service";

export interface BackendFileResponse {
  id?: number;
  fileName?: string;
  file_name?: string;
  name?: string;
  fileType?: string;
  file_type?: string;
  type?: string;
  mimeType?: string;
  mime_type?: string;
  fileSize?: number;
  file_size?: number;
  size?: number;
  downloadUrl?: string;
  download_url?: string;
  url?: string;
  uploadedByUserId?: number;
  uploaded_by_user_id?: number;
  uploadedBy?: { id: number };
  uploaded_by?: { id: number };
  uploadedByUsername?: string;
  uploaded_by_username?: string;
  uploadedByEmail?: string;
  uploaded_by_email?: string;
  timestamp?: string;
  createdAt?: string;
  created_at?: string;
  uploadedAt?: string;
  uploaded_at?: string;
  [key: string]: any;
}

/**
 * Adapt backend file response to internal FileMetadata model.
 * Flexible mapping handles snake_case, camelCase, and abbreviated keys.
 */
export function adaptFileResponse(
  backendFile: BackendFileResponse,
): FileMetadata {
  const userId =
    backendFile.uploadedByUserId ??
    backendFile.uploaded_by_user_id ??
    (backendFile.uploadedBy?.id || backendFile.uploaded_by?.id) ??
    0;

  const timestamp =
    backendFile.timestamp ??
    backendFile.createdAt ??
    backendFile.created_at ??
    backendFile.uploadedAt ??
    backendFile.uploaded_at ??
    new Date().toISOString();

  return {
    id: backendFile.id ?? 0,
    fileName:
      backendFile.fileName ??
      backendFile.file_name ??
      backendFile.name ??
      "File",
    fileType:
      backendFile.fileType ??
      backendFile.file_type ??
      backendFile.type ??
      backendFile.mimeType ??
      backendFile.mime_type ??
      "application/octet-stream",
    fileSize:
      backendFile.fileSize ?? backendFile.file_size ?? backendFile.size ?? 0,
    uploadedByUserId: userId,
    uploadedByUsername:
      backendFile.uploadedByUsername ??
      backendFile.uploaded_by_username ??
      "Unknown",
    uploadedByEmail:
      backendFile.uploadedByEmail ??
      backendFile.uploaded_by_email ??
      "unknown@example.com",
    timestamp,
    downloadUrl:
      backendFile.downloadUrl ?? backendFile.download_url ?? backendFile.url,
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
