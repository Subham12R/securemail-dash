import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const API_URL = process.env.SECUREMAILSCOPE_API_URL?.replace(/\/+$/, "");

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (API_URL && token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch {
      // Best-effort remote revocation
    }
  }

  cookieStore.delete(AUTH_COOKIE_NAME);

  return NextResponse.json({ logged_out: true });
}
