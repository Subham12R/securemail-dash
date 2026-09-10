import test from "node:test";
import assert from "node:assert/strict";
import { buildCertificatesSummary } from "../lib/certificates-data.ts";
import type { AnalysisRecord } from "../lib/securemail-api.ts";
import type { TmpVaultEmail } from "../lib/tmpvault-api.ts";

function createMockRecord(partial: Partial<AnalysisRecord>): AnalysisRecord {
  return {
    id: 1,
    request_id: "req-1",
    session_id: "ses-1",
    client_id: "client-1",
    capture_id: "cap-1",
    protocol: "SMTP",
    posture: "modern",
    timestamp: "2026-09-09T20:00:00Z",
    evidence_ref_count: 0,
    risk_score: 0.1,
    final_verdict: "benign",
    rule_score: null,
    rule_triggers_count: 0,
    trigger_details: [],
    ml_scores: {},
    explanations: {},
    model_bundle: {},
    is_synthetic: false,
    source_label: null,
    ...partial,
    record_count: partial.record_count ?? 1,
    tls_details: partial.tls_details ?? null,
    certificate_details: partial.certificate_details ?? null,
  };
}

test("buildCertificatesSummary extracts real certificates from tmpvault email payload", () => {
  const records = [createMockRecord({ id: 1 })];
  const tmpVaultEmails: TmpVaultEmail[] = [
    {
      id: "email-1",
      from: "sender@example.com",
      to: ["rcpt@tmpvault.com"],
      subject: "Test email",
      risk_score: 33,
      risk_level: "low",
      analysis: {
        TLS: {
          Secure: true,
          Version: "TLS 1.3",
          VersionStatus: "current",
          CipherSuite: "TLS_AES_128_GCM_SHA256",
          CipherStrength: "strong",
          ForwardSecrecy: true,
          CertificatePinning: false,
          Warnings: ["TLS certificate chain is not trusted/complete"],
          Certificate: {
            Present: true,
            Subject: "CN=vmi3425950,O=SecureMailServer",
            Issuer: "CN=vmi3425950,O=SecureMailServer",
            NotBefore: "2026-09-09T14:48:36Z",
            NotAfter: "2027-09-09T14:48:36Z",
            Valid: true,
            Expired: false,
            ExpiresInDays: 364,
            ChainValid: false,
            HostnameMismatch: false,
            KeyAlgorithm: "ECDSA",
            KeyLengthBits: 256,
            SignatureAlgorithm: "SHA256-ECDSA",
            DNSNames: ["vmi3425950", "localhost"],
          },
        },
      },
    },
  ];

  const summary = buildCertificatesSummary(records, tmpVaultEmails);
  assert.equal(summary.totalCertificates, 1);
  assert.equal(summary.invalidCount, 1);
  assert.equal(summary.validCount, 0);

  const cert = summary.certificates[0];
  assert.equal(cert.domain, "vmi3425950, localhost");
  assert.equal(cert.status, "INVALID");
  assert.equal(cert.keyAlgorithm, "ECDSA 256 bit");
  assert.equal(cert.chain.length, 2);
  assert.equal(cert.chain[0].level, "root");
  assert.equal(cert.chain[1].level, "leaf");
});
