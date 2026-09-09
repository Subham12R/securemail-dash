import DashboardTopbar from "@/components/ui/dashboard-topbar";
import FlaggedAnalysisView from "@/components/ui/flagged-analysis-view";
import { getServerInboxDataSource } from "@/lib/inbox-external";
import type { InboxListItem, InboxListResponse, InboxSource } from "@/lib/inbox-data";

const emptyCounts: InboxListResponse["counts"] = {
  all: 0,
  flagged: 0,
  healthy: 0,
};

type FlaggedPageData = {
  items: InboxListItem[];
  counts: InboxListResponse["counts"];
  source?: InboxSource;
  error: string | null;
};

async function getFlaggedPageData(): Promise<FlaggedPageData> {
  try {
    const response = await getServerInboxDataSource().list({ skip: 0, limit: 200 });
    return {
      items: response.items.filter((item) => item.triage_state === "flagged"),
      counts: response.counts,
      source: response.source,
      error: null,
    };
  } catch {
    return {
      items: [],
      counts: emptyCounts,
      error: "The Inbox source returned an invalid response.",
    };
  }
}

export default async function FlaggedEmailsPage() {
  const data = await getFlaggedPageData();

  return (
    <main
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
      aria-label="Flagged Emails page"
    >
      <DashboardTopbar currentPage="Flagged Emails" />
      <FlaggedAnalysisView items={data.items} counts={data.counts} source={data.source} error={data.error} />
    </main>
  );
}
