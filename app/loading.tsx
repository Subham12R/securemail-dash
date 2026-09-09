import {
  BarChartSkeleton,
  LoadingSkeleton,
  MetricCardSkeleton,
  PieChartSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="Loading overview"
      aria-busy="true"
    >
      <div className="flex min-h-16 items-center justify-between border-b border-zinc-200 px-6 py-3 pl-20">
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
        <LoadingSkeleton className="h-9 w-36" />
      </div>

      <div className="space-y-4 p-6" role="status" aria-label="Loading dashboard data">
        <LoadingSkeleton className="h-6 w-24" />
        <LoadingSkeleton className="h-4 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      </div>

      <section className="space-y-4 px-6 pb-6" aria-hidden="true">
        <div>
          <LoadingSkeleton className="h-6 w-36" />
          <LoadingSkeleton className="mt-2 h-4 w-52" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-5">
            <LoadingSkeleton className="h-5 w-40" />
            <LoadingSkeleton className="mt-2 h-4 w-64" />
            <div className="mt-5"><BarChartSkeleton /></div>
          </div>
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-5">
            <LoadingSkeleton className="mx-auto h-5 w-44" />
            <LoadingSkeleton className="mx-auto mt-2 h-4 w-60" />
            <div className="mt-5"><PieChartSkeleton /></div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-6" aria-hidden="true">
        <div className="rounded-lg border-2 border-neutral-200 bg-white">
          <div className="space-y-2 border-b border-zinc-100 p-5">
            <LoadingSkeleton className="h-5 w-36" />
            <LoadingSkeleton className="h-4 w-64" />
          </div>
          <TableSkeleton />
        </div>
      </section>
    </main>
  );
}
