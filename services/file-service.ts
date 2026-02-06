/**
 * File service for backend-driven file operations.
 * Handles file upload, listing, and management via backend APIs.
 */

import * as DocumentPicker from "expo-document-picker";
import {
  cacheDirectory,
  downloadAsync,
  getContentUriAsync,
} from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { adaptFileArray, adaptFileResponse } from "./adapters/file-adapter";
import apiClient from "./api-client";
import { normalizeError } from "./normalize-error";

/**
 * File metadata.
 * NOTE: ID fields (id, uploadedByUserId) are INTERNAL ONLY.
 * UI displays uploadedByUsername/uploadedByEmail instead of numeric IDs.
 */
export interface FileMetadata {
  id: number; // @internal
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedByUserId: number; // @internal - use uploadedByUsername for display
  uploadedByUsername?: string;
  uploadedByEmail?: string;
  timestamp: string;
  downloadUrl?: string;
}

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

export interface MultiUploadResult {
  saved: FileMetadata[];
  failed: { name: string; error: string }[];
}

/**
 * Pick one or more files using document picker.
 */
export async function pickFile(): Promise<DocumentPicker.DocumentPickerResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: true,
    });
    return result;
  } catch (err) {
    throw normalizeError({
      message: "Failed to open document picker",
      code: "PICKER_ERROR",
      original: err,
    });
  }
}

/**
 * Upload a single file to the backend.
 */
export async function uploadFile(
  asset: DocumentPicker.DocumentPickerAsset,
  userId: number,
): Promise<UploadResult> {
  try {
    const formData = new FormData();

    // Create file object for upload
    const fileToUpload = {
      uri: asset.uri,
      type: asset.mimeType || "application/octet-stream",
      name: asset.name,
    } as any;

    formData.append("file", fileToUpload);
    formData.append("userId", userId.toString());

    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.post<FileMetadata>(
      "/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // Extended timeout for file uploads
      },
    );

    return {
      success: true,
      file: response.data,
    };
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("File upload failed:", ne);
    return {
      success: false,
      error: ne.message || "Upload failed",
    };
  }
}

/**
 * Upload multiple files to the backend.
 */
export async function uploadMultipleFiles(
  pickerResult: DocumentPicker.DocumentPickerResult,
  userId: number,
): Promise<MultiUploadResult> {
  if (!pickerResult.assets || pickerResult.assets.length === 0) {
    return { saved: [], failed: [] };
  }

  const saved: FileMetadata[] = [];
  const failed: { name: string; error: string }[] = [];

  // Upload files sequentially to avoid overwhelming the server
  for (const asset of pickerResult.assets) {
    const result = await uploadFile(asset, userId);
    if (result.success && result.file) {
      saved.push(result.file);
    } else {
      failed.push({
        name: asset.name,
        error: result.error || "Unknown error",
      });
    }
  }

  return { saved, failed };
}

/**
 * Get all files uploaded by the current user.
 */
export async function getMyFiles(): Promise<FileMetadata[]> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get("/files/my-files");
    // Use adapter to map backend file responses
    return adaptFileArray(response.data);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to fetch files:", ne);
    throw {
      message: ne.message || "Failed to load files",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get a specific file by ID.
 */
export async function getFileById(
  fileId: number,
): Promise<FileMetadata | null> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get(`/files/${fileId}`);
    // Use adapter to map backend response
    return adaptFileResponse(response.data);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    const ne = normalizeError(error);
    console.error("Failed to fetch file:", ne);
    throw {
      message: ne.message || "Failed to load file",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Check if a file with the same name exists for the user.
 */
export async function checkDuplicateFile(
  fileName: string,
  userId: number,
): Promise<FileMetadata | null> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    const response = await apiClient.get<FileMetadata | null>(
      "/files/check-duplicate",
      {
        params: { fileName, userId },
      },
    );
    return response.data;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    const ne = normalizeError(error);
    console.error("Failed to check duplicate:", ne);
    return null; // Assume no duplicate on error
  }
}

/**
 * Delete a file.
 */
export async function deleteFile(fileId: number): Promise<void> {
  try {
    // TODO: Replace with actual endpoint when backend is ready
    await apiClient.delete(`/files/${fileId}`);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to delete file:", ne);
    throw {
      message: ne.message || "Failed to delete file",
      code: ne.code || "DELETE_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Download a file from backend and open it.
 */
export async function downloadAndOpenFile(file: FileMetadata): Promise<void> {
  try {
    if (!file.downloadUrl) {
      // Construct download URL from file ID
      const downloadUrl = `${apiClient.defaults.baseURL}/files/${file.id}/download`;

      // Download file to cache directory
      const localUri = `${cacheDirectory}${file.fileName}`;

      const downloadResult = await downloadAsync(downloadUrl, localUri, {
        headers: {
          Authorization: apiClient.defaults.headers.common[
            "Authorization"
          ] as string,
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error("Download failed");
      }

      // Open the downloaded file
      await openLocalFile(localUri, file.fileType);
    }
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("Failed to download and open file:", ne);
    throw {
      message: ne.message || "Failed to open file",
      code: ne.code || "OPEN_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Open a local file with the default app (Android).
 */
async function openLocalFile(
  localUri: string,
  mimeType: string,
): Promise<void> {
  try {
    // Convert file:// URI to content:// URI (required for Android 7+)
    const contentUri = await getContentUriAsync(localUri);

    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: mimeType,
    });
  } catch (err) {
    throw normalizeError({
      message: "Failed to open file",
      code: "OPEN_ERROR",
      original: err,
    });
  }
}

/**
 * Format file size to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Format timestamp to human-readable string.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  // Show a full, localized date and time so users see the exact timestamp
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
