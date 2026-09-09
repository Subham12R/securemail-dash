import { getServerInboxDataSource } from "@/lib/inbox-external";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  if (!itemId) {
    return Response.json({ detail: "Inbox item not found" }, { status: 404 });
  }

  try {
    const detail = await getServerInboxDataSource().detail(itemId);
    if (!detail) {
      return Response.json({ detail: "Inbox item not found" }, { status: 404 });
    }

    return Response.json(detail, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      { detail: "Inbox data is unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
