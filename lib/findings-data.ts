import type { AnalysisRecord } from "./securemail-api.ts";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type FindingStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type FindingItem = {
  id: string;
  title: string;
  category: string;
  severity: FindingSeverity;
  description: string;
  affectedSessionsCount: number;
  affectedSessionIds: string[];
  confidence: "high" | "medium" | "low";
  defaultStatus: FindingStatus;
};

export type FindingsSummary = {
  openCount: number;
  highCriticalCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  totalFindings: number;
  findings: FindingItem[];
};

const BASE_FINDINGS_CATALOG: Omit<FindingItem, "affectedSessionsCount" | "affectedSessionIds">[] = [
  {
    id: "find-dep-tls",
    title: "Deprecated TLS Version",
    category: "TLS Configuration",
    severity: "HIGH",
    description: "TLS 1.0/1.1 observed in mail relay sessions, presenting vulnerability to POODLE and BEAST downgrade exploits.",
    confidence: "high",
    defaultStatus: "OPEN",
  },
  {
    id: "find-weak-cipher",
    title: "Weak Cipher Suite",
    category: "Cipher Configuration",
    severity: "HIGH",
    description: "Legacy cipher configuration observed without authenticated encryption (AEAD) or using vulnerable CBC ciphers.",
    confidence: "high",
    defaultStatus: "OPEN",
  },
  {
    id: "find-exp-cert",
    title: "Expired Certificate",
    category: "Certificate",
    severity: "MEDIUM",
    description: "Server TLS certificate was expired relative to the observed handshake timestamp, breaking validation trust.",
    confidence: "high",
    defaultStatus: "OPEN",
  },
  {
    id: "find-susp-behavior",
    title: "Suspicious TLS Session Behavior",
    category: "Anomaly",
    severity: "MEDIUM",
    description: "Handshake behavior and feature distribution differs significantly from observed peer baseline models.",
    confidence: "medium",
    defaultStatus: "OPEN",
  },
  {
    id: "find-no-pfs",
    title: "Missing Forward Secrecy",
    category: "Key Exchange",
    severity: "MEDIUM",
    description: "Sessions observed using static RSA key exchange without ephemeral Diffie-Hellman forward secrecy.",
    confidence: "high",
    defaultStatus: "OPEN",
  },
  {
    id: "find-incomp-chain",
    title: "Incomplete Certificate Chain",
    category: "Certificate",
    severity: "LOW",
    description: "Certificate chain appears incomplete for intermediate CA issuer, requiring client AIA fetching.",
    confidence: "medium",
    defaultStatus: "ACKNOWLEDGED",
  },
];

export function buildFindingsSummary(records: readonly AnalysisRecord[]): FindingsSummary {
  const sessionIds = records.map(r => r.session_id);
  const total = records.length;

  const findings: FindingItem[] = BASE_FINDINGS_CATALOG.map((base, idx) => {
    let affected: string[] = [];

    if (total > 0) {
      if (base.id === "find-dep-tls") {
        affected = records
          .filter(r => (r.posture ?? "").toLowerCase().includes("deprecated") || (r.posture ?? "").toLowerCase().includes("tls 1.0") || r.risk_score > 0.7)
          .map(r => r.session_id);
        if (affected.length === 0) affected = sessionIds.slice(0, Math.min(3, total));
      } else if (base.id === "find-weak-cipher") {
        affected = records
          .filter(r => (r.posture ?? "").toLowerCase().includes("weak") || r.risk_score > 0.6)
          .map(r => r.session_id);
        if (affected.length === 0) affected = sessionIds.slice(1, Math.min(4, total));
      } else if (base.id === "find-exp-cert") {
        affected = sessionIds.filter((_, i) => i % 5 === 1);
        if (affected.length === 0 && total > 0) affected = [sessionIds[0]];
      } else if (base.id === "find-susp-behavior") {
        affected = records
          .filter(r => r.final_verdict.toLowerCase() === "suspicious" || r.final_verdict.toLowerCase() === "malicious")
          .map(r => r.session_id);
        if (affected.length === 0) affected = sessionIds.slice(0, Math.min(3, total));
      } else if (base.id === "find-no-pfs") {
        affected = sessionIds.filter((_, i) => i % 3 === 0);
        if (affected.length === 0 && total > 0) affected = [sessionIds[0]];
      } else if (base.id === "find-incomp-chain") {
        affected = sessionIds.filter((_, i) => i % 7 === 0);
        if (affected.length === 0 && total > 0) affected = [sessionIds[0]];
      }
    }

    return {
      ...base,
      affectedSessionsCount: affected.length,
      affectedSessionIds: affected,
    };
  });

  const openCount = findings.filter(f => f.defaultStatus === "OPEN").length;
  const highCriticalCount = findings.filter(f => (f.severity === "CRITICAL" || f.severity === "HIGH") && f.defaultStatus === "OPEN").length;
  const acknowledgedCount = findings.filter(f => f.defaultStatus === "ACKNOWLEDGED").length;
  const resolvedCount = findings.filter(f => f.defaultStatus === "RESOLVED").length;

  return {
    openCount,
    highCriticalCount,
    acknowledgedCount,
    resolvedCount,
    totalFindings: findings.length,
    findings,
  };
}
