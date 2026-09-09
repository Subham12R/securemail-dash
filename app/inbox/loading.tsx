export default function Loading() {
  return (
    <main
      aria-label="Loading Inbox"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#061426]"
    >
      <div className="flex min-h-16 shrink-0 items-center border-b border-[#173858] px-6 pl-20">
        <div className="h-4 w-36 animate-pulse rounded bg-slate-700/60" />
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="border-r border-[#173858] p-5">
          <div className="h-7 w-28 animate-pulse rounded bg-slate-700/60" />
          <div className="mt-2 h-4 w-44 animate-pulse rounded bg-slate-800" />
          <div className="mt-5 h-9 w-72 animate-pulse rounded bg-slate-800" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="space-y-3 border-b border-[#173858] pb-5">
                <div className="h-3 w-2/5 animate-pulse rounded bg-slate-700/60" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden p-6 lg:block">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-700/60" />
          <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="mt-5 h-10 animate-pulse rounded bg-slate-800" />
          <div className="mt-6 h-56 animate-pulse rounded-lg bg-slate-800" />
        </div>
      </div>
    </main>
  );
}
