"use client";

import { useState, useEffect, useMemo } from "react";
import type { AnalysisRecord } from "@/lib/securemail-api";
import { buildFindingsSummary, type FindingSeverity, type FindingStatus } from "@/lib/findings-data";
import FindingsKpiSummary from "@/components/ui/findings-kpi-summary";
import FindingCard from "@/components/ui/finding-card";

type TabFilter = "ALL" | FindingSeverity;

const STORAGE_KEY = "securemailscope:finding_status";

export default function FindingsView({ records }: { records: readonly AnalysisRecord[] }) {
  const summary = useMemo(() => buildFindingsSummary(records), [records]);
  const [statuses, setStatuses] = useState<Record<string, FindingStatus>>({});
  const [selectedSeverity, setSelectedSeverity] = useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Load triage state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStatuses(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleStatusChange = (findingId: string, newStatus: FindingStatus) => {
    setStatuses((prev) => {
      const next = { ...prev, [findingId]: newStatus };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const getEffectiveStatus = (id: string, defaultStatus: FindingStatus): FindingStatus => {
    return statuses[id] ?? defaultStatus;
  };

  // Dynamic KPI counts based on active triage statuses
  const dynamicCounts = useMemo(() => {
    let openCount = 0;
    let highCriticalCount = 0;
    let acknowledgedCount = 0;
    let resolvedCount = 0;

    for (const finding of summary.findings) {
      const status = getEffectiveStatus(finding.id, finding.defaultStatus);
      if (status === "OPEN") {
        openCount++;
        if (finding.severity === "CRITICAL" || finding.severity === "HIGH") {
          highCriticalCount++;
        }
      } else if (status === "ACKNOWLEDGED") {
        acknowledgedCount++;
      } else if (status === "RESOLVED") {
        resolvedCount++;
      }
    }

    return { openCount, highCriticalCount, acknowledgedCount, resolvedCount };
  }, [summary.findings, statuses]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return summary.findings.filter((finding) => {
      // Severity filter
      if (selectedSeverity !== "ALL" && finding.severity !== selectedSeverity) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          finding.title.toLowerCase().includes(q) ||
          finding.category.toLowerCase().includes(q) ||
          finding.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [summary.findings, selectedSeverity, searchQuery]);

  const criticalCount = summary.findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = summary.findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = summary.findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = summary.findings.filter((f) => f.severity === "LOW").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Title Header & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark-soc:text-white">
            Findings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark-soc:text-zinc-400">
            Security findings and recommendations
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search findings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-xs focus:border-[#00E5FF] focus:outline-hidden dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38] dark-soc:text-white dark-soc:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Top KPI Summary */}
      <FindingsKpiSummary
        openCount={dynamicCounts.openCount}
        highCriticalCount={dynamicCounts.highCriticalCount}
        acknowledgedCount={dynamicCounts.acknowledgedCount}
        resolvedCount={dynamicCounts.resolvedCount}
      />

      {/* Severity Filter Tabs */}
      <div className="flex border-b border-zinc-200 dark-soc:border-[#1E2D56]">
        <button
          type="button"
          onClick={() => setSelectedSeverity("ALL")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selectedSeverity === "ALL"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>All Findings</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {summary.findings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity("CRITICAL")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selectedSeverity === "CRITICAL"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Critical</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {criticalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity("HIGH")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selectedSeverity === "HIGH"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>High</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {highCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity("MEDIUM")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selectedSeverity === "MEDIUM"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Medium</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {mediumCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity("LOW")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            selectedSeverity === "LOW"
              ? "border-[#00E5FF] text-zinc-900 dark-soc:border-[#00E5FF] dark-soc:text-[#00E5FF]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark-soc:text-zinc-400 dark-soc:hover:text-white"
          }`}
        >
          <span>Low</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
            {lowCount}
          </span>
        </button>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            currentStatus={getEffectiveStatus(finding.id, finding.defaultStatus)}
            onStatusChange={handleStatusChange}
          />
        ))}

        {filteredFindings.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38] dark-soc:text-zinc-400">
            No findings match your selected filter or search query.
          </div>
        )}
      </div>
    </div>
  );
}
