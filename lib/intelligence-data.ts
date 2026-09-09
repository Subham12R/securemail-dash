export type RiskClassification = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IntelligenceAssessment {
  id: string;
  title: string;
  badge: string;
  severity: RiskClassification;
  timestamp: string;
  riskLevel: RiskClassification;
  confidence: number;
  affectedSessions: number;
  assessment: string;
  contributingFactors: string[];
  recommendation: string;
}

export interface IntelligenceSummary {
  riskClassification: RiskClassification;
  modelConfidence: number;
  anomalousSessions: number;
  totalSessions: number;
  priorityItems: number;
  assessments: IntelligenceAssessment[];
}

export function getIntelligenceSummary(): IntelligenceSummary {
  return {
    riskClassification: "MEDIUM",
    modelConfidence: 91,
    anomalousSessions: 4,
    totalSessions: 35,
    priorityItems: 3,
    assessments: [
      {
        id: "intel-01",
        title: "Overall Risk Classification",
        badge: "Risk Classification",
        severity: "MEDIUM",
        timestamp: "31/08/2026, 21:00:00",
        riskLevel: "MEDIUM",
        confidence: 91,
        affectedSessions: 7,
        assessment:
          "The majority of sessions use modern TLS configurations. However, 3 sessions exhibit deprecated protocols and weak ciphers, primarily associated with legacy mail infrastructure.",
        contributingFactors: [
          "3 sessions using TLS 1.0",
          "3 sessions without forward secrecy",
          "1 expired certificate",
          "1 unusual handshake behavior",
        ],
        recommendation:
          "Prioritize remediation of the legacy POP3 and SMTP servers using deprecated configurations.",
      },
      {
        id: "intel-02",
        title: "Unusual TLS Behavior Detected",
        badge: "Anomaly Detection",
        severity: "MEDIUM",
        timestamp: "31/08/2026, 21:01:00",
        riskLevel: "MEDIUM",
        confidence: 78,
        affectedSessions: 1,
        assessment:
          "TLS handshake patterns in session SES-0017 deviate from the observed baseline for mail.example.com. The handshake took 256ms vs. the typical 184ms, with a different cipher negotiation pattern.",
        contributingFactors: [
          "Handshake duration 39% longer than baseline",
          "Cipher negotiation pattern differs from historical baseline",
          "Non-standard client extensions present in Client Hello",
        ],
        recommendation:
          "Inspect session SES-0017 packet capture to verify if client renegotiation or network jitter was the root cause.",
      },
    ],
  };
}
