"use client";

import type { CertificateItem } from "@/lib/certificates-data";

type Props = {
  certificate: CertificateItem | null;
  onClose: () => void;
};

export default function CertificateChainModal({ certificate, onClose }: Props) {
  if (!certificate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chain-modal-title"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark-soc:border-[#1E2D56]">
          <div>
            <h3 id="chain-modal-title" className="text-lg font-bold text-zinc-900 dark-soc:text-white">
              Certificate Chain of Trust
            </h3>
            <p className="font-mono text-xs text-zinc-500 dark-soc:text-zinc-400">
              {certificate.domain}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark-soc:hover:bg-[#1E2D56] dark-soc:hover:text-white"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Chain Tree Content */}
        <div className="space-y-4 p-6">
          {certificate.chain.map((node, index) => (
            <div key={node.subject} className="relative">
              {/* Connector line */}
              {index < certificate.chain.length - 1 && (
                <div className="absolute top-12 left-5 -bottom-4 w-0.5 bg-zinc-200 dark-soc:bg-[#1E2D56]" />
              )}

              <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark-soc:border-[#1E2D56] dark-soc:bg-[#0D1735]">
                {/* Node icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-xs dark-soc:bg-[#111C38]">
                  {node.valid ? (
                    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* Node metadata */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-700 uppercase dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
                      {node.level}
                    </span>
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase ${
                        node.valid
                          ? "text-emerald-600 dark-soc:text-emerald-400"
                          : "text-rose-600 dark-soc:text-rose-400"
                      }`}
                    >
                      {node.valid ? "TRUSTED & VALID" : "INVALID / EXPIRED"}
                    </span>
                  </div>

                  <h4 className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark-soc:text-white truncate">
                    {node.subject}
                  </h4>
                  <p className="text-xs text-zinc-500 dark-soc:text-zinc-400 truncate">
                    Issuer: {node.issuer}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark-soc:text-zinc-300">
                    <span>Algorithm: <strong className="font-mono">{node.algorithm}</strong></span>
                    <span>Key: <strong className="font-mono">{node.keySize}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 px-6 py-3 dark-soc:border-[#1E2D56] dark-soc:bg-[#0D1735]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark-soc:bg-[#1E2D56] dark-soc:hover:bg-[#2A3F75]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
