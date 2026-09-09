# Inbox and Separate Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Inbox placeholder with a typed, fixture-backed split-pane investigation workspace and separate Analysis navigation without changing `SecureMail-ML-Backend`.

**Architecture:** A normalized `InboxDataSource` owns list/detail contracts and exposes a deterministic fixture implementation. Next.js same-origin routes serve that source today; the external list/detail implementation can replace the source when its URLs and schema are supplied. Client components own selection, local filtering, tabs, and explicit loading/error states.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide React, Node’s built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-09-inbox-analysis-separation-design.md`

## Global Constraints

- Do not modify `SecureMail-ML-Backend`, its database, migrations, worker, or PCAP parser.
- Fixture mode is the active data source; do not invent an external URL, auth scheme, or live payload shape.
- Keep any future upstream credential server-side; never use a `NEXT_PUBLIC_*` secret.
- Keep Inbox filters client-side and do not add undocumented API filter parameters.
- Use only bounded, plain-text, explicitly available/redacted fixture content; never render arbitrary HTML or packet payloads.
- Backend/source-provided triage and view-check states are authoritative; do not derive security policy in React.
- Use neutral gray loading placeholders and semantic red/green colors only for loaded states.
- Preserve the existing capture queue and `/analytics` behavior.

---

### Task 1: Add the normalized Inbox contract and deterministic fixtures

**Files:**
- Create: `lib/inbox-data.ts`
- Create: `test/inbox-data.test.ts`

**Interfaces:**
- Produces `InboxDataSource`, `InboxListResponse`, `InboxListItem`, `InboxDetailResponse`, `Section<T>`, `ViewCheck`, `getInboxDataSource()`, `parseInboxListResponse()`, `parseInboxDetailResponse()`, and `filterInboxItems()` for the API routes and UI.
- `InboxDataSource.list({ skip, limit })` returns a paginated list with counts.
- `InboxDataSource.detail(itemId)` returns a detail record or `null`.

- [ ] **Step 1: Write failing contract and fixture tests**

Add tests that assert:

```ts
const source = getInboxDataSource();
const page = await source.list({ skip: 0, limit: 12 });
assert.equal(page.total, 12);
assert.deepEqual(page.counts, { all: 12, flagged: 5, healthy: 7 });
assert.equal(page.items.length, 12);

const selected = await source.detail(page.items[0].mail_item_id);
assert.ok(selected);
assert.equal(selected?.email.state, "available");
assert.equal(selected?.headers.state, "available");
assert.equal(selected?.content.state, "available");
assert.equal(selected?.network.state, "available");
assert.equal(selected?.tls.state, "available");

assert.equal(filterInboxItems(page.items, "flagged").length, 5);
assert.equal(filterInboxItems(page.items, "healthy").length, 7);
```

Also test that a valid normalized object passes `parseInboxListResponse()` and that a missing `schema_version`, malformed count, or missing item ID throws a safe validation error. Test that an unavailable/redacted section preserves its state and reason.

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- test/inbox-data.test.ts
```

Expected: FAIL because the Inbox data module does not exist.

- [ ] **Step 3: Implement the contract and fixture source**

Define the normalized types from the spec, using these exact state values:

```ts
type InboxDataSource = {
  list(input: { skip: number; limit: number }): Promise<InboxListResponse>;
  detail(itemId: string): Promise<InboxDetailResponse | null>;
};

type Section<T> = {
  state: "available" | "unavailable" | "redacted";
  data: T | null;
  reason: string | null;
  source: string | null;
};
```

Implement a fixture source with 12 deterministic rows, five `flagged` rows, seven `healthy` rows, stable IDs, screenshot-like sender/subject/time/protocol values, per-view check states, and one fully populated selected flagged detail. Include at least one unavailable and one redacted section in other details. Keep content as bounded plain text.

Implement `parseInboxListResponse()` and `parseInboxDetailResponse()` as small runtime validators that reject malformed objects with `Error("Invalid Inbox response")`; they must not include the rejected payload in the error. Implement `filterInboxItems(items, filter)` for `"all" | "flagged" | "healthy"` without changing the source counts.

`getInboxDataSource()` returns the fixture source and is the single replacement seam for the future external list/detail source.

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npm test -- test/inbox-data.test.ts
```

Expected: PASS with all contract, fixture, filtering, and section-state assertions green.

- [ ] **Step 5: Commit the data boundary**

```bash
git add lib/inbox-data.ts test/inbox-data.test.ts
git commit -m "feat: add inbox data contract and fixtures"
```

### Task 2: Expose fixture data through same-origin routes

**Files:**
- Create: `app/api/inbox/route.ts`
- Create: `app/api/inbox/[itemId]/route.ts`

**Interfaces:**
- `GET /api/inbox?skip=<n>&limit=<n>` returns `InboxListResponse`.
- `GET /api/inbox/<itemId>` returns `InboxDetailResponse` or `404 { detail: "Inbox item not found" }`.
- Both routes call `getInboxDataSource()` and contain no external URL or credential.

- [ ] **Step 1: Implement bounded list query parsing**

Use `URL` query parameters with `skip` defaulting to `0`, `limit` defaulting to `12`, clamp `skip` to a non-negative integer, and clamp `limit` to `1..200`. Return `Response.json(await source.list(...))` with no-store caching.

- [ ] **Step 2: Implement ID detail loading**

Await the Next.js 16 route `params` promise, reject an empty ID with the same 404 response, and return the normalized detail JSON. Do not echo arbitrary path data in errors.

- [ ] **Step 3: Verify the routes directly**

Start the app with:

```bash
npm run dev
```

Then verify:

```bash
curl -sS 'http://localhost:3000/api/inbox?skip=0&limit=12' | jq '.total, .counts, (.items | length)'
curl -sS 'http://localhost:3000/api/inbox/inbox-item-flagged-1' | jq '.schema_version, .email.state, .tls.state'
curl -sS -o /tmp/inbox-missing.json -w '%{http_code}\n' 'http://localhost:3000/api/inbox/missing'
test "$(cat /tmp/inbox-missing.json)" = '{"detail":"Inbox item not found"}'
```

Expected: `12`, the `{all:12, flagged:5, healthy:7}` counts, 12 items, a valid detail response, and HTTP `404` for the missing item.

- [ ] **Step 4: Commit the route boundary**

```bash
git add app/api/inbox/route.ts 'app/api/inbox/[itemId]/route.ts'
git commit -m "feat: expose inbox fixture routes"
```

### Task 3: Build the Inbox split-pane workspace

**Files:**
- Create: `components/ui/inbox-workspace.tsx`
- Create: `components/ui/inbox-list.tsx`
- Create: `components/ui/inbox-detail.tsx`
- Create: `app/inbox/loading.tsx`
- Modify: `app/inbox/page.tsx`
- Modify: `components/ui/dashboard-topbar.tsx`

**Interfaces:**
- `InboxWorkspace` owns list fetch, selected ID, detail fetch, local filter, retry, and responsive list/detail mode.
- `InboxWorkspace` accepts `initialItemId?: string` and selects that ID when it exists in the loaded list.
- `InboxList` receives normalized rows, counts, filter, selected ID, and selection callback.
- `InboxDetail` receives normalized detail, loading/error state, retry callback, and back callback.

- [ ] **Step 1: Add the route-level loading skeleton**

Create `app/inbox/loading.tsx` with neutral gray two-pane skeleton regions and an accessible `aria-label="Loading Inbox"`. Do not use red/green verdict fills in the skeleton.

- [ ] **Step 2: Implement list loading and selection state**

In `InboxWorkspace`, fetch `/api/inbox?skip=0&limit=200` once on mount using an `AbortController`. Keep these states distinct: `loading`, `error`, `loaded`, and `empty`. On a populated desktop list, select the first row; preserve the existing selected ID when a refresh still contains it. On mobile, keep the list view visible until the user selects an item.

Use `filterInboxItems()` for All/Flagged/Healthy controls. Keep the source counts from the response. On an external/list error, show an error and retry control; never silently switch to fixtures because the current source mode is already explicit.

- [ ] **Step 3: Implement detail loading and error recovery**

When selection changes, fetch `/api/inbox/<encoded-item-id>` with an `AbortController`. Preserve the selected row while detail loads. Render a detail error with retry and back controls on non-OK or malformed responses. Abort stale requests during selection changes and unmount.

- [ ] **Step 4: Implement the reference layout and detail tabs**

Use a dark navy two-pane shell with a fixed-width/scrollable list region and an independently scrollable detail region. Render:

```text
Email | Headers | Content | TCP Stream | TLS
```

Use semantic buttons with `role="tab"`, `aria-selected`, and `aria-controls`; support arrow-key tab movement and visible focus. Render each `Section<T>` using its state and supplied reason. Use plain-text content rendering, never `dangerouslySetInnerHTML`.

The list must show Inbox heading, dynamic counts, All/Flagged/Healthy controls, sender/host, subject/preview, time, protocol-check chips, and triage badge. The detail header must show triage label, subject, sender, recipients, time, and an `Open analysis` link only when `analysis_ref.request_id` is non-null.

Add a visible `Preview data` marker. Use `MorphingText` only for changing counts/statuses. Avoid archive, reply, delete, or generic sheet/modal interactions.

- [ ] **Step 5: Wire `/inbox` to the workspace**

Replace the Coming Soon import in `app/inbox/page.tsx` with the Inbox workspace. Read the optional Next.js 16 `searchParams` promise, pass `itemId` as `initialItemId`, and preserve the global breadcrumb. Extend `DashboardTopbar` with an optional `tone: "light" | "dark"` prop defaulting to `"light"`; pass `tone="dark"` for Inbox. Apply dark workspace styling only to Inbox in this task.

- [ ] **Step 6: Run static verification**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: no TypeScript or ESLint errors.

- [ ] **Step 7: Commit the Inbox UI**

```bash
git add components/ui/inbox-workspace.tsx components/ui/inbox-list.tsx components/ui/inbox-detail.tsx app/inbox/loading.tsx app/inbox/page.tsx
git commit -m "feat: add fixture-backed inbox workspace"
```

### Task 4: Separate Analysis navigation and flagged view

**Files:**
- Modify: `components/ui/sidebar.tsx`
- Modify: `components/ui/dashboard-topbar.tsx`
- Create: `app/analytics/flagged/page.tsx`
- Create: `app/analytics/flagged/loading.tsx`
- Create: `components/ui/flagged-analysis-view.tsx`
- Modify: `app/analytics/page.tsx`

**Interfaces:**
- Sidebar renders `Analysis` as a grouped navigation label with `Flagged Emails` at `/analytics/flagged` and `All Analysis` at `/analytics`.
- `FlaggedAnalysisView` receives normalized `InboxListItem[]` and renders only rows with `triage_state === "flagged"`.
- `/analytics` keeps `AnalysisWorkspace` and the capture queue unchanged.

- [ ] **Step 1: Add the grouped navigation**

Replace the single Analytics item with an Analysis group. Preserve Dashboard, Inbox, History, and Settings links. Use pathname equality/prefix matching so `/analytics/flagged` marks Flagged Emails active and `/analytics` marks All Analysis active. On `/inbox` and `/analytics*`, apply the dark sidebar classes from the reference; retain the existing light sidebar classes elsewhere. Keep collapsed-sidebar accessible labels and keyboard focus.

- [ ] **Step 2: Implement the flagged view from the normalized source**

Load `getInboxDataSource().list({ skip: 0, limit: 200 })` in the server page, filter only `triage_state === "flagged"`, and pass the result to `FlaggedAnalysisView`. Do not calculate flagged state from risk scores. Show the API/fixture counts and `Preview data` marker while fixture mode is active. Link each row to `/inbox?itemId=<mail_item_id>` and to `/analytics` only when an analysis request ID exists.

Render a dense analysis table with sender/subject, protocol, view-check chips, risk score, risk class, and backend triage status. Include explicit empty and source-error states.

- [ ] **Step 3: Preserve All Analysis naming and behavior**

Update the Analytics topbar label/breadcrumb to `All Analysis`, pass `tone="dark"`, and add the same dark tone to the flagged page without changing the queue, upload, polling, or persisted result logic. Keep any existing API error and empty-state copy intact.

- [ ] **Step 4: Run static verification**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: no TypeScript or ESLint errors, with `/analytics` still type-checking against the existing queue provider.

- [ ] **Step 5: Commit the navigation split**

```bash
git add components/ui/sidebar.tsx app/analytics/flagged/page.tsx app/analytics/flagged/loading.tsx components/ui/flagged-analysis-view.tsx app/analytics/page.tsx
git commit -m "feat: separate flagged email analysis navigation"
```

### Task 5: Verify the complete fixture flow and production build

**Files:**
- Modify only if verification exposes a concrete defect in the files from Tasks 1–4.

- [ ] **Step 1: Run the complete automated suite**

```bash
npm test -- --test-concurrency=1
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Expected: all tests pass, TypeScript/lint/build succeed, diff check is clean, and no uncommitted changes remain except deliberate verification artifacts that are not tracked.

- [ ] **Step 2: Run browser verification**

Start the production app or dev server and verify with the browser tool:

1. `/inbox` loads the 12-row fixture list and shows 5 flagged/7 healthy.
2. Selecting the flagged row loads detail and all five tabs switch without another detail request.
3. The unavailable/redacted fixture states remain visible and are not rendered as healthy.
4. The `Open analysis` link uses the stable request ID.
5. `/analytics/flagged` shows only backend-flagged fixture rows.
6. `/analytics` still accepts the capture queue workflow.
7. Desktop panes scroll independently; mobile uses list-first/back navigation.
8. No console errors, upstream requests, credentials, or raw payload logs appear.

- [ ] **Step 3: Inspect the final diff**

```bash
git log --oneline -5
git show --stat --oneline HEAD
```

Confirm the implementation contains only the approved frontend Inbox/Analysis scope and no changes under `SecureMail-ML-Backend`.
