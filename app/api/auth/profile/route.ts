import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, formatAuthError } from "@/lib/auth";

const API_URL = process.env.SECUREMAILSCOPE_API_URL?.replace(/\/+$/, "");

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API URL not configured" },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(`${API_URL}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: formatAuthError(data?.detail) },
        { status: upstream.status },
      );
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication server unreachable" },
      { status: 502 },
    );
  }
}
