import { ViewTransition } from "react";
import InboxWorkspace from "@/components/ui/inbox-workspace";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import FooterWatermark from "@/components/ui/footer";
import {
  getInboxFilterFromQuery,
  getInboxTabFromQuery,
} from "@/lib/inbox-data";

type InboxPageProps = {
  searchParams: Promise<{
    itemId?: string | string[];
    requestId?: string | string[];
    filter?: string | string[];
    tab?: string | string[];
  }>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const itemId = firstQueryValue(params.itemId);
  const requestId = firstQueryValue(params.requestId);
  const initialFilter = getInboxFilterFromQuery(firstQueryValue(params.filter));
  const initialTab = getInboxTabFromQuery(firstQueryValue(params.tab));

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white"
        aria-label="Inbox page"
      >
        <DashboardTopbar currentPage="Inbox" showRefresh />
        <div className="min-h-0 flex-1">
          <InboxWorkspace
            key={`${initialFilter}:${itemId ?? ""}:${requestId ?? ""}:${initialTab}`}
            initialItemId={itemId}
            initialRequestId={requestId}
            initialFilter={initialFilter}
            initialTab={initialTab}
          />
        </div>
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}
