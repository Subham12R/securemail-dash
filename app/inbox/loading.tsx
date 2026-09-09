import DashboardTopbar from "@/components/ui/dashboard-topbar";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <main
      aria-label="Loading Inbox"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
    >
      <DashboardTopbar currentPage="Inbox" />
      <div className="min-h-0 flex-1 p-4 sm:p-6">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border-2 border-neutral-200 bg-white">
          <div className="shrink-0 border-b border-zinc-200 p-5">
            <LoadingSkeleton className="h-5 w-20" />
            <LoadingSkeleton className="mt-2 h-4 w-44" />
            <LoadingSkeleton className="mt-5 h-9 w-72" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="divide-y divide-zinc-200">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="space-y-3 px-5 py-5">
                  <LoadingSkeleton className="h-3 w-2/5" />
                  <LoadingSkeleton className="h-3 w-4/5" />
                  <LoadingSkeleton className="h-3 w-3/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
