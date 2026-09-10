import type { CertificateItem } from "@/lib/certificates-data";

type Props = {
  certificates: CertificateItem[];
  onSelectCertificate: (cert: CertificateItem) => void;
};

export default function CertificateCardsGrid({ certificates, onSelectCertificate }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38] dark-soc:hover:border-[var(--color-lime-pulse)]/40"
        >
          <div>
            {/* Top row: Domain & Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-mono text-base font-bold text-zinc-900 dark-soc:text-white">
                  {cert.domain}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark-soc:text-zinc-400">
                  {cert.issuer}
                </p>
              </div>

              <span
                className={`shrink-0 rounded px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                  cert.status === "VALID"
                    ? "bg-emerald-100 text-emerald-800 dark-soc:bg-emerald-950/60 dark-soc:text-emerald-300"
                    : cert.status === "EXPIRED"
                    ? "bg-rose-100 text-rose-800 dark-soc:bg-rose-950/60 dark-soc:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark-soc:bg-amber-950/60 dark-soc:text-amber-300"
                }`}
              >
                {cert.statusLabel}
              </span>
            </div>

            {/* Cryptographic properties grid */}
            <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-6 border-t border-zinc-100 pt-4 text-xs dark-soc:border-[#1E2D56]/60">
              <div>
                <span className="text-zinc-500 dark-soc:text-zinc-400">Key Algorithm</span>
                <p className="mt-0.5 font-mono font-medium text-zinc-900 dark-soc:text-zinc-200">
                  {cert.keyAlgorithm}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 dark-soc:text-zinc-400">Signature</span>
                <p className="mt-0.5 font-mono font-medium text-zinc-900 dark-soc:text-zinc-200">
                  {cert.signature}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 dark-soc:text-zinc-400">Valid From</span>
                <p className="mt-0.5 font-mono text-zinc-700 dark-soc:text-zinc-300">
                  {cert.validFrom}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 dark-soc:text-zinc-400">Valid Until</span>
                <p
                  className={`mt-0.5 font-mono font-semibold ${
                    cert.isExpired
                      ? "text-rose-600 dark-soc:text-rose-400"
                      : "text-zinc-700 dark-soc:text-zinc-300"
                  }`}
                >
                  {cert.validUntil}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark-soc:border-[#1E2D56]/60">
            <span className="text-xs text-zinc-500 dark-soc:text-zinc-400">
              Associated with {cert.associatedSessionIds.length} sessions
            </span>
            <button
              type="button"
              onClick={() => onSelectCertificate(cert)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-lime-pulse)] hover:underline"
            >
              Inspect Trust Chain &rarr;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
