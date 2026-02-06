/**
 * Share service for backend-driven file sharing.
 * Handles sharing files between users.
 */

import { adaptShareArray } from "./adapters/share-adapter";
import apiClient from "./api-client";
import { type FileMetadata } from "./file-service";
import { normalizeError } from "./normalize-error";

/**
 * Shared file record.
 * NOTE: ID fields (id, fileId, fromUserId, toUserId) are INTERNAL ONLY.
 * UI displays fromUsername/toUsername for user identification.
 */
export interface SharedFile {
  id: number; // @internal
  fileId: number; // @internal
  file: FileMetadata;
  fromUserId: number; // @internal - use fromUsername for display
  fromUsername: string;
  fromFullName?: string;
  toUserId: number; // @internal - use toUsername for display
  toUsername: string;
  sharedAt: string;
  isRead: boolean;
}

/**
 * Share file request.
 * NOTE: ID fields (fromUserId, toUserId) are INTERNAL ONLY and come from auth/lookup.
 */
export interface ShareFileRequest {
  fileId: number;
  fromUserId: number; // @internal - obtained from current auth session
  toUserId: number; // @internal - obtained from user lookup by username
}

export interface ShareResult {
  success: boolean;
  shareId?: number;
  message?: string;
  error?: string;
}

/**
 * Share a file with another user.
 */
export async function shareFile(
  request: ShareFileRequest,
): Promise<ShareResult> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.post<{ id: number; message: string }>(
      "/shares",
      {
        fileId: request.fileId,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
      },
    );

    return {
      success: true,
      shareId: response.data.id,
      message: response.data.message || "File shared successfully",
    };
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to share file:", ne);

    // Handle specific errors
    if (ne.code === "ALREADY_SHARED") {
      return {
        success: false,
        error: "File is already shared with this user",
      };
    }
    if (ne.code === "USER_NOT_FOUND") {
      return {
        success: false,
        error: "Recipient user not found",
      };
    }
    if (ne.code === "FILE_NOT_FOUND") {
      return {
        success: false,
        error: "File not found",
      };
    }
    return {
      success: false,
      error: ne.message || "Failed to share file",
    };
  }
}

/**
 * Get files shared with the current user (Inbox).
 */
export async function getSharedWithMe(): Promise<SharedFile[]> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get("/shares/inbox");
    // Use adapter to handle different backend response shapes
    return adaptShareArray(response.data);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to fetch shared files:", ne);
    throw {
      message: ne.message || "Failed to load shared files",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get files shared by the current user.
 */
export async function getSharedByMe(): Promise<SharedFile[]> {
  // This function is currently unused in the UI. Commenting out implementation for now
  // so we don't remove the API contract entirely. Keep the stub so callers won't break.
  /*
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get("/shares/sent");
    // Use adapter to handle different backend response shapes
    return adaptShareArray(response.data);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to fetch sent shares:", ne);
    throw {
      message: ne.message || "Failed to load sent shares",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
  */
  // Return empty array as a safe fallback while the UI doesn't use this endpoint.
  return [];
}

/**
 * Mark a shared file as read.
 */
export async function markShareAsRead(shareId: number): Promise<void> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    await apiClient.patch(`/shares/${shareId}/read`);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to mark share as read:", ne);
    // Don't throw - this is not critical
  }
}

/**
 * Remove a shared file from inbox (recipient side).
 */
export async function removeFromInbox(shareId: number): Promise<void> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    await apiClient.delete(`/shares/${shareId}`);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to remove shared file:", ne);
    throw {
      message: ne.message || "Failed to remove shared file",
      code: ne.code || "DELETE_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get unread share count for badge display.
 */
export async function getUnreadShareCount(): Promise<number> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get<{ count: number }>(
      "/shares/unread-count",
    );
    return response.data.count;
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to get unread count:", ne);
    return 0; // Return 0 on error
  }
}
