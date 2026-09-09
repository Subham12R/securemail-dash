"use client";

import { useState } from "react";
import type { AnalysisRecord } from "@/lib/securemail-api";
import { buildCertificatesSummary, type CertificateItem } from "@/lib/certificates-data";
import CertificateKpiTiles from "@/components/ui/certificate-kpi-tiles";
import CertificateCardsGrid from "@/components/ui/certificate-cards-grid";
import CertificateChainModal from "@/components/ui/certificate-chain-modal";

type TabKey = "overview" | "list" | "chain";

export default function CertificatesView({ records }: { records: readonly AnalysisRecord[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  const summary = buildCertificatesSummary(records);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
          Certificates
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark-soc:text-zinc-400">
          X.509 certificate analysis and chain validation
        </p>
      </div>

      {/* Top Status KPI Tiles */}
      <CertificateKpiTiles summary={summary} />

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark-soc:border-[#1E2D56]">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "overview"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "list"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Certificate List</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {summary.certificates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chain")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "chain"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Chain Analysis</span>
        </button>
      </div>

      {/* Tab Panels */}
      {(activeTab === "overview" || activeTab === "list") && (
        <CertificateCardsGrid
          certificates={summary.certificates}
          onSelectCertificate={(cert) => setSelectedCert(cert)}
        />
      )}

      {activeTab === "chain" && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 dark-soc:text-zinc-400">
            Select any observed certificate below to visualize its full hierarchical chain of trust up to the Root CA.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.certificates.map((cert) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => setSelectedCert(cert)}
                className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-xs transition-all hover:border-[#00E5FF] dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38] dark-soc:hover:border-[#00E5FF]"
              >
                <span className="font-mono text-xs font-bold text-zinc-900 dark-soc:text-white truncate w-full">
                  {cert.domain}
                </span>
                <span className="mt-1 text-[11px] text-zinc-500 dark-soc:text-zinc-400 truncate w-full">
                  {cert.issuer}
                </span>
                <span className="mt-3 text-xs font-semibold text-[#00E5FF]">
                  View Chain ({cert.chain.length} tiers) &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <CertificateChainModal
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}
