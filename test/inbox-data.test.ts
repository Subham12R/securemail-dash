import test from "node:test";
import assert from "node:assert/strict";
import {
  filterInboxItems,
  getInboxDataSource,
  parseInboxListResponse,
  type InboxListResponse,
} from "../lib/inbox-data.ts";

test("fixture source returns the reference inbox counts and rows", async () => {
  const page = await getInboxDataSource().list({ skip: 0, limit: 12 });

  assert.equal(page.schema_version, "inbox-list.v1");
  assert.equal(page.total, 12);
  assert.deepEqual(page.counts, { all: 12, flagged: 5, healthy: 7 });
  assert.equal(page.items.length, 12);
  assert.equal(page.items[0]?.mail_item_id, "inbox-item-flagged-1");
});

test("fixture detail contains every reference tab and a separate analysis link", async () => {
  const detail = await getInboxDataSource().detail("inbox-item-flagged-1");

  assert.ok(detail);
  assert.equal(detail.schema_version, "inbox-detail.v1");
  assert.equal(detail.email.state, "available");
  assert.equal(detail.headers.state, "available");
  assert.equal(detail.content.state, "available");
  assert.equal(detail.network.state, "available");
  assert.equal(detail.tls.state, "available");
  assert.equal(detail.analysis_ref.request_id, "req-inbox-flagged-1");
});

test("local inbox filters use backend-provided triage state", async () => {
  const page = await getInboxDataSource().list({ skip: 0, limit: 200 });

  assert.equal(filterInboxItems(page.items, "all").length, 12);
  assert.equal(filterInboxItems(page.items, "flagged").length, 5);
  assert.equal(filterInboxItems(page.items, "healthy").length, 7);
});

test("normalized list validation rejects malformed upstream data without echoing it", () => {
  const valid: InboxListResponse = {
    schema_version: "inbox-list.v1",
    total: 0,
    skip: 0,
    limit: 12,
    counts: { all: 0, flagged: 0, healthy: 0 },
    items: [],
  };

  assert.deepEqual(parseInboxListResponse(valid), valid);

  assert.throws(
    () =>
      parseInboxListResponse({
        ...valid,
        schema_version: "wrong",
        payload: "do not echo this",
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "Invalid Inbox response" &&
      !error.message.includes("do not echo this"),
  );
});

test("fixture detail preserves explicit unavailable and redacted sections", async () => {
  const unavailable = await getInboxDataSource().detail("inbox-item-healthy-6");
  const redacted = await getInboxDataSource().detail("inbox-item-flagged-5");

  assert.ok(unavailable);
  assert.equal(unavailable.content.state, "unavailable");
  assert.equal(unavailable.content.data, null);
  assert.equal(unavailable.content.reason, "The capture did not expose message content.");

  assert.ok(redacted);
  assert.equal(redacted.headers.state, "redacted");
  assert.equal(redacted.headers.data, null);
  assert.equal(redacted.headers.reason, "The source withheld unrestricted headers.");
});
