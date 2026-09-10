import type { CertificatesSummary } from "@/lib/certificates-data";

export default function CertificateKpiTiles({ summary }: { summary: CertificatesSummary }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Certificate validation metrics">
      {/* Valid */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
            Valid
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
            {summary.validCount}
          </div>
        </div>
      </div>

      {/* Expired */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
            Expired
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
            {summary.expiredCount}
          </div>
        </div>
      </div>

      {/* Expiring Soon */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
            Expiring Soon
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
            {summary.expiringSoonCount}
          </div>
        </div>
      </div>

      {/* Invalid / Chain Issues */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-400">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark-soc:text-zinc-400">
            Invalid / Chain Issues
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
            {summary.invalidCount}
          </div>
        </div>
      </div>
    </section>
  );
}
