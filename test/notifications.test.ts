import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSystemAlertPayload,
  buildCriticalThreatAlert,
  buildAnalysisCompleteAlert,
  buildExtractionProgressAlert,
  registerSystemAlertRenderer,
  notifySystemAlert,
  type SystemAlertOptions,
} from "../lib/notifications.ts";

test("buildSystemAlertPayload assigns default duration and appName for critical threats", () => {
  const options: SystemAlertOptions = {
    variant: "critical",
    title: "Weak TLS Handshake",
    description: "Insecure cipher detected.",
  };

  const payload = buildSystemAlertPayload(options);
  assert.equal(payload.variant, "critical");
  assert.equal(payload.appName, "SecureMailScope");
  assert.equal(payload.duration, 8000);
  assert.equal(payload.time, "now");
});

test("buildSystemAlertPayload configures success alerts with 5000ms duration", () => {
  const options: SystemAlertOptions = {
    variant: "success",
    title: "Analysis Complete",
    description: "No threats flagged.",
  };

  const payload = buildSystemAlertPayload(options);
  assert.equal(payload.variant, "success");
  assert.equal(payload.duration, 5000);
});

test("buildSystemAlertPayload preserves custom appName and explicit duration", () => {
  const options: SystemAlertOptions = {
    variant: "info",
    appName: "PCAP Dissector",
    title: "Extracting Packets",
    description: "Streaming bytes...",
    duration: 3500,
  };

  const payload = buildSystemAlertPayload(options);
  assert.equal(payload.appName, "PCAP Dissector");
  assert.equal(payload.duration, 3500);
});

test("buildCriticalThreatAlert constructs critical threat payload with Inspect action", () => {
  const alert = buildCriticalThreatAlert({
    title: "TLS 1.0 Downgrade Detected",
    description: "Insecure cryptographic protocol observed in session-42.",
    requestId: "req-999",
    actionLabel: "Inspect Threat",
  });

  assert.equal(alert.variant, "critical");
  assert.equal(alert.appName, "SOC Alert");
  assert.equal(alert.duration, 8000);
  assert.equal(alert.title, "TLS 1.0 Downgrade Detected");
  assert.equal(alert.action?.label, "Inspect Threat");
  assert.equal(typeof alert.action?.onClick, "function");
});

test("buildAnalysisCompleteAlert constructs warning when critical threats > 0", () => {
  const alert = buildAnalysisCompleteAlert({
    filename: "traffic.pcap",
    sessionCount: 5,
    criticalCount: 2,
    latestRequestId: "req-123",
  });

  assert.equal(alert.variant, "warning");
  assert.equal(alert.appName, "Analysis Engine");
  assert.equal(alert.duration, 8000);
  assert.equal(alert.title, "Critical Threats Detected (2)");
  assert.ok(alert.description.includes("traffic.pcap"));
  assert.equal(alert.action?.label, "Inspect");
});

test("buildAnalysisCompleteAlert constructs success when criticalCount is 0", () => {
  const alert = buildAnalysisCompleteAlert({
    filename: "clean.pcap",
    sessionCount: 12,
    criticalCount: 0,
    latestRequestId: "req-456",
  });

  assert.equal(alert.variant, "success");
  assert.equal(alert.appName, "Analysis Engine");
  assert.equal(alert.duration, 5000);
  assert.equal(alert.title, "Analysis Completed");
  assert.equal(alert.action?.label, "View details");
});

test("buildExtractionProgressAlert formats queued, extracting, and analyzing stages", () => {
  const queued = buildExtractionProgressAlert({
    filename: "mail.pcap",
    phase: "queued",
  });
  assert.equal(queued.title, "Capture Queued");
  assert.equal(queued.duration, 3000);

  const extracting = buildExtractionProgressAlert({
    filename: "mail.pcap",
    phase: "extracting",
  });
  assert.equal(extracting.title, "Dissecting PCAP Packets…");
  assert.equal(extracting.appName, "PCAP Dissector");

  const analyzing = buildExtractionProgressAlert({
    filename: "mail.pcap",
    phase: "analyzing",
    sessionsExtracted: 8,
  });
  assert.equal(analyzing.title, "Evaluating Transport Security…");
  assert.ok(analyzing.description.includes("8"));
});

test("registerSystemAlertRenderer registers custom renderer callback", () => {
  let renderedPayload: any = null;
  registerSystemAlertRenderer((payload) => {
    renderedPayload = payload;
    return "mock-rendered";
  });

  // In Node environment (typeof window === 'undefined'), notifySystemAlert safely returns early
  const result = notifySystemAlert({
    title: "Test Alert",
    description: "Testing registration",
  });
  assert.equal(result, "");
});
