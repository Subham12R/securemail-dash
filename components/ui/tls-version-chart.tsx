import type { TlsVersionMetric, KeyExchangeMechanism } from "@/lib/tls-data";

type Props = {
  versions: TlsVersionMetric[];
  keyExchanges: KeyExchangeMechanism[];
};

export default function TlsVersionChart({ versions, keyExchanges }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* TLS Version Distribution Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <h3 className="text-base font-semibold text-zinc-900 dark-soc:text-white">
          TLS Version Distribution
        </h3>
        <div className="mt-6 space-y-5">
          {versions.map((ver) => (
            <div key={ver.version} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-900 dark-soc:text-white">
                    {ver.version}
                  </span>
                  {ver.isDeprecated && (
                    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 uppercase dark-soc:border-amber-400/40 dark-soc:bg-amber-400/10 dark-soc:text-amber-400">
                      DEPRECATED
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500 dark-soc:text-zinc-400">
                  {ver.count} sessions ({ver.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark-soc:bg-[#1A274C]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ver.isDeprecated
                      ? "bg-rose-500 dark-soc:bg-rose-400"
                      : "bg-[var(--color-lime-pulse)] dark-soc:bg-[var(--color-lime-pulse)]"
                  }`}
                  style={{ width: `${Math.max(ver.percentage, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Exchange Mechanisms Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <h3 className="text-base font-semibold text-zinc-900 dark-soc:text-white">
          Key Exchange Mechanisms
        </h3>
        <div className="mt-6 space-y-3">
          {keyExchanges.map((mech) => (
            <div
              key={mech.name}
              className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/70 p-3.5 dark-soc:border-[#1E2D56]/60 dark-soc:bg-[#0D1735]"
            >
              <div className="flex items-center gap-3">
                {mech.status === "modern" ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark-soc:bg-emerald-950/60 dark-soc:text-emerald-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark-soc:bg-rose-950/60 dark-soc:text-rose-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                <span className="font-mono text-sm font-semibold text-zinc-900 dark-soc:text-white">
                  {mech.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 dark-soc:text-zinc-400">
                  {mech.count} sessions
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    mech.status === "modern"
                      ? "bg-emerald-100 text-emerald-800 dark-soc:bg-emerald-950/60 dark-soc:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark-soc:bg-rose-950/60 dark-soc:text-rose-300"
                  }`}
                >
                  {mech.statusLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
