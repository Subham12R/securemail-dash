import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeInboxApiDetail,
  normalizeInboxApiList,
} from "../lib/inbox-external.ts";

const rawEmail = {
  id: "mail-1",
  email_id: "smtp-1",
  received_at: "2026-09-09T17:12:12.232Z",
  stream: {
    StreamID: 1,
    StreamKey: "203.0.113.10:49896 → 198.51.100.20:25",
    ClientIP: "203.0.113.10",
    ClientPort: 49896,
    ServerIP: "198.51.100.20",
    ServerPort: 25,
    StartTime: "2026-09-09T17:12:12.027Z",
    EndTime: "2026-09-09T17:12:14.027Z",
    DurationMs: 2000,
    TotalPackets: 12,
    ClientBytes: 9648,
    ServerBytes: 1896,
    HasSTARTTLS: true,
    Completed: true,
    TLS: {
      Version: "TLS 1.3",
      CipherSuite: "TLS_AES_128_GCM_SHA256",
      ClientSupportedVersions: ["TLS 1.3", "TLS 1.2"],
      ClientSupportedGroups: ["x25519"],
    },
  },
  email: {
    ID: "smtp-1",
    ReceivedAt: "2026-09-09T17:12:12.232Z",
    EnvelopeFrom: "sender@example.com",
    EnvelopeTo: ["recipient@example.com"],
    Headers: {
      MessageID: "<message@example.com>",
      Date: "Wed, 9 Sep 2026 17:12:12 GMT",
      From: [{ Name: "Sender", Address: "sender@example.com" }],
      To: [{ Address: "recipient@example.com" }],
      Subject: "A captured message",
      DKIM: "v=1; d=example.com;",
      Custom: { "X-Test": "safe header" },
    },
    TextBody: "Bounded message text",
    HTMLBody: "<script>do not render this</script>",
    RawBody: "RAW BODY MUST NOT LEAK",
    Size: 128,
  },
  analysis: {
    Risk: {
      Score: 86,
      Level: "high",
      Flagged: true,
      Indicators: [{ Category: "IP", Description: "Test finding", Level: "high" }],
    },
    IP: {
      IP: "203.0.113.10",
      IPInfo: {
        Hosting: true,
        Proxy: false,
        ISP: "Example ISP",
        Org: "Example Org",
        ReverseDNS: "mail.example.test",
        Country: "United States",
        City: "Austin",
      },
      Spamhaus: { Listed: false },
      Fraud: { Score: 12, Level: "low", Source: "composite" },
      Issues: ["Test IP issue"],
    },
    Auth: {
      SPF: { Result: "fail", Details: "failed" },
      DKIM: { Result: "neutral", Details: "not verified" },
      DMARC: { Result: "pass", Details: "passed" },
    },
    TLS: {
      Secure: true,
      Version: "TLS 1.3",
      VersionStatus: "current",
      Warnings: ["Test TLS warning"],
      CipherSuite: "TLS_AES_128_GCM_SHA256",
      ForwardSecrecy: true,
      CertificatePinning: false,
    },
    TCP: {
      Flags: { SYN: true, ACK: false, RST: "ok" },
      PacketRatio: 1,
      AvgPacketSize: 100,
      Anomalies: [],
    },
    Headers: { FromAddress: "sender@example.com", HopCount: 1 },
    Content: { HasHTTPLinks: false, LinkCount: 0 },
    Message: "Test analysis",
  },
  ai: {
    status: "complete",
    request_id: "request-1",
    response: {
      session: {
        session_id: "session-1",
        protocol: "SMTP",
        source_type: "authorized_capture",
        observations: {
          starttls_advertised: true,
          cert_present: true,
          cert_expired: false,
          cert_chain_valid: true,
          hostname_mismatch: false,
          cert_key_algorithm: "RSA",
          cert_key_length_bits: 2048,
          signature_algorithm: "RSA-PSS",
        },
      },
    },
  },
  flagged: true,
  risk_score: 86,
  risk_level: "high",
  from: [{ Name: "Sender", Address: "sender@example.com" }],
  to: [{ Address: "recipient@example.com" }],
  subject: "A captured message",
};

test("normalizes the live inbox list into the existing contract", () => {
  const response = normalizeInboxApiList(
    { success: true, data: [rawEmail], meta: { total: 1, page: 1, limit: 20 } },
    { skip: 0, limit: 20 },
  );

  assert.equal(response.source, "live");
  assert.equal(response.total, 1);
  assert.equal(response.items[0]?.mail_item_id, "mail-1");
  assert.equal(response.items[0]?.sender.address, "sender@example.com");
  assert.equal(response.items[0]?.triage_state, "flagged");
  assert.equal(response.items[0]?.analysis.risk_score, 0.86);
  assert.equal(response.items[0]?.analysis.request_id, "request-1");
});

test("treats an explicit empty live inbox as an empty list", () => {
  const response = normalizeInboxApiList(
    { success: true, data: null, meta: { total: 0, page: 1, limit: 20 } },
    { skip: 0, limit: 20 },
  );

  assert.equal(response.total, 0);
  assert.deepEqual(response.items, []);
  assert.deepEqual(response.counts, { all: 0, flagged: 0, healthy: 0 });
});

test("keeps HTML-only content bounded for direct preview embedding", () => {
  const html = `<p>Hello &#x110000; &amp; welcome</p>${"x".repeat(50_000)}`;
  const detail = normalizeInboxApiDetail({
    success: true,
    data: {
      ...rawEmail,
      email: {
        ...rawEmail.email,
        TextBody: undefined,
        HTMLBody: html,
      },
    },
  });

  assert.equal(detail.content.data?.format, "html");
  assert.equal(detail.content.data?.html?.startsWith("<p>Hello"), true);
  assert.equal(detail.content.data?.html?.length, 12_000);
  assert.equal(detail.content.data?.text.startsWith("Hello"), true);
  assert.equal(detail.content.data?.truncated, true);
});

test("normalizes live detail while withholding unbounded raw message data", () => {
  const detail = normalizeInboxApiDetail({ success: true, data: rawEmail });

  assert.equal(detail.source, "live");
  assert.equal(detail.email.data?.message_id, "<message@example.com>");
  assert.equal(detail.content.data?.format, "html");
  assert.equal(detail.content.data?.html, "<script>do not render this</script>");
  assert.equal(detail.content.data?.text, "Bounded message text");
  assert.equal(detail.network.data?.packet_count, 12);
  assert.equal(detail.network.data?.ip_reputation?.address, "203.0.113.10");
  assert.equal(detail.network.data?.ip_reputation?.spamhaus_listed, false);
  assert.equal(detail.network.data?.ip_reputation?.quality_score, 12);
  assert.equal(detail.network.data?.ip_reputation?.quality_source, "composite");
  assert.equal(detail.network.data?.ip_reputation?.hosting, true);
  assert.deepEqual(detail.network.data?.ip_reputation?.issues, ["Test IP issue"]);
  assert.deepEqual(detail.network.data?.tcp_flags, {
    SYN: "present",
    ACK: "absent",
    RST: "present",
  });
  assert.equal(detail.tls.data?.starttls_advertised, true);
  assert.equal(detail.tls.data?.certificate.present, true);
  assert.equal(detail.tls.data?.certificate.expired, false);
  assert.equal(detail.tls.data?.certificate.chain_valid, true);
  assert.equal(detail.tls.data?.certificate.key_algorithm, "RSA");
  assert.equal(detail.tls.data?.certificate.key_length_bits, 2048);
  assert.equal(detail.tls.data?.certificate.signature_algorithm, "RSA-PSS");
  assert.equal(detail.tls.data?.version, "TLS 1.3");
  assert.equal(detail.tls.data?.version_status, "current");
  assert.deepEqual(detail.tls.data?.warnings, ["Test TLS warning"]);
  assert.equal(detail.headers.data?.authentication.spf, "fail");
  assert.equal(detail.analysis_ref.request_id, "request-1");
  assert.equal(JSON.stringify(detail).includes("RAW BODY MUST NOT LEAK"), false);
});
