import type { AnalysisRecord } from "./securemail-api.ts";
import type { TmpVaultEmail } from "./tmpvault-api.ts";

export type TlsVersionMetric = {
  version: string;
  count: number;
  percentage: number;
  isDeprecated: boolean;
};

export type KeyExchangeMechanism = {
  name: string;
  count: number;
  status: "modern" | "legacy";
  statusLabel: string;
};

export type CipherSuiteItem = {
  name: string;
  protocol: string;
  keyExchange: string;
  encryption: string;
  mac: string;
  rating: "Strong" | "Adequate" | "Weak" | "Deprecated";
  sessionCount: number;
  sessionIds: string[];
};

export type TlsAnalysisSummary = {
  tlsSessionsCount: number;
  totalSessionsCount: number;
  pfsCount: number;
  noPfsCount: number;
  pfsPercentage: number;
  strongCiphersCount: number;
  weakCiphersCount: number;
  keyExchangesCount: number;
  versions: TlsVersionMetric[];
  keyExchanges: KeyExchangeMechanism[];
  cipherSuites: CipherSuiteItem[];
};

export function buildTlsAnalysis(
  records: readonly AnalysisRecord[],
  tmpVaultEmails: readonly TmpVaultEmail[] = []
): TlsAnalysisSummary {
  const versionCounts: Record<string, { count: number; isDeprecated: boolean }> = {
    "TLS 1.3": { count: 0, isDeprecated: false },
    "TLS 1.2": { count: 0, isDeprecated: false },
    "TLS 1.0": { count: 0, isDeprecated: true },
  };

  const keyExchangeCounts: Record<string, { count: number; status: "modern" | "legacy"; label: string }> = {
    ECDHE: { count: 0, status: "modern", label: "Modern" },
    RSA: { count: 0, status: "legacy", label: "Legacy" },
  };

  const cipherMap = new Map<string, CipherSuiteItem>();

  let tlsCount = 0;
  let pfsCount = 0;
  let noPfsCount = 0;
  let strongCount = 0;
  let weakCount = 0;

  // 1. Ingest real TLS streams from tmpvault emails
  for (const email of tmpVaultEmails) {
    const rawTls = email.analysis?.TLS;
    if (!rawTls) continue;

    tlsCount++;
    const version = rawTls.Version || "TLS 1.3";
    const cipherName = rawTls.CipherSuite || "TLS_AES_128_GCM_SHA256";
    const isPfs = rawTls.ForwardSecrecy ?? true;
    const isStrong = rawTls.CipherStrength === "strong" || cipherName.includes("GCM") || cipherName.includes("POLY1305");

    if (isPfs) pfsCount++; else noPfsCount++;
    if (isStrong) strongCount++; else weakCount++;

    // Version
    if (!versionCounts[version]) {
      versionCounts[version] = { count: 0, isDeprecated: version === "TLS 1.0" || version === "TLS 1.1" };
    }
    versionCounts[version].count++;

    // Key exchange (ECDHE in TLS 1.3)
    const kx = isPfs ? "ECDHE" : "RSA";
    keyExchangeCounts[kx].count++;

    const sessionId = email.ai?.response?.result?.session_id || email.id;
    const existing = cipherMap.get(cipherName);
    if (existing) {
      existing.sessionCount++;
      if (existing.sessionIds.length < 5) existing.sessionIds.push(sessionId);
    } else {
      cipherMap.set(cipherName, {
        name: cipherName,
        protocol: version,
        keyExchange: kx,
        encryption: cipherName.includes("256") ? "AES-256-GCM" : "AES-128-GCM",
        mac: "AEAD",
        rating: isStrong ? "Strong" : "Weak",
        sessionCount: 1,
        sessionIds: [sessionId],
      });
    }
  }

  // 2. Ingest sessions from AnalysisRecord[]
  for (const record of records) {
    const posture = (record.posture ?? "").toLowerCase();
    const triggers = Array.isArray(record.trigger_details) ? JSON.stringify(record.trigger_details).toLowerCase() : "";
    const explanations = record.explanations ? JSON.stringify(record.explanations).toLowerCase() : "";
    const combined = `${posture} ${triggers} ${explanations}`;

    if (posture === "plaintext") continue;

    tlsCount++;
    let version = "TLS 1.3";
    let isDeprecated = false;
    if (combined.includes("tls 1.0") || combined.includes("tls1.0") || posture === "deprecated") {
      version = "TLS 1.0";
      isDeprecated = true;
    } else if (combined.includes("tls 1.1") || combined.includes("tls1.1")) {
      version = "TLS 1.1";
      isDeprecated = true;
    } else if (combined.includes("tls 1.2") || combined.includes("tls1.2") || posture === "adequate" || posture === "legacy") {
      version = "TLS 1.2";
    }

    let hasPfs = true;
    let keyExchange = "ECDHE";
    if (combined.includes("rsa key exchange") || combined.includes("without forward secrecy") || posture === "deprecated" || posture === "weak" || record.risk_score > 0.65) {
      hasPfs = false;
      keyExchange = "RSA";
    }

    if (hasPfs) pfsCount++; else noPfsCount++;

    let cipherSuiteName = "TLS_AES_256_GCM_SHA384";
    let encryption = "AES-256-GCM";
    let mac = "AEAD";
    let rating: "Strong" | "Adequate" | "Weak" | "Deprecated" = "Strong";

    if (version === "TLS 1.0" || posture === "deprecated") {
      cipherSuiteName = "TLS_RSA_WITH_3DES_EDE_CBC_SHA";
      encryption = "3DES-EDE-CBC";
      mac = "SHA-1";
      rating = "Deprecated";
    } else if (keyExchange === "RSA" || posture === "weak") {
      cipherSuiteName = "TLS_RSA_WITH_AES_128_CBC_SHA256";
      encryption = "AES-128-CBC";
      mac = "SHA-256";
      rating = "Weak";
    } else if (version === "TLS 1.2") {
      cipherSuiteName = "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256";
      encryption = "AES-128-GCM";
      rating = "Adequate";
    }

    if (rating === "Strong" || rating === "Adequate") strongCount++; else weakCount++;

    if (!versionCounts[version]) {
      versionCounts[version] = { count: 0, isDeprecated };
    }
    versionCounts[version].count++;

    if (!keyExchangeCounts[keyExchange]) {
      keyExchangeCounts[keyExchange] = { count: 0, status: hasPfs ? "modern" : "legacy", label: hasPfs ? "Modern" : "Legacy" };
    }
    keyExchangeCounts[keyExchange].count++;

    const existing = cipherMap.get(cipherSuiteName);
    if (existing) {
      existing.sessionCount++;
      if (existing.sessionIds.length < 5) existing.sessionIds.push(record.session_id);
    } else {
      cipherMap.set(cipherSuiteName, {
        name: cipherSuiteName,
        protocol: version,
        keyExchange,
        encryption,
        mac,
        rating,
        sessionCount: 1,
        sessionIds: [record.session_id],
      });
    }
  }

  const versions: TlsVersionMetric[] = Object.entries(versionCounts).map(([ver, data]) => ({
    version: ver,
    count: data.count,
    percentage: tlsCount > 0 ? Math.round((data.count / tlsCount) * 1000) / 10 : 0,
    isDeprecated: data.isDeprecated,
  })).sort((a, b) => b.count - a.count);

  const keyExchanges: KeyExchangeMechanism[] = Object.entries(keyExchangeCounts)
    .filter(([_, data]) => data.count > 0)
    .map(([name, data]) => ({
      name,
      count: data.count,
      status: data.status,
      statusLabel: data.label,
    }))
    .sort((a, b) => b.count - a.count);

  const cipherSuites = Array.from(cipherMap.values()).sort((a, b) => b.sessionCount - a.sessionCount);

  return {
    tlsSessionsCount: tlsCount,
    totalSessionsCount: records.length + tmpVaultEmails.length,
    pfsCount,
    noPfsCount,
    pfsPercentage: tlsCount > 0 ? Math.round((pfsCount / tlsCount) * 100) : 0,
    strongCiphersCount: strongCount,
    weakCiphersCount: weakCount,
    keyExchangesCount: keyExchanges.length,
    versions,
    keyExchanges,
    cipherSuites,
  };
}
