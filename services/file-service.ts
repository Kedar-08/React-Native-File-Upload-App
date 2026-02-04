import { getDatabase } from "@/storage";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

export interface FileMetadata {
  id: number;
  fileName: string;
  fileType: string;
  uploadedByEmail: string;
  uploadedByUserId: number;
  timestamp: string;
  localFilePath: string;
}

// Pick one or more files using document picker
export async function pickFile(): Promise<DocumentPicker.DocumentPickerResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*", // Allow all file types
    copyToCacheDirectory: true,
    multiple: true, // Enable multiple file selection
  });

  return result;
}

// Save multiple files to local storage and database
export async function saveMultipleFiles(
  pickerResult: DocumentPicker.DocumentPickerResult,
  userId: number,
  userEmail: string,
): Promise<{ saved: FileMetadata[]; failed: string[] }> {
  if (!pickerResult.assets) {
    return { saved: [], failed: [] };
  }

  const saved: FileMetadata[] = [];
  const failed: string[] = [];

  // Create app's document directory if it doesn't exist
  const uploadsDir = new Directory(Paths.document, "uploads");
  if (!uploadsDir.exists) {
    uploadsDir.create();
  }

  const db = await getDatabase();

  // Process each file
  for (const asset of pickerResult.assets) {
    try {
      const { uri, name, mimeType } = asset;

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${name}`;
      const destinationFile = new File(uploadsDir, uniqueFileName);
      const localFilePath = destinationFile.uri;

      // Copy file to app's document directory
      const sourceFile = new File(uri);
      sourceFile.copy(destinationFile);

      // Determine file type
      const fileType = mimeType || getFileTypeFromName(name);

      // Save metadata to database
      const result = await db.runAsync(
        `INSERT INTO files (fileName, fileType, uploadedByEmail, uploadedByUserId, localFilePath)
         VALUES (?, ?, ?, ?, ?)`,
        [name, fileType, userEmail, userId, localFilePath],
      );

      // Get the saved file metadata
      const savedFile = await db.getFirstAsync<FileMetadata>(
        "SELECT * FROM files WHERE id = ?",
        [result.lastInsertRowId],
      );

      if (savedFile) {
        saved.push(savedFile);
      } else {
        failed.push(name);
      }
    } catch (error) {
      const fileName = asset.name || "unknown";
      console.error(`Failed to save file ${fileName}:`, error);
      failed.push(fileName);
    }
  }

  return { saved, failed };
}
export async function saveFile(
  pickerResult: DocumentPicker.DocumentPickerSuccessResult,
  userId: number,
  userEmail: string,
): Promise<FileMetadata> {
  const { uri, name, mimeType } = pickerResult.assets[0];

  // Create app's document directory if it doesn't exist
  const uploadsDir = new Directory(Paths.document, "uploads");
  if (!uploadsDir.exists) {
    uploadsDir.create();
  }

  // Generate unique filename
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${name}`;
  const destinationFile = new File(uploadsDir, uniqueFileName);
  const localFilePath = destinationFile.uri;

  // Copy file to app's document directory
  const sourceFile = new File(uri);
  sourceFile.copy(destinationFile);

  // Determine file type
  const fileType = mimeType || getFileTypeFromName(name);

  // Save metadata to database
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO files (fileName, fileType, uploadedByEmail, uploadedByUserId, localFilePath)
     VALUES (?, ?, ?, ?, ?)`,
    [name, fileType, userEmail, userId, localFilePath],
  );

  // Get the saved file metadata
  const savedFile = await db.getFirstAsync<FileMetadata>(
    "SELECT * FROM files WHERE id = ?",
    [result.lastInsertRowId],
  );

  if (!savedFile) {
    throw new Error("Failed to save file metadata");
  }

  return savedFile;
}

// Get all uploaded files
export async function getAllFiles(): Promise<FileMetadata[]> {
  const db = await getDatabase();

  const files = await db.getAllAsync<FileMetadata>(
    "SELECT * FROM files ORDER BY timestamp DESC",
  );

  return files;
}

// Get files uploaded by a specific user
export async function getFilesByUser(userId: number): Promise<FileMetadata[]> {
  const db = await getDatabase();

  const files = await db.getAllAsync<FileMetadata>(
    "SELECT * FROM files WHERE uploadedByUserId = ? ORDER BY timestamp DESC",
    [userId],
  );

  return files;
}

// Get a single file by id
export async function getFileById(
  fileId: number,
): Promise<FileMetadata | null> {
  const db = await getDatabase();

  const file = await db.getFirstAsync<FileMetadata>(
    "SELECT * FROM files WHERE id = ?",
    [fileId],
  );

  return file || null;
}

// Open a file with the default app (Android only)
export async function openFile(file: FileMetadata): Promise<void> {
  // Check if file exists
  const fileRef = new File(file.localFilePath);

  if (!fileRef.exists) {
    throw new Error("File not found");
  }

  // Convert file:// URI to content:// URI (required for Android 7+)
  const contentUri = await getContentUriAsync(file.localFilePath);

  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: file.fileType,
  });
}

// Delete a file
export async function deleteFile(fileId: number): Promise<void> {
  const db = await getDatabase();

  // Get file info first
  const file = await getFileById(fileId);

  if (!file) {
    throw new Error("File not found");
  }

  // Delete from file system
  const fileRef = new File(file.localFilePath);
  if (fileRef.exists) {
    fileRef.delete();
  }

  // Delete from database
  await db.runAsync("DELETE FROM files WHERE id = ?", [fileId]);
}

// Helper function to determine file type from name
function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    // Video
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    // Code
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Format timestamp for display
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
