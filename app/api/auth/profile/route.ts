import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, formatAuthError, getAuthApiCandidates } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const candidates = getAuthApiCandidates();
  if (candidates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "API URL not configured" },
      { status: 503 },
    );
  }

  let lastStatus = 502;
  let lastErrorMessage = "Authentication server unreachable";

  for (const baseUrl of candidates) {
    try {
      const upstream = await fetch(`${baseUrl}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      const data = await upstream.json().catch(() => null);

      if (!upstream.ok) {
        if ((upstream.status === 404 || upstream.status === 401 || upstream.status >= 500) && candidates.length > 1) {
          lastStatus = upstream.status;
          lastErrorMessage = formatAuthError(data?.detail);
          continue;
        }
        return NextResponse.json(
          { ok: false, error: formatAuthError(data?.detail) },
          { status: upstream.status },
        );
      }

      return NextResponse.json({ ok: true, profile: data });
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { ok: false, error: lastErrorMessage },
    { status: lastStatus },
  );
}
