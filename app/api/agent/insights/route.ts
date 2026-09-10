import { isAgentInsightRequest } from "@/lib/agent-insights";
import { proxySecureMail } from "@/lib/securemail-proxy";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isAgentInsightRequest(body)) {
    return Response.json({ detail: "Invalid agent insight request" }, { status: 400 });
  }

  return proxySecureMail("agent/insights", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
