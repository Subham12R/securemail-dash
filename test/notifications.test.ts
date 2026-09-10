import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSystemAlertPayload,
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
