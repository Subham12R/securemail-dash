import { revalidateTag } from "next/cache";
import { INBOX_CACHE_TAG } from "@/lib/inbox-external";
import { SECUREMAIL_CACHE_TAG } from "@/lib/securemail-api";

export async function POST() {
  try {
    revalidateTag(SECUREMAIL_CACHE_TAG, { expire: 0 });
    revalidateTag(INBOX_CACHE_TAG, { expire: 0 });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { detail: "Live data cache could not be refreshed" },
      { status: 503 },
    );
  }
}
