"use client";

import { useState } from "react";
import { Download, FileText, Files, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { getAvailableReports, type ForensicReportItem } from "@/lib/reports-data";
import { generateForensicPdfReport } from "@/lib/pdf-report-generator";
import { MetricCard } from "@/components/ui/card";
import type { AnalysisDetailViewModel } from "@/lib/analysis-detail";

export default function ReportsView() {
  const [reports, setReports] = useState<ForensicReportItem[]>(getAvailableReports());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    toast.info("Compiling forensic telemetry and generating PDF report...");

    try {
      const dummyViewModel: AnalysisDetailViewModel = {
        source: "analysed_pcap",
        source_label: "Live PCAP Ingestion",
        summary_text: "Automated Forensic Security Audit",
        summary: {
          request_id: "REQ-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          capture_id: "capture-2026-08-31.pcap",
          client_id: "client-01",
          session_id: "SES-2026-0831",
          protocol: "SMTP",
          posture: "WEAK_CIPHER",
          timestamp: new Date().toISOString(),
          final_verdict: "SUSPICIOUS",
          risk_score: 0.72,
          rule_score: 0.65,
          evidence_ref_count: 6,
          rule_triggers_count: 2,
          is_synthetic: false,
        },
        model: {
          evaluations: [
            { model: "XGBoost Classifier", prediction: "Suspicious", risk_probability: 0.74 },
            { model: "Random Forest", prediction: "Suspicious", risk_probability: 0.69 },
          ],
          risk_drivers: [
            { feature: "TLS Version", observed_value: "TLS 1.0", contribution: 0.35, direction: "increases_risk" },
            { feature: "Cipher Suite", observed_value: "AES_128_CBC", contribution: 0.22, direction: "increases_risk" },
          ],
          rule_findings: [
            {
              label: "Deprecated TLS Version Observed",
              severity: "HIGH",
              detail: "Session negotiated using deprecated TLS 1.0 protocol.",
              evidence: "Client and Server Hello exchanged TLS 1.0 Record layer.",
              citations: ["RFC 8996", "NIST SP 800-52r2"],
            },
            {
              label: "CBC Mode Cipher In Use",
              severity: "MEDIUM",
              detail: "Cipher suite uses CBC mode vulnerable to Lucky13 timing attacks.",
              evidence: "TLS_RSA_WITH_AES_128_CBC_SHA selected by server.",
              citations: ["CVE-2013-0169"],
            },
          ],
          missing_fields: [],
        },
        inbox: {
          state: "available",
          detail: null,
          reason: null,
        },
      };

      const doc = generateForensicPdfReport(dummyViewModel);
      doc.save(`SecureMailScope-Audit-${Date.now()}.pdf`);

      const newReport: ForensicReportItem = {
        id: `rep-${Date.now()}`,
        name: "Full Security Assessment (Generated)",
        pcap: "capture-2026-08-31.pcap",
        generatedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
        findingsCount: 4,
        riskScore: 72,
        format: "PDF",
        status: "READY",
        sizeBytes: 2.1 * 1024 * 1024,
        sizeFormatted: "2.1 MB",
      };

      setReports((prev) => [newReport, ...prev]);
      toast.success("Forensic PDF report generated and downloaded successfully!");
    } catch {
      toast.error("Failed to compile PDF report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFormatBadge = () => "bg-zinc-100 text-zinc-700 border-black/10";

  return (
    <div className="space-y-6 p-6">
      {/* Title Header & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark-soc:text-white">
            <FileText className="h-6 w-6 text-[var(--color-lime-pulse)]" />
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark-soc:text-zinc-400">
            Generated analysis reports and exports
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-normal text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-lime-pulse)] disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Generate Report</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total Reports" value={reports.length} icon={FileText} iconClassName="text-zinc-500" />
        <MetricCard label="Ready For Download" value={reports.filter((r) => r.status === "READY").length} icon={Download} iconClassName="text-[var(--color-lime-pulse)]" />
        <MetricCard label="Formats Available" value="PDF, JSON, HTML" valueClassName="text-2xl sm:text-3xl" icon={Files} iconClassName="text-zinc-500" />
      </div>

      {/* Reports Table Container */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark-soc:border-[#1E2D56] dark-soc:bg-[#0D1735] dark-soc:text-zinc-400">
              <tr>
                <th className="px-5 py-3.5">Report</th>
                <th className="px-4 py-3.5">PCAP</th>
                <th className="px-4 py-3.5">Generated</th>
                <th className="px-4 py-3.5 text-center">Findings</th>
                <th className="px-4 py-3.5 text-center">Risk</th>
                <th className="px-4 py-3.5 text-center">Format</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Size</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800 dark-soc:divide-[#1E2D56] dark-soc:text-zinc-200">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="transition-colors hover:bg-zinc-50/80 dark-soc:hover:bg-[#1A274C]"
                >
                  <td className="px-5 py-4 font-semibold text-zinc-900 dark-soc:text-white">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span>{report.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-zinc-500 dark-soc:text-zinc-400">
                    {report.pcap}
                  </td>
                  <td className="px-4 py-4 text-zinc-500 dark-soc:text-zinc-400">
                    {report.generatedAt}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-zinc-900 dark-soc:text-white">
                    {report.findingsCount}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20">
                      {report.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${getFormatBadge()}`}
                    >
                      {report.format}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark-soc:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{report.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-[11px] text-zinc-500 dark-soc:text-zinc-400">
                    {report.sizeFormatted}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleGeneratePdf}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark-soc:hover:bg-[#1E2D56] dark-soc:hover:text-white transition-colors"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
