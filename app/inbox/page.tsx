import InboxWorkspace from "@/components/ui/inbox-workspace";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import { getInboxFilterFromQuery } from "@/lib/inbox-data";

type InboxPageProps = {
  searchParams: Promise<{
    itemId?: string | string[];
    filter?: string | string[];
  }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
  const filterValue = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const initialFilter = getInboxFilterFromQuery(filterValue);

  return (
    <main
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
      aria-label="Inbox page"
    >
      <DashboardTopbar currentPage="Inbox" />
      <InboxWorkspace
        key={`${initialFilter}:${itemId ?? ""}`}
        initialItemId={itemId}
        initialFilter={initialFilter}
      />
    </main>
  );
}
