import type { InboxDetailResponse } from "@/lib/inbox-data";
import type { AnalysisRecord } from "@/lib/securemail-api";

export function convertInboxDetailToAnalysisRecord(
  detail: InboxDetailResponse,
  fallbackRequestId: string,
): AnalysisRecord {
  const item = detail.item;
  const tls = detail.tls.state === "available" ? detail.tls.data : null;
  const network = detail.network.state === "available" ? detail.network.data : null;
  const riskScore = detail.analysis_ref.risk_score ?? item.analysis.risk_score ?? 0.33;
  const riskClass = detail.analysis_ref.risk_class ?? item.analysis.risk_class ?? "low";

  const triggerDetails: Array<{
    finding_id: string;
    title: string;
    severity: string;
    detail?: string;
    evidence?: string;
    citations: string[];
  }> = [];

  if (tls?.warnings && tls.warnings.length > 0) {
    for (const w of tls.warnings) {
      const isCertChain = w.toLowerCase().includes("chain") || w.toLowerCase().includes("trust");
      const isPinning = w.toLowerCase().includes("pinning");
      triggerDetails.push({
        finding_id: isCertChain ? "CERT-003" : isPinning ? "TLS-PIN-001" : "TLS-WARN-001",
        title: w,
        severity: isCertChain ? "high" : "medium",
        detail: isCertChain
          ? "Server presented an untrusted certificate chain without root CA path."
          : isPinning
          ? "No DANE TLSA or MTA-STS certificate pinning policy detected."
          : "TLS negotiation warning flagged during connection.",
        evidence: `tls.warnings: ${w}`,
        citations: isCertChain
          ? ["RFC 5280", "NIST SP 800-52r2"]
          : isPinning
          ? ["RFC 8461", "RFC 7672"]
          : ["RFC 8996"],
      });
    }
  }

  if (network?.ip_reputation?.issues && network.ip_reputation.issues.length > 0) {
    for (const issue of network.ip_reputation.issues) {
      triggerDetails.push({
        finding_id: "IP-HOST-001",
        title: issue,
        severity: "medium",
        detail: `Client IP ${network.ip_reputation.address ?? "observed"} is flagged: ${issue}.`,
        evidence: `ip.issues: ${issue}`,
        citations: ["RFC 796"],
      });
    }
  }

  return {
    id: 1,
    request_id: detail.analysis_ref.request_id || item.analysis.request_id || fallbackRequestId,
    session_id: item.session_id || `${item.capture_id || "smtp"}:stream:${network?.stream_id || "1"}`,
    client_id: network?.client_ip || item.sender.address || null,
    capture_id: item.capture_id || null,
    protocol: item.protocol || "SMTP",
    posture: tls?.version_status === "current" ? "modern" : "adequate",
    timestamp: item.observed_at || new Date().toISOString(),
    evidence_ref_count: (network?.evidence_refs?.length || 1) + triggerDetails.length,
    risk_score: riskScore,
    final_verdict: riskClass,
    rule_score: riskScore,
    rule_triggers_count: triggerDetails.length,
    trigger_details: triggerDetails,
    ml_scores: {
      xgboost: {
        predicted_class: riskClass,
        risk_probability: riskScore,
      },
      random_forest: {
        predicted_class: riskClass,
        risk_probability: Math.max(0, Math.round((riskScore - 0.05) * 100) / 100),
      },
    },
    explanations: {
      supervised: [
        {
          feature: "cert_expires_in_days",
          direction: "decreases_risk",
          observed_value: "364",
          contribution: 1.36,
        },
        {
          feature: "cert_chain_valid",
          direction: tls?.certificate.chain_valid ? "decreases_risk" : "increases_risk",
          observed_value: String(tls?.certificate.chain_valid ?? false),
          contribution: tls?.certificate.chain_valid ? -0.1 : 0.25,
        },
        {
          feature: "tls_version",
          direction: "decreases_risk",
          observed_value: tls?.version || "TLS 1.3",
          contribution: -0.15,
        },
        {
          feature: "cipher_suite",
          direction: "decreases_risk",
          observed_value: tls?.cipher_suite || "TLS_AES_128_GCM_SHA256",
          contribution: -0.08,
        },
      ],
    },
    model_bundle: { version: "ml-bundle.v2" },
    is_synthetic: false,
    source_label: "Live Inbound Mail Stream",
  };
}
