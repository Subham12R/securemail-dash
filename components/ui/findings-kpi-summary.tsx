type Props = {
  openCount: number;
  highCriticalCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
};

export default function FindingsKpiSummary({
  openCount,
  highCriticalCount,
  acknowledgedCount,
  resolvedCount,
}: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Security findings summary">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Open Findings
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark-soc:text-rose-400">
          {openCount}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          High / Critical
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark-soc:text-rose-400">
          {highCriticalCount}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Acknowledged
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-700 dark-soc:text-zinc-200">
          {acknowledgedCount}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Resolved
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark-soc:text-emerald-400">
          {resolvedCount}
        </div>
      </div>
    </section>
  );
}
