/**
 * JWT utilities for token decoding and expiry checking.
 * Used to validate token state without external dependencies.
 */

export interface JwtPayload {
  exp?: number; // Unix timestamp (seconds)
  iat?: number; // Issued at (seconds)
  sub?: string; // Subject (usually user ID)
  [key: string]: any;
}

/**
 * Decode JWT payload (base64url decode, no verification).
 * WARNING: Does NOT verify signature - use only to inspect client-side data.
 * Works in React Native (uses native atob) and Node.js.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("❌ Invalid JWT format (expected 3 parts)");
      return null;
    }

    // Decode payload (second part) - convert base64url to base64
    let payload = parts[1];
    // Replace base64url characters (- and _) with base64 characters (+ and /)
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += "=".repeat(padding);
    }

    // Use atob() which works in both React Native and browsers
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("❌ Failed to decode JWT:", err);
    return null;
  }
}

/**
 * Check if JWT is expired.
 * Returns true if token is expired OR missing expiry claim.
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) {
    console.warn("⚠️ Token missing exp claim");
    return true; // Assume expired if no expiry
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expiresAt = payload.exp * 1000;
  const isExpired = Date.now() > expiresAt;

  if (isExpired) {
    const expiredSince = Math.floor((Date.now() - expiresAt) / 1000);
    console.warn(`⏰ Token expired ${expiredSince}s ago`);
  }

  return isExpired;
}

/**
 * Get seconds until token expires.
 * Returns negative number if already expired.
 */
export function getTokenExpiryIn(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload?.exp) return null;

  const expiresAt = payload.exp * 1000;
  return Math.floor((expiresAt - Date.now()) / 1000);
}

/**
 * Check if token is expiring soon (within threshold).
 * Default threshold: 5 minutes (300s).
 */
export function isTokenExpiringsoon(
  token: string,
  thresholdSec: number = 300,
): boolean {
  const secsRemaining = getTokenExpiryIn(token);
  if (secsRemaining === null) return true;

  const isExpiringSoon = secsRemaining < thresholdSec;
  if (isExpiringSoon) {
    const mins = Math.floor(secsRemaining / 60);
    console.warn(`⏰ Token expiring soon (in ${mins} min)`);
  }

  return isExpiringSoon;
}

/**
 * Get human-readable expiry date from token.
 */
export function getTokenExpiryDate(token: string): Date | null {
  const payload = decodeJwt(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}
