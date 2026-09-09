import test from "node:test";
import assert from "node:assert/strict";
import { getAvailableReports, formatFileSize } from "../lib/reports-data.ts";

test("getAvailableReports returns formatted report list with metadata", () => {
  const reports = getAvailableReports();
  assert.ok(reports.length >= 3);
  assert.equal(reports[0].format, "PDF");
  assert.equal(reports[0].status, "READY");
  assert.ok(reports[0].findingsCount > 0);
});

test("formatFileSize formats bytes to human readable sizes", () => {
  assert.equal(formatFileSize(1024), "1.0 KB");
  assert.equal(formatFileSize(2.4 * 1024 * 1024), "2.4 MB");
  assert.equal(formatFileSize(500), "500 B");
});
