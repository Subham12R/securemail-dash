import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, formatAuthError, getAuthApiCandidates } from "@/lib/auth";

export async function POST(request: Request) {
  const candidates = getAuthApiCandidates();
  if (candidates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Backend API URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const email = body?.email;
    const password = body?.password;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { ok: false, error: "Work email and password are required." },
        { status: 400 },
      );
    }

    let lastStatus = 502;
    let lastErrorMessage = "Unable to connect to authentication server.";

    for (const baseUrl of candidates) {
      try {
        const upstream = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: email.trim(), password }),
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });

        const data = await upstream.json().catch(() => null);

        // If upstream failed due to enterprise domain rejection on remote VPS, fallback to local backend candidate
        if (
          !upstream.ok &&
          candidates.length > 1 &&
          (data?.detail === "enterprise_email_required" || upstream.status === 404 || upstream.status >= 500)
        ) {
          lastStatus = upstream.status;
          lastErrorMessage = formatAuthError(data?.detail || data?.message);
          continue;
        }

        if (!upstream.ok) {
          const message = formatAuthError(data?.detail || data?.message);
          return NextResponse.json(
            { ok: false, error: message },
            { status: upstream.status },
          );
        }

        const accessToken = data?.access_token;
        const profile = data?.profile;

        if (!accessToken) {
          return NextResponse.json(
            { ok: false, error: "Authentication response did not return an access token." },
            { status: 502 },
          );
        }

        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });

        return NextResponse.json({ ok: true, profile });
      } catch (err) {
        lastErrorMessage = err instanceof Error ? err.message : "Connection failed";
        continue;
      }
    }

    return NextResponse.json(
      { ok: false, error: lastErrorMessage },
      { status: lastStatus },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to connect to authentication server." },
      { status: 502 },
    );
  }
}
