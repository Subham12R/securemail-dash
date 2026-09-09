import {
  LoadingSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="Loading history"
      aria-busy="true"
    >
      <div className="flex min-h-16 items-center border-b border-zinc-200 px-6 py-3 pl-20">
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>
      <section className="space-y-2 px-6 pt-6" role="status" aria-label="Loading history data">
        <LoadingSkeleton className="h-6 w-20" />
        <LoadingSkeleton className="h-4 w-72" />
      </section>
      <section className="p-6" aria-hidden="true">
        <div className="rounded-lg border-2 border-neutral-200 bg-white">
          <div className="space-y-2 border-b border-zinc-100 p-5">
            <LoadingSkeleton className="h-5 w-40" />
            <LoadingSkeleton className="h-4 w-72" />
          </div>
          <TableSkeleton rows={7} />
          <div className="flex justify-between border-t border-zinc-100 p-5">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-9 w-64" />
          </div>
        </div>
      </section>
    </main>
  );
}
