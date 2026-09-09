import type {
  InboxDataSource,
  InboxDetailResponse,
} from "@/lib/inbox-data";
import type { InboxDetailLookup } from "@/lib/analysis-detail";

export type InboxLookupSource = InboxDataSource;

const MAX_REQUEST_ID_LENGTH = 256;

function notFound(): InboxDetailLookup {
  return {
    state: "not_found",
    detail: null,
    reason: "No matching Inbox item was returned.",
  };
}

function unavailable(reason: string): InboxDetailLookup {
  return { state: "unavailable", detail: null, reason };
}

function confirmsRequest(
  detail: InboxDetailResponse,
  requestId: string,
) {
  return (
    detail.analysis_ref.request_id === requestId ||
    detail.item.analysis.request_id === requestId ||
    detail.item.mail_item_id === requestId ||
    detail.item.session_id === requestId ||
    detail.item.capture_id === requestId
  );
}

export async function findInboxDetailByRequestId(
  source: InboxLookupSource,
  requestId: string,
): Promise<InboxDetailLookup> {
  const safeRequestId = requestId.trim();
  if (!safeRequestId || safeRequestId.length > MAX_REQUEST_ID_LENGTH) {
    return notFound();
  }

  try {
    const page = await source.list({ skip: 0, limit: 200 });
    const item = page.items.find(
      (entry) =>
        entry.analysis.request_id === safeRequestId ||
        entry.mail_item_id === safeRequestId ||
        entry.session_id === safeRequestId ||
        entry.capture_id === safeRequestId,
    );
    if (!item) return notFound();

    const detail = await source.detail(item.mail_item_id);
    if (!detail) {
      return unavailable("The matching Inbox item did not return detail data.");
    }
    if (!confirmsRequest(detail, safeRequestId)) {
      return unavailable("The Inbox detail did not confirm this analysis record.");
    }

    return { state: "available", detail, reason: null };
  } catch {
    return unavailable("Inbox details are unavailable.");
  }
}
