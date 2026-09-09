import { proxySecureMail } from "@/lib/securemail-proxy";

export async function POST(request: Request) {
  const body = await request.arrayBuffer();
  return proxySecureMail("analyses", {
    method: "POST",
    body,
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
    },
  });
}
