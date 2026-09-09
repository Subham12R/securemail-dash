import {
  LoadingSkeleton,
  MetricCardSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="Loading analytics"
      aria-busy="true"
    >
      <div className="flex min-h-16 items-center border-b border-zinc-200 px-6 py-3 pl-20">
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>

      <section className="p-6 pb-0" role="status" aria-label="Loading analytics data">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-5">
            <LoadingSkeleton className="h-5 w-40" />
            <LoadingSkeleton className="mt-2 h-4 w-80" />
            <LoadingSkeleton className="mt-5 h-56 w-full rounded-xl" />
            <div className="mt-4 flex items-center justify-between">
              <LoadingSkeleton className="h-4 w-52" />
              <LoadingSkeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <LoadingSkeleton className="h-5 w-36" />
              <LoadingSkeleton className="h-7 w-16" />
            </div>
            <LoadingSkeleton className="mt-2 h-4 w-56" />
            <LoadingSkeleton className="mt-5 h-16 w-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <LoadingSkeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="p-6 pb-0" aria-hidden="true">
        <div className="mb-4 space-y-2">
          <LoadingSkeleton className="h-6 w-44" />
          <LoadingSkeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <section className="p-6" aria-hidden="true">
        <div className="rounded-lg border-2 border-neutral-200 bg-white">
          <div className="space-y-2 border-b border-zinc-100 p-5">
            <LoadingSkeleton className="h-5 w-36" />
            <LoadingSkeleton className="h-4 w-72" />
          </div>
          <TableSkeleton rows={1} />
        </div>
      </section>
    </main>
  );
}
