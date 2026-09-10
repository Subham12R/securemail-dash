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
    case "user_already_exists":
      return "An enterprise account with this email already exists.";
    case "authentication_required":
      return "Authentication session expired. Please sign in again.";
    case "invalid_token":
      return "Your session is invalid or expired. Please sign in again.";
    default:
      return detail;
  }
}

export function getAuthApiCandidates(): string[] {
  const configured = process.env.SECUREMAILSCOPE_API_URL?.replace(/\/+$/, "");
  const local = "http://127.0.0.1:8000/api/v1";
  const candidates: string[] = [];
  if (configured) {
    candidates.push(configured);
  }
  if (!candidates.includes(local)) {
    candidates.push(local);
  }
  return candidates;
}
