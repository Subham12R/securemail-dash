import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="Loading history detail"
      aria-busy="true"
    >
      <div className="flex min-h-16 items-center border-b border-zinc-200 px-6 py-3 pl-20">
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="min-h-0 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto grid w-full max-w-[1280px] gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-5">
          <div className="space-y-4">
            <section className="space-y-5 rounded-xl border border-zinc-200 p-5 sm:p-6" aria-hidden="true">
              <div className="flex items-start gap-3">
                <LoadingSkeleton className="size-12 rounded-xl" />
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-7 w-64" />
                  <LoadingSkeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <LoadingSkeleton className="h-10 w-full" />
                <LoadingSkeleton className="h-10 w-full" />
                <LoadingSkeleton className="h-10 w-full" />
                <LoadingSkeleton className="h-10 w-full" />
              </div>
              <LoadingSkeleton className="h-8 w-full" />
            </section>
            <section className="space-y-4 rounded-xl border border-zinc-200 p-5 sm:p-6" aria-hidden="true">
              <LoadingSkeleton className="h-5 w-32" />
              <LoadingSkeleton className="h-4 w-72" />
              <LoadingSkeleton className="h-56 w-full" />
            </section>
          </div>
          <aside className="min-h-64 rounded-xl border border-zinc-200 bg-zinc-50 p-4" aria-hidden="true">
            <LoadingSkeleton className="h-5 w-48" />
            <LoadingSkeleton className="mt-6 h-24 w-full" />
            <LoadingSkeleton className="mt-4 h-32 w-full" />
          </aside>
        </div>
      </div>
    </main>
  );
}
