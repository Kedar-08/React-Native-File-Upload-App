import { Ionicons } from "@expo/vector-icons";

/**
 * Get appropriate icon name based on file MIME type.
 * Used by both file-item and file-viewer components.
 */
export function getFileIcon(
  fileType: string,
  variant: "outline" | "filled" = "filled",
): keyof typeof Ionicons.glyphMap {
  const suffix = variant === "outline" ? "-outline" : "";

  if (fileType.startsWith("image/"))
    return `image${suffix}` as keyof typeof Ionicons.glyphMap;
  if (fileType.startsWith("video/"))
    return `videocam${suffix}` as keyof typeof Ionicons.glyphMap;
  if (fileType.startsWith("audio/"))
    return `musical-notes${suffix}` as keyof typeof Ionicons.glyphMap;
  if (fileType.includes("pdf"))
    return `document-text${suffix}` as keyof typeof Ionicons.glyphMap;
  if (fileType.includes("word") || fileType.includes("document"))
    return `document${suffix}` as keyof typeof Ionicons.glyphMap;
  if (fileType.includes("sheet") || fileType.includes("excel"))
    return `grid${suffix}` as keyof typeof Ionicons.glyphMap;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return `easel${suffix}` as keyof typeof Ionicons.glyphMap;
  if (
    fileType.includes("zip") ||
    fileType.includes("rar") ||
    fileType.includes("7z")
  )
    return `archive${suffix}` as keyof typeof Ionicons.glyphMap;
  return `document${suffix}` as keyof typeof Ionicons.glyphMap;
}

/**
 * Validate email address format.
 */
export function validateEmail(email: string): {
  valid: boolean;
  error: string;
} {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return {
      valid: false,
      error: "Email is required",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: "Please enter a valid email address",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Map MIME type or file name to a friendly label for display.
 */
export function getFriendlyFileLabel(
  fileType: string,
  fileName?: string,
): string {
  const type = (fileType || "").toLowerCase();

  const mimeMap: Record<string, string> = {
    "text/plain": "TXT",
    "application/pdf": "PDF",
    "application/msword": "Word",
    "application/vnd.ms-excel": "Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "Excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word",
  };

  if (type.startsWith("image/")) return "Image";
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";

  if (mimeMap[type]) return mimeMap[type];

  // If type looks like 'application/xxx' but not matched above, try to derive
  if (type.includes("/")) {
    const parts = type.split("/");
    const candidate = parts[1] || parts[0];
    return candidate.toUpperCase();
  }

  // Fallback: try to derive from extension in fileName
  if (fileName) {
    const ext = fileName.split(".").pop()?.toUpperCase();
    if (ext) return ext;
  }

  return "File";
}
