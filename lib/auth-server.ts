import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  getAuthApiCandidates,
  type UserProfile,
} from "@/lib/auth";

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  for (const baseUrl of getAuthApiCandidates()) {
    try {
      const response = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const profile = await response.json();
      if (
        typeof profile?.id === "number" &&
        typeof profile?.email === "string" &&
        typeof profile?.display_name === "string"
      ) {
        return profile;
      }
    } catch {
      // Try the next configured auth backend.
    }
  }

  return null;
}
