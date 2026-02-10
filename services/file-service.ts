/**
 * File service for backend-driven file operations.
 * Handles file upload, listing, and management via backend APIs.
 */

import { getToken } from "@/storage";
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
 * NOTE: id can be numeric or UUID string (depends on backend).
 * UI displays uploadedByUsername/uploadedByEmail instead of numeric uploadedByUserId.
 */
export interface FileMetadata {
  id: string | number; // UUID string or numeric ID
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedByUserId: number;
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
    // Decode filename in case it comes URL-encoded from the file system
    const decodedFileName = decodeURIComponent(asset.name);
    console.log("📤 Uploading file:", decodedFileName, "UserId:", userId);
    const formData = new FormData();

    // Create file object for upload
    const fileToUpload = {
      uri: asset.uri,
      type: asset.mimeType || "application/octet-stream",
      name: decodedFileName,
    } as any;

    formData.append("file", fileToUpload);

    // API #7: Upload file — Bearer token identifies user, no need for userId
    const response = await apiClient.post<{
      status: string;
      file_id: string;
    }>("/api/v1/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // Extended timeout for file uploads
    });

    console.log("✅ File upload response received:", response.data);

    // Convert backend response to FileMetadata format
    // Note: Backend returns file_id as UUID string; adapter will normalize on next getMyFiles call
    const uploadedFile: FileMetadata = {
      id: 0, // Placeholder; real ID comes from backend via getMyFiles
      fileName: decodedFileName,
      fileType: asset.mimeType || "application/octet-stream",
      fileSize: asset.size || 0,
      uploadedByUserId: 0, // Populated on next getMyFiles
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      file: uploadedFile,
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
    const decodedFileName = decodeURIComponent(asset.name);
    const result = await uploadFile(asset, userId);
    if (result.success && result.file) {
      saved.push(result.file);
    } else {
      failed.push({
        name: decodedFileName,
        error: result.error || "Unknown error",
      });
    }
  }

  // If we uploaded any files, refresh the user's file list from backend
  if (saved.length > 0) {
    try {
      const latestFiles = await getMyFiles();
      return { saved: latestFiles, failed };
    } catch (err) {
      // If refresh fails, return the local saved placeholders so UX continues
      return { saved, failed };
    }
  }

  return { saved, failed };
}

/**
 * Get all files uploaded by the current user.
 */
export async function getMyFiles(): Promise<FileMetadata[]> {
  try {
    console.log("📥 Fetching uploaded files...");
    // API #6: Get uploaded files — requires Bearer token
    const response = await apiClient.get("/api/v1/files/uploaded");
    console.log("✅ Files retrieved:", response.data?.length || 0, "files");
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
 * Get file details by UUID file_id.
 * API #8: Fetch full metadata for a single file via backend.
 */
export async function getFileDetailsById(
  fileId: string,
): Promise<FileMetadata | null> {
  try {
    console.log("📄 Fetching file details for:", fileId);
    // API #8: Get file details — requires Bearer token
    const response = await apiClient.get(`/api/v1/files/details/${fileId}`);
    // Use adapter to map backend response (handles snake_case to camelCase conversion)
    return adaptFileResponse(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn("File not found:", fileId);
      return null;
    }
    const ne = normalizeError(error);
    console.error("Failed to fetch file details:", ne);
    throw {
      message: ne.message || "Failed to load file details",
      code: ne.code || "FETCH_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Delete a file.
 */
export async function deleteFile(fileId: string | number): Promise<void> {
  try {
    // API: Delete file — endpoint path uses fileId
    // TODO: Delete endpoint not yet implemented in backend
    // Expected: DELETE /api/v1/files/{fileId}
    await apiClient.delete(`/api/v1/files/${fileId}`);
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
 * API #9: Downloads file as binary stream using UUID file_id.
 */
export async function downloadAndOpenFile(file: FileMetadata): Promise<void> {
  try {
    if (!file.id) {
      throw new Error("Invalid file ID");
    }

    console.log("📥 Downloading file:", file.id, "(", file.fileName, ")");

    // Construct download URL using API #9 endpoint
    const downloadUrl = `${apiClient.defaults.baseURL}/api/v1/files/download/${file.id}`;
    console.log("📍 Download URL:", downloadUrl);

    // Download file to cache directory
    const localUri = `${cacheDirectory}${file.fileName}`;
    console.log("💾 Local cache path:", localUri);

    // Get the current authorization token directly from storage
    // (downloadAsync makes native HTTP requests that bypass axios interceptors)
    const token = await getToken();
    if (!token) {
      throw new Error("No auth token available - please log in again");
    }

    console.log("🔐 Token available, initiating download...");
    const downloadResult = await downloadAsync(downloadUrl, localUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📤 Download result status:", downloadResult.status);
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    console.log("✅ File downloaded successfully to:", localUri);
    // Open the downloaded file
    await openLocalFile(localUri, file.fileType, file.fileName);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("❌ Failed to download and open file:", ne);
    throw {
      message: ne.message || "Failed to open file",
      code: ne.code || "OPEN_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Open your own uploaded file directly (dashboard).
 * For your own files, streams/opens the file directly without requiring separate download.
 */
export async function openMyFile(file: FileMetadata): Promise<void> {
  try {
    if (!file.id) {
      throw new Error("Invalid file ID");
    }

    console.log(
      "📂 Opening your uploaded file:",
      file.id,
      "(",
      file.fileName,
      ")",
    );

    // Construct file stream URL
    const fileUrl = `${apiClient.defaults.baseURL}/api/v1/files/download/${file.id}`;

    // Get the current authorization token
    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    // Download to cache and open
    const localUri = `${cacheDirectory}${file.fileName}`;
    console.log("📥 Retrieving file to local cache...");

    const downloadResult = await downloadAsync(fileUrl, localUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (downloadResult.status !== 200) {
      throw new Error(
        `Failed to retrieve file (status ${downloadResult.status})`,
      );
    }

    console.log("✅ File ready, opening...");
    await openLocalFile(localUri, file.fileType, file.fileName);
  } catch (error: any) {
    const ne = normalizeError(error);
    console.error("❌ Failed to open your file:", ne);
    throw {
      message: ne.message || "Failed to open file",
      code: ne.code || "OPEN_ERROR",
      original: ne.original ?? ne,
    };
  }
}

/**
 * Get proper MIME type for a file.
 * Converts file extensions or partial types to full MIME types.
 */
function getMimeType(fileType: string | undefined, fileName?: string): string {
  if (!fileType && !fileName) {
    return "application/octet-stream"; // Fallback
  }

  // Normalize input to lowercase
  const type = (fileType || "").toLowerCase().trim();

  // If already a full MIME type (contains /), return it
  if (type.includes("/")) {
    return type;
  }

  // If it's just an extension, add the filename extension to match
  let extension = type;
  if (!extension && fileName) {
    const parts = fileName.split(".");
    extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  // Map common extensions to MIME types
  const mimeMap: Record<string, string> = {
    // Text
    txt: "text/plain",
    text: "text/plain",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",

    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",

    // Video
    mp4: "video/mp4",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
  };

  return mimeMap[extension] || type || "application/octet-stream";
}

/**
 * Open a local file with the default app (Android).
 */
async function openLocalFile(
  localUri: string,
  mimeType: string | undefined,
  fileName?: string,
): Promise<void> {
  try {
    // Get proper MIME type
    const properMimeType = getMimeType(mimeType, fileName);
    console.log("📋 MIME type:", properMimeType);

    // Convert file:// URI to content:// URI (required for Android 7+)
    const contentUri = await getContentUriAsync(localUri);

    console.log("🔗 Opening content URI:", contentUri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: properMimeType,
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
