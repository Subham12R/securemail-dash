"use client";

import { useState } from "react";
import type { AnalysisRecord } from "@/lib/securemail-api";
import { buildTlsAnalysis } from "@/lib/tls-data";
import TlsKpiCards from "@/components/ui/tls-kpi-cards";
import TlsVersionChart from "@/components/ui/tls-version-chart";
import CipherSuiteTable from "@/components/ui/cipher-suite-table";
import TlsSecurityAssessment from "@/components/ui/tls-security-assessment";

type TabKey = "versions" | "ciphers" | "assessment";

export default function TlsView({ records }: { records: readonly AnalysisRecord[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("versions");
  const summary = buildTlsAnalysis(records);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
          TLS Analysis
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark-soc:text-zinc-400">
          Transport Layer Security assessment across observed sessions
        </p>
      </div>

      {/* Top 5 KPI Cards */}
      <TlsKpiCards summary={summary} />

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark-soc:border-[#1E2D56]">
        <button
          type="button"
          onClick={() => setActiveTab("versions")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "versions"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>TLS Versions</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {summary.versions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ciphers")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "ciphers"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Cipher Suites</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {summary.cipherSuites.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("assessment")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "assessment"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Security Assessment</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "versions" && (
        <TlsVersionChart versions={summary.versions} keyExchanges={summary.keyExchanges} />
      )}

      {activeTab === "ciphers" && (
        <CipherSuiteTable suites={summary.cipherSuites} />
      )}

      {activeTab === "assessment" && (
        <TlsSecurityAssessment summary={summary} />
      )}
    </div>
  );
}
