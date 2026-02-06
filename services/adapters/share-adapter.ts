/**
 * Share Response Adapter
 * Maps backend share responses to internal SharedFile model.
 * Handles different backend response shapes and key naming conventions.
 */

import type { SharedFile } from "../share-service";
import { adaptFileResponse, type BackendFileResponse } from "./file-adapter";

export interface BackendShareResponse {
  id?: number;
  fileId?: number;
  file_id?: number;
  file?: BackendFileResponse;
  fromUserId?: number;
  from_user_id?: number;
  fromUsername?: string;
  from_username?: string;
  fromFullName?: string;
  from_full_name?: string;
  toUserId?: number;
  to_user_id?: number;
  toUsername?: string;
  to_username?: string;
  sharedAt?: string;
  shared_at?: string;
  createdAt?: string;
  created_at?: string;
  isRead?: boolean;
  is_read?: boolean;
  read?: boolean;
  [key: string]: any;
}

/**
 * Adapt backend share response to internal SharedFile model.
 * Flexible mapping handles snake_case and camelCase naming.
 */
export function adaptShareResponse(
  backendShare: BackendShareResponse,
): SharedFile {
  const file = backendShare.file
    ? adaptFileResponse(backendShare.file)
    : ({
        id: backendShare.fileId ?? backendShare.file_id ?? 0,
        fileName: "File",
        fileType: "application/octet-stream",
        fileSize: 0,
        uploadedByUserId: 0,
        timestamp: new Date().toISOString(),
      } as any);

  return {
    id: backendShare.id ?? 0,
    fileId: backendShare.fileId ?? backendShare.file_id ?? 0,
    file,
    fromUserId: backendShare.fromUserId ?? backendShare.from_user_id ?? 0,
    fromUsername:
      backendShare.fromUsername ?? backendShare.from_username ?? "Unknown",
    fromFullName:
      backendShare.fromFullName ??
      backendShare.from_full_name ??
      "Unknown User",
    toUserId: backendShare.toUserId ?? backendShare.to_user_id ?? 0,
    toUsername:
      backendShare.toUsername ?? backendShare.to_username ?? "Unknown",
    sharedAt:
      backendShare.sharedAt ??
      backendShare.shared_at ??
      backendShare.createdAt ??
      backendShare.created_at ??
      new Date().toISOString(),
    isRead:
      backendShare.isRead ?? backendShare.is_read ?? backendShare.read ?? false,
  };
}

/**
 * Adapt array of backend share responses.
 */
export function adaptShareArray(
  backendShares: BackendShareResponse[],
): SharedFile[] {
  return (backendShares ?? []).map(adaptShareResponse);
}
