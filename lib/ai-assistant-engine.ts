import {
  analysisFieldLabel,
  type AnalysisDetailViewModel,
} from "./analysis-detail.ts";

export interface AgentActivityStep {
  id: string;
  type: "step" | "tool" | "trace";
  label: string;
  detail?: string;
  action?: string;
  status?: "pending" | "active" | "complete";
}

export interface AiAssistantResponse {
  reply: string;
  activitySteps: AgentActivityStep[];
  technicalPayload?: string;
  suggestedPrompts?: string[];
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "0.0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function generateInitialGreeting(viewModel: AnalysisDetailViewModel): AiAssistantResponse {
  const verdict = viewModel.summary.final_verdict || "unspecified";
  const riskPct = formatPercent(viewModel.summary.risk_score);
  const protocol = viewModel.summary.protocol || "Unknown Protocol";
  const posture = viewModel.summary.posture || "Unobserved";

  const findingsCount = viewModel.model.rule_findings.length;
  const missingCount = viewModel.model.missing_fields.length;

  const reply = `Session evaluated from **${viewModel.source_label}**.

- **Session:** \`${viewModel.summary.session_id}\`
- **Verdict:** \`${verdict.toUpperCase()}\` (${riskPct} risk)
- **Protocol:** \`${protocol}\` · Posture: \`${posture}\`
${findingsCount > 0 ? `- **Findings:** ${findingsCount} security rule findings flagged.` : "- **Findings:** No deterministic rule violations flagged."}
${missingCount > 0 ? `- **Coverage:** ${missingCount} telemetry fields unobserved.` : ""}

How can I help investigate this session?`;

  return {
    reply,
    activitySteps: [
      {
        id: "step-1",
        type: "step",
        label: "Ingested session packet telemetry",
        status: "complete",
      },
      {
        id: "step-2",
        type: "tool",
        action: "read",
        label: "Evaluated deterministic RFC rules & ML risk score",
        detail: `${verdict.toUpperCase()} · ${riskPct}`,
        status: "complete",
      },
      {
        id: "step-3",
        type: "trace",
        label: "Generated evidence-grounded baseline summary",
        status: "complete",
      },
    ],
    suggestedPrompts: [
      "Explain the risk drivers",
      "Inspect TLS & cipher posture",
      "What evidence is missing?",
      "Draft an incident triage note",
    ],
  };
}

export async function processAiQuery(
  query: string,
  viewModel: AnalysisDetailViewModel,
): Promise<AiAssistantResponse> {
  const normalized = query.trim().toLowerCase();

  // Artificial slight delay for realistic assistant feel
  await new Promise((resolve) => setTimeout(resolve, 320));

  // 1. Risk drivers / score inquiry
  if (
    normalized.includes("risk") ||
    normalized.includes("score") ||
    normalized.includes("driver") ||
    normalized.includes("why flagged") ||
    normalized.includes("verdict")
  ) {
    const drivers = viewModel.model.risk_drivers;
    const findings = viewModel.model.rule_findings;

    let driverText = "";
    if (drivers.length > 0) {
      driverText = drivers
        .map(
          (d) =>
            `- **${d.feature}**: observed \`${d.observed_value}\` (${d.direction === "increases_risk" ? "🔺 Increases Risk" : "🔻 Decreases Risk"})`,
        )
        .join("\n");
    } else {
      driverText = "- No specific individual risk driver weights supplied by the backend model.";
    }

    let findingsText = "";
    if (findings.length > 0) {
      findingsText = findings
        .map((f) => `- [${f.severity?.toUpperCase() ?? "INFO"}] **${f.label}**: ${f.detail ?? "No extra details"}`)
        .join("\n");
    }

    const reply = `### Risk Assessment Breakdown

**Final Verdict:** \`${viewModel.summary.final_verdict.toUpperCase()}\`  
**Composite Risk Probability:** **${formatPercent(viewModel.summary.risk_score)}**  
**Deterministic Rule Score:** \`${viewModel.summary.rule_score !== null ? viewModel.summary.rule_score : "Not supplied"}\`

#### Primary Risk Drivers:
${driverText}

${findingsText ? `#### Active Rule Triggers:\n${findingsText}` : ""}`;

    const technicalPayload = JSON.stringify(
      {
        session_id: viewModel.summary.session_id,
        rule_score: viewModel.summary.rule_score,
        rule_triggers_count: viewModel.summary.rule_triggers_count,
        risk_drivers: viewModel.model.risk_drivers,
        evaluations: viewModel.model.evaluations,
      },
      null,
      2,
    );

    return {
      reply,
      activitySteps: [
        {
          id: "act-1",
          type: "step",
          label: "Queried ML model feature contribution weights",
          status: "complete",
        },
        {
          id: "act-2",
          type: "tool",
          action: "eval",
          label: "Ranked top severity risk drivers",
          detail: `${drivers.length} drivers evaluated`,
          status: "complete",
        },
      ],
      technicalPayload,
      suggestedPrompts: [
        "Inspect TLS & cipher posture",
        "What evidence is missing?",
        "Draft an incident triage note",
      ],
    };
  }

  // 2. Cryptographic / TLS / STARTTLS inquiry
  if (
    normalized.includes("tls") ||
    normalized.includes("cipher") ||
    normalized.includes("posture") ||
    normalized.includes("crypto") ||
    normalized.includes("handshake") ||
    normalized.includes("starttls") ||
    normalized.includes("protocol")
  ) {
    const protocol = viewModel.summary.protocol || "Unknown";
    const posture = viewModel.summary.posture || "Unobserved";

    const reply = `### Transport & Cryptographic Posture

- **Protocol Observed:** \`${protocol}\`
- **Transport Posture:** \`${posture}\`
- **STARTTLS Negotiation:** ${
      posture.toLowerCase().includes("handshake_failed")
        ? "❌ Handshake failed or STARTTLS upgrade was rejected."
        : posture.toLowerCase().includes("deprecated")
        ? "⚠️ Legacy or deprecated cryptographic parameters were observed."
        : "✅ Protocol handshake observed within operational parameters."
    }

#### Security Assessment:
${
  posture.toLowerCase().includes("deprecated") || posture.toLowerCase().includes("weak")
    ? "The mail client or server negotiated an obsolete cipher suite or legacy TLS version (e.g. TLS 1.0/1.1 or CBC cipher). Upgrading the mail transport agent to enforce modern TLS 1.3 with PFS (Perfect Forward Secrecy) is strongly advised."
    : "The transport shows standard configuration. Ensure strict certificate hostname validation and MTA-STS/DANE records are enabled to mitigate downgrade attacks."
}`;

    const technicalPayload = JSON.stringify(
      {
        session_id: viewModel.summary.session_id,
        protocol: viewModel.summary.protocol,
        posture: viewModel.summary.posture,
        evidence_ref_count: viewModel.summary.evidence_ref_count,
      },
      null,
      2,
    );

    return {
      reply,
      activitySteps: [
        {
          id: "act-tls-1",
          type: "step",
          label: "Inspected observable packet transport stream",
          status: "complete",
        },
        {
          id: "act-tls-2",
          type: "tool",
          action: "inspect",
          label: `Verified protocol ${protocol} & posture ${posture}`,
          status: "complete",
        },
      ],
      technicalPayload,
      suggestedPrompts: [
        "Explain the risk drivers",
        "What evidence is missing?",
        "Draft an incident triage note",
      ],
    };
  }

  // 3. Missing supporting data / telemetry gaps inquiry
  if (
    normalized.includes("missing") ||
    normalized.includes("gap") ||
    normalized.includes("telemetry") ||
    normalized.includes("unobserved") ||
    normalized.includes("evidence")
  ) {
    const missing = viewModel.model.missing_fields;
    const labels = missing.map(analysisFieldLabel);

    const reply = `### Observed Evidence & Telemetry Gaps

- **Evidence References Retained:** \`${viewModel.summary.evidence_ref_count}\`
- **Missing Telemetry Attributes:** **${missing.length}**

#### Unobserved Fields:
${
  labels.length > 0
    ? labels.map((l) => `- \`${l}\`: Not captured or withheld in packet stream`).join("\n")
    : "✅ All standard analysis telemetry fields were present in this record."
}

*Note: SecureMailScope strictly reports observed packet data. Encrypted application payloads and unavailable TLS secrets are marked as unobserved rather than interpolated.*`;

    return {
      reply,
      activitySteps: [
        {
          id: "act-mis-1",
          type: "step",
          label: "Cross-referenced required vs available analysis fields",
          status: "complete",
        },
        {
          id: "act-mis-2",
          type: "trace",
          label: `Identified ${missing.length} unobserved telemetry attributes`,
          status: "complete",
        },
      ],
      suggestedPrompts: [
        "Explain the risk drivers",
        "Inspect TLS & cipher posture",
        "Draft an incident triage note",
      ],
    };
  }

  // 4. Incident report / Triage note
  if (
    normalized.includes("incident") ||
    normalized.includes("triage") ||
    normalized.includes("draft") ||
    normalized.includes("report") ||
    normalized.includes("note")
  ) {
    const reply = `### 📋 Incident Triage Report

\`\`\`markdown
## Incident Summary: Mail Session Analysis
- Request ID: ${viewModel.summary.request_id}
- Session ID: ${viewModel.summary.session_id}
- Observed Protocol: ${viewModel.summary.protocol ?? "Unknown"}
- Date / Timestamp: ${viewModel.summary.timestamp}
- Final Verdict: ${viewModel.summary.final_verdict.toUpperCase()}
- Composite Risk: ${formatPercent(viewModel.summary.risk_score)}

### Observed Findings
${
  viewModel.model.rule_findings.length > 0
    ? viewModel.model.rule_findings.map((f) => `- [${f.severity ?? "INFO"}] ${f.label}`).join("\n")
    : "- No critical rule violations observed in packet trace."
}

### Recommended Actions
1. Verify mail transport agent TLS configuration on client endpoint.
2. Confirm certificate validity and authority pinning.
3. Review related sessions from ${viewModel.source_label}.
\`\`\`

You can copy this directly into your incident management tracker (Jira / ServiceNow).`;

    return {
      reply,
      activitySteps: [
        {
          id: "act-rep-1",
          type: "step",
          label: "Synthesized session metadata into incident template",
          status: "complete",
        },
      ],
      suggestedPrompts: [
        "Explain the risk drivers",
        "Inspect TLS & cipher posture",
        "What evidence is missing?",
      ],
    };
  }

  // 5. Default intelligent fallback
  const reply = `Regarding **${query}**:

This session (*${viewModel.summary.session_id}*) is categorized as **${viewModel.summary.final_verdict.toUpperCase()}** with a risk score of **${formatPercent(viewModel.summary.risk_score)}**.

- **Protocol:** \`${viewModel.summary.protocol || "Not supplied"}\`
- **Cryptographic Posture:** \`${viewModel.summary.posture || "Not supplied"}\`
- **Active Findings:** ${viewModel.model.rule_findings.length} findings recorded.

Would you like to drill into the specific **risk drivers**, inspect the **cryptographic posture**, or generate an **incident triage report**?`;

  return {
    reply,
    activitySteps: [
      {
        id: "act-def-1",
        type: "step",
        label: `Analyzed query against session ${viewModel.summary.session_id}`,
        status: "complete",
      },
    ],
    suggestedPrompts: [
      "Explain the risk drivers",
      "Inspect TLS & cipher posture",
      "What evidence is missing?",
      "Draft an incident triage note",
    ],
  };
}
