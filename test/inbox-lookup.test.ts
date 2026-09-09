import test from "node:test";
import assert from "node:assert/strict";
import {
  findInboxDetailByRequestId,
  type InboxLookupSource,
} from "../lib/inbox-lookup.ts";
import { getInboxDataSource } from "../lib/inbox-data.ts";

const fixture = getInboxDataSource();

test("resolves only the Inbox item with the exact analysis request ID", async () => {
  let requestedItem: string | null = null;
  const source: InboxLookupSource = {
    async list() {
      const page = await fixture.list({ skip: 0, limit: 200 });
      return {
        ...page,
        items: [
          {
            ...page.items[0],
            analysis: { ...page.items[0].analysis, request_id: "request-7" },
          },
        ],
      };
    },
    async detail(itemId) {
      requestedItem = itemId;
      const detail = await fixture.detail(itemId);
      return detail
        ? {
            ...detail,
            item: {
              ...detail.item,
              analysis: { ...detail.item.analysis, request_id: "request-7" },
            },
            analysis_ref: { ...detail.analysis_ref, request_id: "request-7" },
          }
        : null;
    },
  };

  const result = await findInboxDetailByRequestId(source, "request-7");

  assert.equal(result.state, "available");
  assert.equal(requestedItem, "inbox-item-flagged-1");
  assert.equal(result.detail?.analysis_ref.request_id, "request-7");
});

test("does not select another Inbox item when the request ID is absent", async () => {
  let detailCalls = 0;
  const source: InboxLookupSource = {
    list: () => fixture.list({ skip: 0, limit: 200 }),
    detail: async () => {
      detailCalls += 1;
      return null;
    },
  };

  const result = await findInboxDetailByRequestId(source, "not-in-inbox");

  assert.equal(result.state, "not_found");
  assert.equal(result.detail, null);
  assert.equal(detailCalls, 0);
});

test("returns safe unavailable states for missing detail and source failures", async () => {
  const missingDetail: InboxLookupSource = {
    list: () => fixture.list({ skip: 0, limit: 200 }),
    detail: async () => null,
  };
  const unavailable = await findInboxDetailByRequestId(
    missingDetail,
    "req-inbox-flagged-1",
  );
  assert.equal(unavailable.state, "unavailable");
  assert.equal(unavailable.detail, null);

  const failing: InboxLookupSource = {
    list: async () => {
      throw new Error("raw upstream response must not leak");
    },
    detail: async () => null,
  };
  const failed = await findInboxDetailByRequestId(failing, "request-7");
  assert.equal(failed.state, "unavailable");
  assert.equal(failed.reason?.includes("raw upstream"), false);
});

test("resolves Inbox item by mail_item_id and session_id", async () => {
  const resultByItemId = await findInboxDetailByRequestId(
    fixture,
    "inbox-item-flagged-1",
  );
  assert.equal(resultByItemId.state, "available");
  assert.equal(resultByItemId.detail?.item.mail_item_id, "inbox-item-flagged-1");

  const resultBySessionId = await findInboxDetailByRequestId(
    fixture,
    "inbox-item-flagged-1-session",
  );
  assert.equal(resultBySessionId.state, "available");
  assert.equal(resultBySessionId.detail?.item.session_id, "inbox-item-flagged-1-session");
});

test("converts Inbox detail to complete forensic AnalysisRecord", async () => {
  const { convertInboxDetailToAnalysisRecord } = await import("../lib/inbox-converter.ts");
  const detail = await fixture.detail("inbox-item-flagged-1");
  assert.ok(detail);
  const record = convertInboxDetailToAnalysisRecord(detail, "fallback-id");
  assert.equal(record.request_id, "req-inbox-flagged-1");
  assert.equal(record.protocol, "SMTP");
  assert.ok(record.risk_score > 0);
  assert.ok(record.ml_scores.xgboost);
});

