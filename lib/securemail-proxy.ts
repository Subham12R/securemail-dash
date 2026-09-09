const API_URL = process.env.SECUREMAILSCOPE_API_URL?.replace(/\/+$/, "");
const API_KEY = process.env.SECUREMAILSCOPE_API_KEY;

export async function proxySecureMail(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!API_URL || !API_KEY) {
    return Response.json(
      { detail: "SecureMail API environment is not configured" },
      { status: 503 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("authorization", API_KEY);

  try {
    const upstream = await fetch(`${API_URL}/${path.replace(/^\/+/, "")}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { detail: "SecureMail API is unavailable" },
      { status: 502 },
    );
  }
}
