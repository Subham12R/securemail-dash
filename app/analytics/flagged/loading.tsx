import DashboardTopbar from "@/components/ui/dashboard-topbar";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <main
      aria-label="Loading Flagged Emails"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
    >
      <DashboardTopbar currentPage="Flagged Emails" />
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="h-full rounded-lg border-2 border-neutral-200 bg-white">
          <div className="border-b border-zinc-200 p-5">
            <LoadingSkeleton className="h-5 w-40" />
            <LoadingSkeleton className="mt-2 h-4 w-72" />
          </div>
          <div className="p-5">
            <LoadingSkeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}
