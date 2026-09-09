import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, formatAuthError } from "@/lib/auth";

const API_URL = process.env.SECUREMAILSCOPE_API_URL?.replace(/\/+$/, "");

export async function POST(request: Request) {
  if (!API_URL) {
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

    const upstream = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);

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
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to connect to authentication server." },
      { status: 502 },
    );
  }
}
