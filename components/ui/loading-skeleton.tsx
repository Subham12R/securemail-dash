import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-pulse rounded-md bg-zinc-200 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function BarChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-64 items-end justify-around gap-4 rounded-lg border border-zinc-100 bg-zinc-50 px-8 pb-8 pt-10"
    >
      {["h-24", "h-40", "h-16", "h-52", "h-32"].map((height) => (
        <LoadingSkeleton key={height} className={`w-10 ${height} bg-zinc-300`} />
      ))}
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-64 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50"
    >
      <LoadingSkeleton className="size-44 rounded-full border-[24px] border-zinc-300 bg-transparent" />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="size-4 rounded-full" />
      </div>
      <LoadingSkeleton className="mt-5 h-10 w-24" />
      <LoadingSkeleton className="mt-2 h-3 w-36" />
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <LoadingSkeleton className="h-4 w-40" />
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-2 flex-1" />
          <LoadingSkeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
