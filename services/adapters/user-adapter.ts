/**
 * User Response Adapter
 * Maps backend user responses to internal User model.
 * Handles different backend response shapes and naming conventions.
 */

import type { User } from "../user-service";

export interface BackendUserResponse {
  id?: number;
  username?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  profile?: {
    fullName?: string;
    full_name?: string;
  };
  [key: string]: any;
}

/**
 * Adapt backend user response to internal User model.
 * Flexible mapping handles snake_case and camelCase conventions.
 */
export function adaptUserResponse(backendUser: BackendUserResponse): User {
  return {
    id: backendUser.id ?? 0,
    username: backendUser.username ?? "",
    fullName:
      backendUser.fullName ??
      backendUser.full_name ??
      backendUser.name ??
      backendUser.profile?.fullName ??
      backendUser.profile?.full_name ??
      "",
    email: backendUser.email,
  };
}

/**
 * Adapt array of backend user responses.
 */
export function adaptUserArray(backendUsers: BackendUserResponse[]): User[] {
  return (backendUsers ?? []).map(adaptUserResponse);
}

/**
 * Adapt paginated user response from backend.
 * Expects response with items array and pagination metadata.
 */
export function adaptPaginatedUserResponse(backendResponse: {
  items?: BackendUserResponse[];
  data?: BackendUserResponse[];
  users?: BackendUserResponse[];
  total?: number;
  hasMore?: boolean;
  has_more?: boolean;
  page?: number;
  pageSize?: number;
  page_size?: number;
}): {
  users: User[];
  hasMore: boolean;
} {
  const items =
    backendResponse.items ??
    backendResponse.data ??
    backendResponse.users ??
    [];

  return {
    users: adaptUserArray(items),
    hasMore: backendResponse.hasMore ?? backendResponse.has_more ?? false,
  };
}
