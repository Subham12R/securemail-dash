# History Analysis Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace History's Inbox-sheet link with a durable `/history/[requestId]` page that renders source-specific email or analysed-PCAP details, all safe Inbox inspection sections, and a static collapsible AI-information demo.

**Architecture:** Keep the existing SecureMail analysis lookup and normalized Inbox source as server-side boundaries. Add a pure source classifier and bounded analysis projection, a bounded request-ID-to-Inbox lookup, reusable Inbox detail tab panels, and a client-only detail layout that receives only the typed projection. History links target the new route; Inbox-originated selections continue using the existing native inspection sheet.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide React, Node’s built-in test runner, existing `Card`, `RichButton`, `MorphingText`, `LoadingSkeleton`, and `riskScoreBarClass` components/helpers.

**Spec:** `docs/superpowers/specs/2026-09-10-history-analysis-detail-page-design.md`

## Global Constraints

- Follow the repository’s Next.js 16 contract: route `params` and `searchParams` are awaited promises; do not use synchronous dynamic-route parameters.
- Do not modify `SecureMail-ML-Backend`, its database, migrations, worker, parser, or API contracts.
- Use the existing `getAnalysisByRequestId()` and `getServerInboxDataSource()` boundaries; do not invent a request-ID Inbox endpoint.
- Keep `SECUREMAILSCOPE_API_KEY` server-only; client components receive only normalized Inbox data and bounded analysis entries.
- Never render raw HTML, raw email bytes, raw packet payloads, credentials, private keys, or unbounded nested API values.
- Keep source classification, availability rules, and security policy in typed code, not prompts or presentation-only heuristics.
- Keep the AI area static and visibly demo-only; it must make no AI, chat, MCP, or network request.
- Reuse the existing Inbox detail renderers so Email, Headers, Preview, TCP Stream, and TLS remain identical in meaning and state handling.
- Preserve semantic verdict colors, neutral loading skeletons, explicit unavailable/redacted states, and the existing white shell.
- Do not add dependencies, mail mutations, export actions, template actions, event fabrication, or model fields that the backend does not provide.
- The working tree already contains unrelated risk-score changes in `components/ui/analysis-workspace.tsx`, `components/ui/history-table.tsx`, `components/ui/recent-analysis-table.tsx`, `lib/risk.ts`, and `test/risk.test.ts`. Do not reset, stash, format, or overwrite them; stage only the intended History-detail hunks when committing.

---

## File map

- **Create:** `lib/analysis-detail.ts` — source classification, bounded analysis projection, detail-route URL helper, field inventory, and view-model types.
- **Create:** `lib/inbox-lookup.ts` — bounded server-side lookup of a safe Inbox detail by the analysis request ID.
- **Create:** `test/analysis-detail.test.ts` — pure classifier, URL, and bounded-projection tests.
- **Create:** `test/inbox-lookup.test.ts` — matching, non-matching, detail confirmation, and source-error tests using typed fake sources.
- **Create:** `components/ui/inbox-detail-panels.tsx` — shared five-tab Inbox section renderer extracted from the current side sheet.
- **Modify:** `components/ui/inbox-detail.tsx` — retain the current sheet header/state behavior and consume the shared panel renderer.
- **Create:** `components/ui/history-analysis-detail.tsx` — client detail workspace and Email/PCAP source-specific views.
- **Create:** `components/ui/history-ai-panel.tsx` — collapsible static AI-information demo.
- **Create:** `app/history/[requestId]/page.tsx` — server route loader, safe error states, and view-model composition.
- **Create:** `app/history/[requestId]/loading.tsx` — neutral route-level loading skeleton.
- **Modify:** `components/ui/history-table.tsx` — use the shared source label and navigate to `/history/[requestId]` without changing the existing risk-bar work.

---

### Task 1: Add the source classifier and safe analysis view model

**Files:**
- Create: `lib/analysis-detail.ts`
- Create: `test/analysis-detail.test.ts`

**Interfaces:**
- Produces `AnalysisSourceKind`, `ANALYSIS_DETAIL_FIELDS`, `SafeAnalysisEntry`, `InboxDetailLookup`, `AnalysisDetailViewModel`, `classifyAnalysisSource()`, `analysisSourceLabel()`, `formatAnalysisSource()`, `historyDetailHref()`, and `buildAnalysisDetailViewModel()`.
- Consumes the existing `AnalysisRecord` and `InboxDetailResponse` types without changing them.

- [ ] **Step 1: Write the failing pure contract tests**

Create a local record factory in `test/analysis-detail.test.ts` so tests do not call the SecureMail API:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  analysisSourceLabel,
  buildAnalysisDetailViewModel,
  classifyAnalysisSource,
  formatAnalysisSource,
  historyDetailHref,
} from "../lib/analysis-detail.ts";
import type { AnalysisRecord } from "../lib/securemail-api.ts";

function record(overrides: Partial<AnalysisRecord> = {}): AnalysisRecord {
  return {
    id: 7,
    request_id: "request-7",
    session_id: "session-7",
    client_id: null,
    capture_id: "capture-7.pcap",
    protocol: "SMTP",
    posture: "degraded",
    timestamp: "2026-09-10T12:00:00Z",
    evidence_ref_count: 2,
    risk_score: 0.695,
    final_verdict: "suspicious",
    rule_score: 0.4,
    rule_triggers_count: 1,
    trigger_details: [{ rule: "legacy_tls", evidence: "stream:7" }],
    ml_scores: { xgboost: { probability: 0.7, predicted_class: "suspicious" } },
    explanations: { xgboost: [{ feature: "tls_version", contribution: 0.2 }] },
    model_bundle: { version: "bundle-1" },
    is_synthetic: false,
    source_label: "Analysed PCAP capture",
    ...overrides,
  };
}

test("classifies sources without using risk policy", () => {
  assert.equal(classifyAnalysisSource(record({ client_id: "smtp-client-1", capture_id: null, source_label: "Email client" })), "email_client");
  assert.equal(classifyAnalysisSource(record()), "analysed_pcap");
  assert.equal(classifyAnalysisSource(record({ is_synthetic: true })), "synthetic");
  assert.equal(classifyAnalysisSource(record({ capture_id: null, source_label: null })), "unknown");
  assert.equal(analysisSourceLabel("email_client"), "Email client");
  assert.equal(analysisSourceLabel("analysed_pcap"), "Analysed PCAP capture");
  assert.equal(formatAnalysisSource(record({ client_id: "mail-client", capture_id: null, source_label: null })), "Email client");
});

test("builds an encoded detail URL only for a bounded request ID", () => {
  assert.equal(historyDetailHref("request/7"), "/history/request%2F7");
  assert.equal(historyDetailHref("  request-7  "), "/history/request-7");
  assert.equal(historyDetailHref("   "), null);
  assert.equal(historyDetailHref("x".repeat(257)), null);
});

test("bounds nested analysis values and records absent model values", () => {
  const secret = "raw-secret-should-be-bounded-".repeat(100);
  const view = buildAnalysisDetailViewModel(
    record({
      ml_scores: {
        model: {
          secret,
          deep: { one: { two: { three: { four: "too deep" } } } },
        },
      },
      explanations: {},
      model_bundle: {},
      trigger_details: [],
    }),
    { state: "not_found", detail: null, reason: "No matching Inbox item was returned." },
  );

  assert.equal(view.source, "analysed_pcap");
  assert.equal(view.model.missing_fields.includes("explanations"), true);
  assert.equal(view.model.missing_fields.includes("model_bundle"), true);
  assert.equal(JSON.stringify(view).includes(secret), false);
  assert.equal(view.model.scores.some((entry) => entry.value.length <= 512), true);
  assert.equal(view.model.scores.some((entry) => entry.path.includes("four")), false);
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
npm test -- test/analysis-detail.test.ts
```

Expected: FAIL because `lib/analysis-detail.ts` does not exist.

- [ ] **Step 3: Implement the typed source and projection boundary**

Define these exported types and constants:

```ts
export type AnalysisSourceKind =
  | "email_client"
  | "analysed_pcap"
  | "synthetic"
  | "unknown";

export const ANALYSIS_DETAIL_FIELDS = [
  "capture_id",
  "session_id",
  "protocol",
  "posture",
  "model_bundle",
  "ml_scores",
  "explanations",
  "rule_score",
  "trigger_details",
  "evidence_ref_count",
] as const;

export type SafeAnalysisEntry = { path: string; value: string };

export type InboxDetailLookup = {
  state: "available" | "not_found" | "unavailable";
  detail: InboxDetailResponse | null;
  reason: string | null;
};

export type AnalysisDetailViewModel = {
  source: AnalysisSourceKind;
  source_label: string;
  summary: {
    request_id: string;
    session_id: string;
    capture_id: string | null;
    client_id: string | null;
    protocol: string | null;
    posture: string | null;
    timestamp: string;
    final_verdict: string;
    risk_score: number;
    rule_score: number | null;
    evidence_ref_count: number;
    rule_triggers_count: number;
    is_synthetic: boolean;
  };
  model: {
    bundle: SafeAnalysisEntry[];
    scores: SafeAnalysisEntry[];
    explanations: SafeAnalysisEntry[];
    rule_findings: SafeAnalysisEntry[];
    missing_fields: string[];
  };
  inbox: InboxDetailLookup;
};
```

Define `AnalysisDetailViewModel` with the exact scalar and model fields above. `inbox` must use `InboxDetailLookup`, not an arbitrary object. Keep `AnalysisRecord` as the only input record type.

Implement source classification with these actual normalized values:

```ts
const sourceText = `${record.source_label ?? ""} ${record.capture_id ?? ""} ${record.session_id}`.toLowerCase();
if (record.is_synthetic) return "synthetic";
if (/pcap|capture/.test(sourceText)) return "analysed_pcap";
if (/email|mail|client/.test(sourceText) || Boolean(record.client_id?.trim())) return "email_client";
return "unknown";
```

Implement `analysisSourceLabel()` with the labels `Email client`, `Analysed PCAP capture`, `Synthetic`, and `Not supplied`. Implement `formatAnalysisSource(record)` as the composition used by History filtering. Implement `historyDetailHref()` with a trimmed, non-empty request ID maximum of 256 characters and `encodeURIComponent()`.

Flatten `model_bundle`, `ml_scores`, `explanations`, and `trigger_details` into `SafeAnalysisEntry[]` with these ceilings:

```ts
const MAX_ANALYSIS_DEPTH = 3;
const MAX_ANALYSIS_ENTRIES = 80;
const MAX_ANALYSIS_STRING_LENGTH = 512;
const MAX_ANALYSIS_PATH_LENGTH = 160;
```

Stop recursion at the depth/entry limits, bound object keys and strings, handle arrays by index, prevent cycles with a `WeakSet`, and represent finite numbers, booleans, and null as bounded strings. An empty collection contributes no entries and its field name goes into a de-duplicated `missing_fields` array; the UI will distinguish that from a numeric zero by displaying `No persisted values` rather than `0`. Bound scalar display strings before putting them in the view model. `buildAnalysisDetailViewModel(record, inbox)` must not include the original `AnalysisRecord` or any unbounded nested value.

- [ ] **Step 4: Run the focused test and inspect the projection output**

Run:

```bash
npm test -- test/analysis-detail.test.ts
git diff --check
```

Expected: all classifier, URL, source-state, depth, length, and raw-value-boundary assertions pass. The diff check must be clean.

- [ ] **Step 5: Commit only this data-boundary task**

Before staging, confirm the existing risk files are not included:

```bash
git add lib/analysis-detail.ts test/analysis-detail.test.ts
git diff --cached --name-only
```

Expected staged paths are exactly the two Task 1 files. Commit:

```bash
git commit -m "feat: add history detail data projection"
```

---

### Task 2: Add the bounded request-ID Inbox lookup

**Files:**
- Create: `lib/inbox-lookup.ts`
- Create: `test/inbox-lookup.test.ts`

**Interfaces:**
- Consumes `InboxDataSource` from `lib/inbox-data.ts` and `InboxDetailLookup` from `lib/analysis-detail.ts`.
- Produces `InboxLookupSource` and `findInboxDetailByRequestId(source, requestId): Promise<InboxDetailLookup>`.

- [ ] **Step 1: Write matching and failure tests against a typed fake source**

Use the fixture source for the normalized shape, but make the fake detail response confirm `request-7` so the test exercises the confirmation rule:

```ts
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
  const unavailable = await findInboxDetailByRequestId(missingDetail, "req-inbox-flagged-1");
  assert.equal(unavailable.state, "unavailable");
  assert.equal(unavailable.detail, null);

  const failing: InboxLookupSource = {
    list: async () => { throw new Error("raw upstream response must not leak"); },
    detail: async () => null,
  };
  const failed = await findInboxDetailByRequestId(failing, "request-7");
  assert.equal(failed.state, "unavailable");
  assert.equal(failed.reason?.includes("raw upstream"), false);
});
```

- [ ] **Step 2: Run the focused lookup test and verify it fails**

Run:

```bash
npm test -- test/inbox-lookup.test.ts
```

Expected: FAIL because `lib/inbox-lookup.ts` does not exist.

- [ ] **Step 3: Implement one bounded list-then-detail lookup**

Define:

```ts
export type InboxLookupSource = InboxDataSource;

export async function findInboxDetailByRequestId(
  source: InboxLookupSource,
  requestId: string,
): Promise<InboxDetailLookup>;
```

Trim and reject an empty or over-256-character ID as `not_found`. Call exactly `source.list({ skip: 0, limit: 200 })`, find an item whose `analysis.request_id` equals the trimmed ID, and return `not_found` when no exact match exists. Do not use another item as a fallback.

For a match, call `source.detail(item.mail_item_id)`. Return `unavailable` with fixed safe copy when detail is null, when neither `detail.analysis_ref.request_id` nor `detail.item.analysis.request_id` confirms the same ID, or when the source throws. Do not include exception text, raw IDs, or upstream payloads in the reason. Return `available` only with the normalized `InboxDetailResponse`.

- [ ] **Step 4: Run tests and static checks**

Run:

```bash
npm test -- test/inbox-lookup.test.ts test/inbox-data.test.ts
npx tsc --noEmit
npm run lint
```

Expected: lookup, existing Inbox contract, TypeScript, and ESLint checks pass.

- [ ] **Step 5: Commit the lookup boundary**

```bash
git add lib/inbox-lookup.ts test/inbox-lookup.test.ts
git diff --cached --name-only
git commit -m "feat: resolve related inbox details safely"
```

Only the two Task 2 files should be staged.

---

### Task 3: Extract reusable Inbox detail tabs without changing the sheet

**Files:**
- Create: `components/ui/inbox-detail-panels.tsx`
- Modify: `components/ui/inbox-detail.tsx`

**Interfaces:**
- Produces `InboxDetailPanels({ detail, initialTab, idPrefix }): JSX.Element`.
- Consumes the existing `InboxDetailResponse`, `InboxDetailTab`, `Section`, and all section data types.
- The existing `InboxDetail` sheet keeps its current props, loading/error states, header, `Open analysis` link, and mobile back control.

- [ ] **Step 1: Move panel-only code into the shared component**

Move these existing private definitions from `components/ui/inbox-detail.tsx` into `components/ui/inbox-detail-panels.tsx` without changing their text or field mapping:

```text
tabs
valueOrFallback
formatDate
formatBoolean
SectionState
DataList
PanelHeading
EmailPanel
AuthBadge
HeadersPanel
ContentPanel
formatQualityScore
IpReputationPanel
NetworkPanel
TlsPanel
renderPanel
```

Export this client component and preserve the current tab markup:

```tsx
export default function InboxDetailPanels({
  detail,
  initialTab = "content",
  idPrefix = "inbox",
}: {
  detail: InboxDetailResponse;
  initialTab?: InboxDetailTab;
  idPrefix?: string;
}) {
  const [activeTab, setActiveTab] = useState<InboxDetailTab>(initialTab);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.key);
    document.getElementById(`${idPrefix}-tab-${nextTab.key}`)?.focus();
  };

  return (
    <>
      <div className="border-b border-zinc-200 px-4 pt-3 sm:px-6">
        <div role="tablist" aria-label="Message detail sections" className="flex min-w-max gap-1 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                id={`${idPrefix}-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${idPrefix}-panel-${key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(key)}
                onKeyDown={handleTabKeyDown}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-700",
                  active ? "border-sky-600 text-zinc-900" : "border-transparent text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        id={`${idPrefix}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${activeTab}`}
        tabIndex={0}
        className="p-6 focus-visible:outline-2 focus-visible:outline-sky-700"
      >
        {renderPanel(activeTab, detail)}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Replace the sheet’s inline panel implementation**

In `InboxDetail`, remove the moved `useState`, keyboard handler, tab array, panel functions, and `renderPanel` call. Keep the existing header and replace the current tab-list/panel block with:

```tsx
<InboxDetailPanels detail={detail} initialTab={initialTab} />
```

The shared component owns the border wrapper and panel wrapper. Preserve the existing `key={selectedId}` in `InboxWorkspace`, which resets the selected item’s active tab.

- [ ] **Step 3: Run static verification and inspect the sheet diff**

Run:

```bash
npx tsc --noEmit
npm run lint
git diff -- components/ui/inbox-detail.tsx components/ui/inbox-detail-panels.tsx
```

Expected: no type or lint errors; the existing Inbox sheet still has the same five tabs, IP/TLS fields, unavailable/redacted states, and no raw-content rendering. Do not alter the current risk-score files.

- [ ] **Step 4: Commit the reusable panel extraction**

```bash
git add components/ui/inbox-detail.tsx components/ui/inbox-detail-panels.tsx
git diff --cached --name-only
git commit -m "refactor: share inbox detail panels"
```

---

### Task 4: Build the source-specific detail workspace and static AI panel

**Files:**
- Create: `components/ui/history-analysis-detail.tsx`
- Create: `components/ui/history-ai-panel.tsx`

**Interfaces:**
- `HistoryAnalysisDetail({ viewModel }: { viewModel: AnalysisDetailViewModel }): JSX.Element` owns the responsive layout and AI panel open state.
- `HistoryAiPanel({ viewModel, expanded, onToggle }: { viewModel: AnalysisDetailViewModel; expanded: boolean; onToggle: () => void }): JSX.Element` owns only static AI-demo copy and disclosure markup.
- Consumes `InboxDetailPanels` for all Inbox-detail sections and never calls `fetch`.

- [ ] **Step 1: Implement the collapsible AI panel first**

Create `history-ai-panel.tsx` as a client component. Keep the content in the DOM with `hidden={!expanded}` so `aria-controls` always references a stable element and collapsed content is removed from the accessibility tree:

```tsx
<aside aria-labelledby="history-ai-heading">
  <button
    type="button"
    aria-expanded={expanded}
    aria-controls="history-ai-content"
    onClick={onToggle}
  >
    <span id="history-ai-heading">AI analysis assistant</span>
  </button>
  <div id="history-ai-content" hidden={!expanded}>
    <p>Demo mode — live AI is not connected.</p>
    <p>Source: {viewModel.source_label}</p>
    <p>Record status: persisted analysis record</p>
    <p>Available fields: {ANALYSIS_DETAIL_FIELDS.length - viewModel.model.missing_fields.length}</p>
    <p>Missing fields: {viewModel.model.missing_fields.join(", ") || "None recorded"}</p>
    <div aria-label="Example prompts">
      <span>Summarize this record</span>
      <span>What fields are missing?</span>
      <span>Explain the model output</span>
    </div>
  </div>
</aside>
```

Use a real button for only the collapse action. Example prompts are non-interactive text chips. Do not add a form, submit handler, provider import, or network call.

- [ ] **Step 2: Implement the common record header and safe display helpers**

In `history-analysis-detail.tsx`, add client-safe helpers for empty values, UTC timestamps, verdict labels, and the clamped visual risk percentage. Use `riskScoreBarClass` for the risk bar and `MorphingText` for displayed risk/verdict status values. The record header must include:

```text
source label and icon
primary identity
secondary subject or record description
From, Subject, To, and ID when an Inbox detail is available
request ID, session ID, capture ID, protocol, posture, timestamp, verdict, and risk score
Back to History link
```

Use the analysis summary for analysis risk/verdict and the Inbox item only for envelope/triage fields. Use `Not supplied` for null/empty values. Never derive a verdict from the score.

- [ ] **Step 3: Implement the Email client view with all Inbox sections**

For `viewModel.source === "email_client"`, render the header followed by a bordered main content surface. When `viewModel.inbox.state === "available"`, render:

```tsx
<InboxDetailPanels
  detail={viewModel.inbox.detail}
  initialTab="content"
  idPrefix="history-email"
/>
```

When it is not available, render a `role="status"` section with the exact heading `Inbox details unavailable for this record`, the safe reason when present, and no other email. The available path must expose these five tabs from the shared component:

```text
Email
Headers
Preview
TCP Stream
TLS
```

Do not add interactive Template, Log, provider-event, HTML, or Raw controls. If the screenshot-inspired header reserves space for those concepts, render the non-interactive text `Not supplied by the current source`.

- [ ] **Step 4: Implement the Analysed PCAP view with model and availability sections**

For `analysed_pcap`, `synthetic`, and `unknown`, render the following ordered sections using `Card`/`CardContent` and bounded `<dl>` entries:

1. `Record summary`: capture/session/request IDs, protocol, posture, timestamp, risk score, final verdict, rule score, rule trigger count, and evidence reference count.
2. `Model bundle`: `viewModel.model.bundle`, or `No persisted model bundle values`.
3. `ML scores`: `viewModel.model.scores`, or `No persisted model score values`.
4. `Explanations`: `viewModel.model.explanations`, or `No persisted explanation values`, followed by `Model explanations describe model behavior and are not proof of attacker intent.`.
5. `Rule findings`: `viewModel.model.rule_findings`, or `No persisted rule findings`.
6. `Field availability`: every field in `ANALYSIS_DETAIL_FIELDS`; missing names from `missing_fields` show `Not supplied`, otherwise show `Available`.
7. `Related Inbox evidence`: when available, render `InboxDetailPanels` with `idPrefix="history-related"`; otherwise render a fixed unavailable state and do not select another Inbox item.

Render every safe entry as a `<dt>` path and text-only `<dd>` value. Do not call `JSON.stringify()` on client data and do not use `dangerouslySetInnerHTML`.

- [ ] **Step 5: Implement the responsive layout**

`HistoryAnalysisDetail` owns `const [assistantOpen, setAssistantOpen] = useState(true)` and renders one centered inner workspace grid with a maximum width:

```text
inner workspace: mx-auto w-full max-w-[1280px]
expanded desktop: grid-cols-[minmax(0,1fr)_24rem]
collapsed desktop: grid-cols-[minmax(0,1fr)_3rem]
mobile: one column with the AI panel after the main detail workspace
```

Set `min-h-0` and bounded overflow on the main workspace and AI panel, retain a visible labelled collapse rail, and use `motion-reduce:transition-none`. Do not add an outer page scrollbar.

- [ ] **Step 6: Run static checks and commit the client workspace**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: no TypeScript/ESLint errors, no server-only imports in either client component, and no raw-content rendering. Then stage only the two new component files:

```bash
git add components/ui/history-analysis-detail.tsx components/ui/history-ai-panel.tsx
git diff --cached --name-only
git commit -m "feat: add source-specific history detail views"
```

---

### Task 5: Add the server route and neutral loading/error states

**Files:**
- Create: `app/history/[requestId]/page.tsx`
- Create: `app/history/[requestId]/loading.tsx`

**Interfaces:**
- Produces the App Router route `/history/[requestId]`.
- Consumes `getAnalysisByRequestId()`, `getServerInboxDataSource()`, `findInboxDetailByRequestId()`, and `buildAnalysisDetailViewModel()`.
- Passes only `AnalysisDetailViewModel` to `HistoryAnalysisDetail`.

- [ ] **Step 1: Implement safe route-ID normalization and shared error markup**

Use the Next.js 16 route shape and do not read `params.requestId` synchronously:

```tsx
type HistoryDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

function normalizeRouteRequestId(value: string) {
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded.length > 0 && decoded.length <= 256 ? decoded : null;
  } catch {
    return null;
  }
}
```

Add a local server-rendered error state with `DashboardTopbar currentPage="History detail"`, an `h1` of `Analysis record unavailable`, a safe message, and a `Back to History` link. Do not echo invalid route data or upstream response bodies.

- [ ] **Step 2: Load the analysis record and related Inbox data on the server**

Implement the page loader as:

```tsx
export default async function HistoryDetailPage({
  params,
}: HistoryDetailPageProps) {
  const { requestId: rawRequestId } = await params;
  const requestId = normalizeRouteRequestId(rawRequestId);

  if (!requestId) {
    return <HistoryDetailError message="The requested analysis ID is invalid." />;
  }

  const analysis = await getAnalysisByRequestId(requestId);
  if (!analysis.record) {
    return <HistoryDetailError message={analysis.error ?? "The analysis record is unavailable."} />;
  }

  const inbox = await findInboxDetailByRequestId(
    getServerInboxDataSource(),
    requestId,
  );
  const viewModel = buildAnalysisDetailViewModel(analysis.record, inbox);

  return (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white" aria-label="History detail page">
      <DashboardTopbar currentPage="History detail" showRefresh />
      <HistoryAnalysisDetail viewModel={viewModel} />
    </main>
  );
}
```

Use the existing server-only SecureMail proxy and Inbox source. The analysis record remains authoritative for risk, verdict, model, and request/session identity; Inbox data remains authoritative for envelope, headers, safe preview, TCP, TLS, IP reputation, and Inbox triage/reference state. Do not merge conflicting values.

- [ ] **Step 3: Add the neutral route loading skeleton**

Create `app/history/[requestId]/loading.tsx` with the white scrolling shell and `LoadingSkeleton` blocks for the breadcrumb, record header, metadata, main detail surface, and AI panel. Set:

```tsx
<main aria-label="Loading history detail" aria-busy="true">
```

Use only neutral gray skeletons. Do not render record IDs, risk colors, verdict badges, or fake model values while loading.

- [ ] **Step 4: Run route checks and commit the server boundary**

Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: the dynamic route compiles with promise-based `params`, client/server imports remain valid, and the production build generates `/history/[requestId]`. Then commit only the route files:

```bash
git add 'app/history/[requestId]/page.tsx' 'app/history/[requestId]/loading.tsx'
git diff --cached --name-only
git commit -m "feat: add history detail route"
```

---

### Task 6: Point History actions at the standalone detail page

**Files:**
- Modify: `components/ui/history-table.tsx`

**Interfaces:**
- Consumes `formatAnalysisSource()` and `historyDetailHref()` from `lib/analysis-detail.ts`.
- Produces a link to `/history/[requestId]` only when the record has a valid request ID.

- [ ] **Step 1: Replace the duplicated source formatter**

Remove the local `formatSource()` implementation and use `formatAnalysisSource(record)` for the source column and local filter. Use these source options:

```ts
options: [
  "All sources",
  "Analysed PCAP capture",
  "Email client",
  "Synthetic",
  "Not supplied",
]
```

Keep filtering local to the already loaded `records` array; do not add query parameters or change the History API request.

- [ ] **Step 2: Replace the network-details href**

For each row compute:

```ts
const detailHref = historyDetailHref(record.request_id);
```

When non-null, render the existing icon link with:

```tsx
<Link
  href={detailHref}
  aria-label={`View analysis details for ${record.client_id ?? record.session_id}`}
  title="View analysis details"
  className="inline-flex rounded-sm text-sky-700 transition-colors hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
>
  <Link2 aria-hidden="true" className="size-4" />
  <span className="sr-only">View analysis details</span>
</Link>
```

When the helper returns null, render `Not available` with an accessible status instead of a link. Change the column’s screen-reader heading from `Network details` to `Analysis details`. Preserve the current `riskScoreBarClass` import and bar changes already present in this file.

- [ ] **Step 3: Run targeted checks and inspect the exact History diff**

Run:

```bash
npm test -- test/analysis-detail.test.ts
npx tsc --noEmit
npm run lint
git diff -- components/ui/history-table.tsx
```

Expected: the only new changes in this file are source-label reuse, source filter options, and the `/history/<encoded-request-id>` link. The existing risk-score changes remain intact.

- [ ] **Step 4: Stage only the new History hunks and commit**

Because this file already contains an unrelated uncommitted risk change, do not use `git add -A` or blindly stage the whole file. Use patch staging:

```bash
git add -p components/ui/history-table.tsx
git diff --cached -- components/ui/history-table.tsx
git status --short
```

Stage only the source/link hunks. Leave the pre-existing risk-score hunk and `lib/risk.ts`/`test/risk.test.ts` untouched. Commit:

```bash
git commit -m "feat: navigate history rows to detail pages"
```

---

### Task 7: Verify the complete History detail flow

**Files:**
- No source changes unless a check identifies a concrete defect in Tasks 1–6.

- [ ] **Step 1: Run the complete automated suite and production checks**

Run:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Expected: all Node tests pass, TypeScript/lint/build pass, and `git diff --check` is clean. Existing unrelated working-tree files may remain; inspect them rather than deleting or committing them.

- [ ] **Step 2: Verify the route and data boundaries without exposing secrets**

With the existing server environment configured, start the app:

```bash
npm run dev
```

Use browser verification against `/history` and a valid record from the configured SecureMail API. Confirm:

```text
History action -> /history/<encoded request ID>
No /inbox navigation and no dialog opens
Direct reload preserves the detail page
```

Inspect browser network requests and confirm the browser makes no direct request to the SecureMail API, Inbox upstream host, or an AI provider. Do not print `SECUREMAILSCOPE_API_KEY` or raw response bodies.

- [ ] **Step 3: Verify an email-client record or its truthful fallback**

For a configured analysis record classified as `Email client`, verify the header shows From, Subject, To, ID, request metadata, and backend risk/verdict without combining source policies. Confirm all five tabs render the normalized sections:

```text
Email: envelope metadata
Headers: allowlisted fields and authentication results
Preview: bounded plain text and redaction/truncation state
TCP Stream: stream metrics, flags, evidence references, IP reputation
TLS: negotiation, warnings, certificate posture
```

If the configured Inbox source has no exact request-ID match, verify the page instead shows `Inbox details unavailable for this record` and never displays another email. The pure tests from Tasks 1–2 provide deterministic coverage when no live email record is available.

- [ ] **Step 4: Verify an analysed-PCAP record**

For a configured PCAP analysis record, verify the page shows capture/session/request identity, protocol/posture, risk/verdict, model bundle, ML scores, explanations, rule findings, evidence count, and the available/missing inventory. Confirm absent model data is labelled `Not supplied` or `No persisted values`, not zero or a fabricated model/series code. Confirm the explanation disclaimer is visible.

- [ ] **Step 5: Verify the static AI panel and responsive states**

On desktop and at a 390px viewport:

1. Confirm the AI panel starts expanded, has an `aria-expanded` control, and collapses to a labelled rail.
2. Confirm hidden collapsed content is absent from the tab order.
3. Confirm mobile places the AI panel below the main detail content and introduces no horizontal page overflow.
4. Confirm the copy says `Demo mode — live AI is not connected.` and no AI/network request occurs.
5. Confirm neutral loading skeletons contain no semantic verdict color.
6. Confirm missing analysis, invalid route, unmatched Inbox data, unavailable sections, and redacted sections retain explicit states.

Run the browser accessibility check with axe on the email/PCAP states and the collapsed AI panel; expected result is zero violations.

- [ ] **Step 6: Inspect the final diff and report remaining limits**

Run:

```bash
git diff --stat
git status --short
git diff --name-only -- ':(exclude)lib/risk.ts' ':(exclude)test/risk.test.ts'
```

Confirm no file under `SecureMail-ML-Backend` changed, no secret/raw message data entered the diff, and the unrelated risk-score work remains present. Report the remaining product limits: no production AI integration, no raw HTML/message/packet view, no invented provider events/templates/series codes, and Inbox matching is limited to the bounded normalized list lookup because no request-ID Inbox endpoint exists.
