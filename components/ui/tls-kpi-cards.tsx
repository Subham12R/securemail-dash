import type { TlsAnalysisSummary } from "@/lib/tls-data";

export default function TlsKpiCards({ summary }: { summary: TlsAnalysisSummary }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="TLS key performance metrics">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          TLS Sessions
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
          {summary.tlsSessionsCount}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Forward Secrecy
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-rose-600 dark-soc:text-rose-400">
            {summary.pfsCount}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark-soc:text-zinc-400">
            {summary.noPfsCount} without
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Strong Ciphers
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark-soc:text-emerald-400">
          {summary.strongCiphersCount}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Weak Ciphers
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-rose-600 dark-soc:text-rose-400">
          {summary.weakCiphersCount}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
          Key Exchanges
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
          {summary.keyExchangesCount}
        </div>
      </div>
    </section>
  );
}
