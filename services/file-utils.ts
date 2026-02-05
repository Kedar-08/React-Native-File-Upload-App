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
 * Validate Indian mobile number.
 * Must be exactly 10 digits and start with 6, 7, 8, or 9.
 */
export function validateIndianMobileNumber(number: string): {
  valid: boolean;
  error: string;
} {
  const cleaned = number.replace(/\D/g, "");

  if (cleaned.length !== 10) {
    return {
      valid: false,
      error: "Mobile number must be exactly 10 digits",
    };
  }

  const firstDigit = parseInt(cleaned[0]);
  if (![6, 7, 8, 9].includes(firstDigit)) {
    return {
      valid: false,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9",
    };
  }

  return { valid: true, error: "" };
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
