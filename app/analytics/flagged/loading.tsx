import DashboardTopbar from "@/components/ui/dashboard-topbar";

export default function Loading() {
  return (
    <main
      aria-label="Loading Flagged Emails"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#061426]"
    >
      <DashboardTopbar currentPage="Flagged Emails" tone="dark" />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-700/60" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-800" />
        <div className="mt-8 h-80 animate-pulse rounded-lg border border-[#173858] bg-[#0b213e]" />
      </div>
    </main>
  );
}
