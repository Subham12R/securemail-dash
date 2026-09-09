import { getServerInboxDataSource } from "@/lib/inbox-external";

function integerQuery(value: string | null, fallback: number) {
  const parsed = value === null ? Number.NaN : Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = Math.max(0, integerQuery(searchParams.get("skip"), 0));
  const limit = Math.min(200, Math.max(1, integerQuery(searchParams.get("limit"), 12)));

  try {
    const response = await getServerInboxDataSource().list({ skip, limit });
    return Response.json(response, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      { detail: "Inbox data is unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
