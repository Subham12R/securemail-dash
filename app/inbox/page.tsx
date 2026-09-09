import InboxWorkspace from "@/components/ui/inbox-workspace";
import DashboardTopbar from "@/components/ui/dashboard-topbar";

type InboxPageProps = {
  searchParams: Promise<{ itemId?: string | string[] }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  return (
    <main
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#061426]"
      aria-label="Inbox page"
    >
      <DashboardTopbar currentPage="Inbox" tone="dark" />
      <InboxWorkspace initialItemId={itemId} />
    </main>
  );
}
