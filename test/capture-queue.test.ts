import test from "node:test";
import assert from "node:assert/strict";
import {
  getQueueProgress,
  restoreQueue,
  serializeQueue,
  type CaptureQueueItem,
} from "../lib/capture-queue.ts";

test("uses measured upload bytes while uploading", () => {
  const item = {
    phase: "uploading",
    uploadProgress: 42,
    analyzedCount: 0,
    sessionCount: 0,
  } as CaptureQueueItem;

  assert.deepEqual(getQueueProgress(item), {
    label: "Uploading",
    value: 42,
    determinate: true,
  });
});

test("does not invent extraction progress while queued", () => {
  const item = {
    phase: "queued",
    uploadProgress: null,
    analyzedCount: 0,
    sessionCount: 0,
  } as CaptureQueueItem;

  assert.deepEqual(getQueueProgress(item), {
    label: "Waiting for worker",
    value: null,
    determinate: false,
  });
});

test("does not mark extraction determinate without API telemetry", () => {
  const item = {
    phase: "extracting",
    uploadProgress: null,
    job: null,
    analyzedCount: 0,
    sessionCount: 0,
  } as CaptureQueueItem;

  assert.deepEqual(getQueueProgress(item), {
    label: "Extracting",
    value: null,
    determinate: false,
  });
});

test("uses analyzed sessions after extraction", () => {
  const item = {
    phase: "analyzing",
    uploadProgress: null,
    analyzedCount: 2,
    sessionCount: 8,
  } as CaptureQueueItem;

  assert.deepEqual(getQueueProgress(item), {
    label: "Analyzing",
    value: 25,
    determinate: true,
  });
});

test("persistence strips files and restores accepted metadata", () => {
  const item = {
    id: "pcap-abc",
    jobId: "pcap-abc",
    filename: "mail.pcap",
    size: 12,
    phase: "extracting",
    uploadProgress: 100,
    analyzedCount: 0,
    sessionCount: 0,
    job: null,
    error: null,
    updatedAt: 1,
    file: new File(["secret"], "mail.pcap"),
  } as CaptureQueueItem;

  const restored = restoreQueue(serializeQueue([item]));
  assert.equal(restored[0]?.file, undefined);
  assert.equal(restored[0]?.jobId, "pcap-abc");
});
