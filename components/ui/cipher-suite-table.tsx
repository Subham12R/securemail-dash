import type { CipherSuiteItem } from "@/lib/tls-data";

function getRatingBadge(rating: CipherSuiteItem["rating"]) {
  switch (rating) {
    case "Strong":
      return "bg-emerald-100 text-emerald-800 dark-soc:bg-emerald-950/60 dark-soc:text-emerald-300 border-emerald-300 dark-soc:border-emerald-700/50";
    case "Adequate":
      return "bg-zinc-100 text-zinc-700 border-black/10";
    case "Weak":
      return "bg-amber-100 text-amber-800 dark-soc:bg-amber-950/60 dark-soc:text-amber-300 border-amber-300 dark-soc:border-amber-700/50";
    case "Deprecated":
      return "bg-rose-100 text-rose-800 dark-soc:bg-rose-950/60 dark-soc:text-rose-300 border-rose-300 dark-soc:border-rose-700/50";
  }
}

export default function CipherSuiteTable({ suites }: { suites: CipherSuiteItem[] }) {
  if (suites.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38] dark-soc:text-zinc-400">
        No TLS cipher suites recorded in the observed captures.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-500 dark-soc:border-[#1E2D56] dark-soc:bg-[#0D1735] dark-soc:text-zinc-400">
            <tr>
              <th scope="col" className="px-4 py-3 sm:px-6">Cipher Suite</th>
              <th scope="col" className="px-4 py-3">Protocol</th>
              <th scope="col" className="px-4 py-3">Key Exchange</th>
              <th scope="col" className="px-4 py-3">Encryption</th>
              <th scope="col" className="px-4 py-3">MAC</th>
              <th scope="col" className="px-4 py-3">Posture</th>
              <th scope="col" className="px-4 py-3 text-right">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark-soc:divide-[#1E2D56]">
            {suites.map((suite) => (
              <tr
                key={suite.name}
                className="transition-colors hover:bg-zinc-50/70 dark-soc:hover:bg-[#152244]"
              >
                <td className="px-4 py-3 sm:px-6 font-mono text-xs font-semibold text-zinc-900 dark-soc:text-white">
                  {suite.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark-soc:text-zinc-300">
                  {suite.protocol}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark-soc:text-zinc-300">
                  {suite.keyExchange}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark-soc:text-zinc-300">
                  {suite.encryption}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark-soc:text-zinc-400">
                  {suite.mac}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${getRatingBadge(
                      suite.rating
                    )}`}
                  >
                    {suite.rating}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-zinc-900 dark-soc:text-white">
                    {suite.sessionCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
