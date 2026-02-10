/**
 * Share service for backend-driven file sharing.
 * Handles sharing files between users.
 */

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
 * Simple request structure - backend identifies current user from Bearer token.
 */
export interface ShareFileRequest {
  fileId: string | number; // UUID string (new) or numeric ID (legacy)
  receiverId: number; // Recipient user ID
}

export interface ShareResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Share a file with another user.
 * API #11: Share file via POST /api/v1/files/share
 */
export async function shareFile(
  request: ShareFileRequest,
): Promise<ShareResult> {
  try {
    console.log(
      "📤 Sharing file:",
      request.fileId,
      "with user:",
      request.receiverId,
    );

    // API #11: Share file — Backend identifies sender from Bearer token
    // Use form-urlencoded body format
    const formData = new URLSearchParams();
    formData.append("file_id", String(request.fileId));
    formData.append("receiver_id", String(request.receiverId));

    const response = await apiClient.post<{ status: string }>(
      "/api/v1/files/share",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    console.log("✅ File shared successfully:", response.data.status);
    return {
      success: true,
      message: response.data.status || "File shared successfully",
    };
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to share file:", ne);

    // Handle validation errors
    if (ne.status === 422) {
      return {
        success: false,
        error: "Invalid file ID or recipient user ID",
      };
    }

    // Handle not found errors
    if (ne.status === 404) {
      return {
        success: false,
        error: "File or recipient not found",
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
 * API #10: Returns flat share records with file_name, file_type, sender_username, shared_time
 * No extra API calls needed - all data is included in the response
 */
export async function getSharedWithMe(): Promise<FileMetadata[]> {
  try {
    console.log("📥 [getSharedWithMe] Fetching shared files from inbox...");
    // API #10: Get shared files — requires Bearer token
    const response = await apiClient.get("/api/v1/files/inbox");
    const shareRecords = response.data || [];
    console.log(
      "✅ [getSharedWithMe] Retrieved",
      shareRecords.length,
      "shared files",
    );
    console.log(
      "📋 [getSharedWithMe] First record:",
      JSON.stringify(shareRecords[0], null, 2),
    );

    // Map flat share records directly to FileMetadata
    const files: FileMetadata[] = shareRecords.map((share: any) => ({
      id: share.file_id,
      fileName: share.file_name || "File",
      fileType: share.file_type || "application/octet-stream",
      fileSize: 0, // Not provided in this API endpoint
      uploadedByUserId: Number(share.sender_id) || 0,
      uploadedByUsername: share.sender_username || "Unknown",
      timestamp: share.shared_time || new Date().toISOString(),
    }));

    console.log(
      "✅ [getSharedWithMe] Processed",
      files.length,
      "files for display",
    );
    return files;
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("❌ [getSharedWithMe] Failed:", ne);

    // If 401 Unauthorized, token may have expired
    if (ne.status === 401) {
      console.warn("🚫 [getSharedWithMe] Unauthorized - token expired");
    }

    throw {
      message: ne.message || "Failed to load shared files",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}
