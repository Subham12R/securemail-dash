import test from "node:test";
import assert from "node:assert/strict";
import { generateForensicPdfReport } from "../lib/pdf-report-generator.ts";
import type { AnalysisDetailViewModel } from "../lib/analysis-detail.ts";

test("generateForensicPdfReport creates valid PDF instance with pages", () => {
  const mockViewModel: AnalysisDetailViewModel = {
    source: "analysed_pcap",
    source_label: "Observed PCAP",
    summary_text: "Summary of analysis",
    summary: {
      request_id: "req-test-12345",
      session_id: "ses-test-999",
      capture_id: "cap-1",
      client_id: "client-abc",
      protocol: "SMTP",
      posture: "deprecated",
      timestamp: "2026-09-09T22:00:00Z",
      final_verdict: "malicious",
      risk_score: 0.85,
      rule_score: 0.9,
      evidence_ref_count: 2,
      rule_triggers_count: 2,
      is_synthetic: false,
    },
    model: {
      evaluations: [
        { model: "XGBoost", prediction: "Malicious", risk_probability: 0.91 },
        { model: "Random forest", prediction: "Malicious", risk_probability: 0.88 },
      ],
      risk_drivers: [
        { feature: "TLS Version", observed_value: "TLS 1.0", contribution: 0.45, direction: "increases_risk" },
      ],
      rule_findings: [
        {
          label: "Deprecated TLS Version",
          severity: "high",
          detail: "TLS 1.0 was negotiated on port 587",
          evidence: "Client Hello version 0x0301",
          citations: ["RFC 8996", "NIST SP 800-52r2"],
        },
      ],
      missing_fields: [],
    },
    inbox: {
      state: "unavailable",
      detail: null,
      reason: "PCAP record without inbox mapping",
    },
  };

  const doc = generateForensicPdfReport(mockViewModel);
  assert.ok(doc);
  assert.ok(doc.getNumberOfPages() >= 1);

  const pdfOutput = doc.output("arraybuffer");
  assert.ok(pdfOutput.byteLength > 1000);
});
