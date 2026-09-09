export const AUTH_COOKIE_NAME = "securemail_access_token";

export interface UserProfile {
  id: number;
  email: string;
  display_name: string;
}

export interface AuthSuccessResponse {
  ok: true;
  access_token: string;
  profile: UserProfile;
}

export interface AuthErrorResponse {
  ok: false;
  error: string;
}

export function formatAuthError(detail?: unknown): string {
  if (typeof detail !== "string") {
    return "Authentication failed. Please try again.";
  }

  switch (detail) {
    case "enterprise_email_required":
      return "An enterprise email address is required (e.g. @company.com).";
    case "invalid_credentials":
      return "Invalid email or password. Please check your credentials.";
    case "authentication_required":
      return "Authentication session expired. Please sign in again.";
    case "invalid_token":
      return "Your session is invalid or expired. Please sign in again.";
    default:
      return detail;
  }
}
