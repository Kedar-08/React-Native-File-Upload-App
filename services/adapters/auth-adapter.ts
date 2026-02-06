/**
 * Auth Response Adapter
 * Maps backend auth responses to internal StoredUserProfile model.
 * Handles different backend response shapes gracefully.
 */

import type { StoredUserProfile } from "../auth-service";

export interface BackendAuthResponse {
  id?: number;
  userId?: number;
  email?: string;
  username?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  [key: string]: any;
}

export interface BackendAuthTokenResponse {
  token?: string;
  access_token?: string;
  user?: BackendAuthResponse;
  data?: {
    user?: BackendAuthResponse;
    token?: string;
    access_token?: string;
  };
  [key: string]: any;
}

/**
 * Adapt backend user response to internal StoredUserProfile model.
 * Flexible mapping to handle different backend key naming conventions.
 */
export function adaptUserResponse(
  backendUser: BackendAuthResponse,
): StoredUserProfile {
  return {
    id: backendUser.id ?? backendUser.userId ?? 0,
    email: backendUser.email ?? "",
    username: backendUser.username ?? "",
    fullName:
      backendUser.fullName ?? backendUser.full_name ?? backendUser.name ?? "",
  };
}

/**
 * Extract token from backend auth response.
 * Handles various backend response structures.
 */
export function extractToken(
  backendResponse: BackendAuthTokenResponse,
): string {
  return (
    backendResponse.token ??
    backendResponse.access_token ??
    backendResponse.data?.token ??
    backendResponse.data?.access_token ??
    ""
  );
}

/**
 * Extract user from nested backend auth response.
 * Handles various response structures (flat, nested, wrapped).
 */
export function extractUser(
  backendResponse: BackendAuthTokenResponse,
): BackendAuthResponse | null {
  return (
    backendResponse.user ??
    backendResponse.data?.user ??
    (backendResponse as any)
  );
}

/**
 * Adapt full auth token response (login/signup).
 * Returns { user, token } in app's internal format.
 */
export function adaptAuthTokenResponse(
  backendResponse: BackendAuthTokenResponse,
): { user: StoredUserProfile; token: string } {
  const userRaw = extractUser(backendResponse);
  const token = extractToken(backendResponse);

  if (!userRaw) {
    throw new Error("No user data in auth response");
  }

  return {
    user: adaptUserResponse(userRaw),
    token,
  };
}
