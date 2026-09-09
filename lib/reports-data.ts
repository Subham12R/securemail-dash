export type ReportFormat = "PDF" | "JSON" | "HTML";
export type ReportStatus = "READY" | "GENERATING" | "FAILED";

export interface ForensicReportItem {
  id: string;
  name: string;
  pcap: string;
  generatedAt: string;
  findingsCount: number;
  riskScore: number;
  format: ReportFormat;
  status: ReportStatus;
  sizeBytes: number;
  sizeFormatted: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAvailableReports(): ForensicReportItem[] {
  return [
    {
      id: "rep-001",
      name: "Full Security Assessment",
      pcap: "capture-2026-08-31.pcap",
      generatedAt: "2026-08-31 15:45:00",
      findingsCount: 6,
      riskScore: 72,
      format: "PDF",
      status: "READY",
      sizeBytes: 2.4 * 1024 * 1024,
      sizeFormatted: "2.4 MB",
    },
    {
      id: "rep-002",
      name: "Findings Summary",
      pcap: "capture-2026-08-31.pcap",
      generatedAt: "2026-08-31 15:46:00",
      findingsCount: 6,
      riskScore: 72,
      format: "JSON",
      status: "READY",
      sizeBytes: 148 * 1024,
      sizeFormatted: "148 KB",
    },
    {
      id: "rep-003",
      name: "Executive Summary",
      pcap: "capture-2026-08-31.pcap",
      generatedAt: "2026-08-31 15:47:00",
      findingsCount: 6,
      riskScore: 72,
      format: "HTML",
      status: "READY",
      sizeBytes: 890 * 1024,
      sizeFormatted: "890 KB",
    },
  ];
}
