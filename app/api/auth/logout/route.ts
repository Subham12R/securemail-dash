import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthApiCandidates } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const candidates = getAuthApiCandidates();
    for (const baseUrl of candidates) {
      try {
        await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        // Best-effort remote revocation
      }
    }
  }

  cookieStore.delete(AUTH_COOKIE_NAME);

  return NextResponse.json({ logged_out: true });
}
