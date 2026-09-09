# Persistent Capture Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the analytics capture queue use real upload/API/session progress and resume accepted jobs across route changes and browser refresh/reopen.

**Architecture:** A client `CaptureQueueProvider` mounted inside the root layout owns files, upload/poll/analyze work, and the latest queue snapshot. It persists only accepted job metadata in `localStorage`; the API remains authoritative for job status, extraction progress, sessions, and persisted results. `AnalysisWorkspace` renders provider state and never owns a long-running polling loop.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, same-origin Next route handlers, SecureMail `capture-job.v1` API, browser `XMLHttpRequest.upload` progress, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-09-persistent-capture-queue-design.md`

## Global Constraints

- Use the existing same-origin `/api/capture-jobs` and `/api/capture-jobs/{jobId}` routes; never expose `SECUREMAILSCOPE_API_KEY` to browser code.
- Send raw PCAP/PCAPNG only to `POST /api/capture-jobs`; send one validated session record per `POST /api/analyses` request.
- Treat `capture-job.progress` as extraction progress only; do not call it an ETA or use it to claim analysis completion.
- Persist only job IDs, filenames, sizes, safe statuses/counts, safe error codes, and timestamps; never persist `File` objects, PCAP bytes, response bodies, or secrets.
- Keep polling and automatic retries bounded; malformed uploads and terminal API failures are not automatically retried.
- Preserve explicit `queued`, `uploading`, `extracting`, `analyzing`, `complete`, `empty`, and `failed` states and neutral loading visuals.
- Existing unrelated uncommitted work must remain untouched.

---

## File map

- **Create:** `lib/capture-queue.ts` — client-safe queue types, API response parsing, phase/progress derivation, and local-storage serialization helpers.
- **Create:** `components/providers/capture-queue-provider.tsx` — root-scoped queue state, upload/poll/resume pipeline, result deduplication, and context API.
- **Create:** `test/capture-queue.test.ts` — focused Node built-in tests for phase/progress and persistence boundaries.
- **Modify:** `components/ui/analysis-workspace.tsx` — consume provider data and render phase-aware progress/copy instead of local polling state.
- **Modify:** `components/ui/task-rows.tsx` — display optional authoritative per-row progress without inventing values.
- **Modify:** `app/layout.tsx` — mount the provider below the server root layout and above route children.
- **Modify:** `package.json` — add the Node built-in test command only if the focused test file is added.
- **Modify:** `package-lock.json` — update only if package metadata changes require it.

---

### Task 1: Define and test the queue contract

**Files:**
- Create: `lib/capture-queue.ts`
- Create: `test/capture-queue.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `CaptureJob`, `CaptureQueuePhase`, `CaptureQueueItem`, `StoredCaptureQueueItem`, `parseCaptureJob`, `parseCaptureJobList`, `getQueueProgress`, `serializeQueue`, and `restoreQueue` for the provider and UI.
- `CaptureJob` must represent the API fields `job_id`, `capture_id`, `status`, `filename`, `session_count`, `processed_sessions`, `progress`, `error_code`, and `diagnostics`.
- `getQueueProgress(item)` returns `{ label: string; value: number | null; determinate: boolean }`; `value` is upload percentage, API extraction percentage, analyzed-session percentage, or `100` only for terminal phases.

- [ ] **Step 1: Add the failing contract tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  getQueueProgress,
  restoreQueue,
  serializeQueue,
  type CaptureQueueItem,
} from "../lib/capture-queue.ts";

test("uses measured upload bytes while uploading", () => {
  const item = { phase: "uploading", uploadProgress: 42, analyzedCount: 0, sessionCount: 0 } as CaptureQueueItem;
  assert.deepEqual(getQueueProgress(item), { label: "Uploading", value: 42, determinate: true });
});

test("does not invent extraction progress while queued", () => {
  const item = { phase: "queued", uploadProgress: null, analyzedCount: 0, sessionCount: 0 } as CaptureQueueItem;
  assert.deepEqual(getQueueProgress(item), { label: "Waiting for worker", value: null, determinate: false });
});

test("uses analyzed sessions after extraction", () => {
  const item = { phase: "analyzing", uploadProgress: null, analyzedCount: 2, sessionCount: 8 } as CaptureQueueItem;
  assert.deepEqual(getQueueProgress(item), { label: "Analyzing", value: 25, determinate: true });
});

test("persistence strips files and restores accepted metadata", () => {
  const item = { id: "pcap-abc", jobId: "pcap-abc", filename: "mail.pcap", size: 12, phase: "extracting", uploadProgress: 100, analyzedCount: 0, sessionCount: 0, job: null, error: null, updatedAt: 1, file: new File(["secret"], "mail.pcap") } as CaptureQueueItem;
  const restored = restoreQueue(serializeQueue([item]));
  assert.equal(restored[0].file, undefined);
  assert.equal(restored[0].jobId, "pcap-abc");
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --experimental-strip-types --test test/capture-queue.test.ts`

Expected: FAIL because `lib/capture-queue.ts` and its contract functions do not exist yet.

- [ ] **Step 3: Implement the smallest pure contract module**

Implement strict runtime parsing for the documented API statuses and numeric fields. Use these phase rules:

```ts
if (item.phase === "uploading") return { label: "Uploading", value: item.uploadProgress, determinate: item.uploadProgress !== null };
if (item.phase === "queued") return { label: "Waiting for worker", value: null, determinate: false };
if (item.phase === "extracting") return { label: "Extracting", value: item.job?.progress ?? null, determinate: item.job?.progress !== null };
if (item.phase === "analyzing") return { label: "Analyzing", value: item.sessionCount > 0 ? (item.analyzedCount / item.sessionCount) * 100 : null, determinate: item.sessionCount > 0 };
if (item.phase === "complete" || item.phase === "empty") return { label: item.phase === "empty" ? "No sessions found" : "Complete", value: 100, determinate: true };
return { label: "Failed", value: null, determinate: false };
```

`serializeQueue` must omit `file`, `href`, `previewUrl`, and any raw API payload beyond the typed safe job fields. `restoreQueue` must return `[]` for malformed JSON, unknown phases, missing job IDs, or non-finite numeric values.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `node --experimental-strip-types --test test/capture-queue.test.ts`

Expected: PASS for upload, queued, analyzing, and persistence-boundary cases.

- [ ] **Step 5: Add the test script**

Add exactly:

```json
"test": "node --experimental-strip-types --test"
```

- [ ] **Step 6: Commit the focused contract change**

```bash
git add lib/capture-queue.ts test/capture-queue.test.ts package.json
 git commit -m "test: define persistent capture queue contract"
```

---

### Task 2: Move the durable pipeline into a root-scoped provider

**Files:**
- Create: `components/providers/capture-queue-provider.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes `CaptureJob` parsing/progress helpers from `lib/capture-queue.ts` and existing same-origin API routes.
- Produces `useCaptureQueue()` with `{ attachments, queueItems, isProcessing, canQueue, setAttachments, removeAttachment, queueFiles, latestAnalysis }`.
- `setAttachments(items: AttachmentUploadItem[])` replaces the controlled attachment list; `queueFiles()` uploads only local items without a `jobId`; accepted jobs are persisted before polling begins.

- [ ] **Step 1: Add provider skeleton and a failing type check**

Create the context types and a provider that exposes the exact value shape above, with `queueFiles` initially returning `Promise.resolve()` and `setAttachments` updating in-memory state. Mount it in `app/layout.tsx` around `{children}`. Run `npx tsc --noEmit` and confirm the provider itself type-checks before migrating the workspace consumer.

- [ ] **Step 2: Implement measured upload transport**

Add an `XMLHttpRequest` helper inside the provider:

```ts
function uploadCapture(file: File, onProgress: (value: number) => void): Promise<CaptureJob>
```

POST a `FormData` with the `file` field to `/api/capture-jobs`, set `responseType = "text"`, report `Math.round((loaded / total) * 100)` only when `lengthComputable`, parse the response with `parseCaptureJob`, and reject with the safe `detail` string for non-2xx responses. Keep the UI label precise: this measures upload to the dashboard route; the API job's `progress` begins at extraction.

- [ ] **Step 3: Implement persistence and startup reattachment**

On provider mount, read the versioned local-storage key with `restoreQueue`. Fetch `/api/capture-jobs?skip=0&limit=12`; adopt only `queued` and `running` jobs not already stored, using the API filename/job ID. Persist after upload acceptance and every status/count/phase update. Start one resume pipeline per stored active item using an in-flight `Set` keyed by `jobId`.

Do not persist an unaccepted local `File`. If `localStorage` is unavailable, keep in-memory state and continue API work without crashing.

- [ ] **Step 4: Implement bounded polling and phase transitions**

After upload acceptance:

```ts
queued -> poll GET /api/capture-jobs/{jobId}
running -> phase extracting and use job.progress
complete -> phase analyzing
empty -> phase empty
failed -> phase failed with error_code
```

Poll every 1500 ms while `queued`/`running`, enforce the existing 15-minute client wait ceiling for a single active pipeline, use `cache: "no-store"`, and retain the stored job on timeout/network failure with a safe error message. Never map `complete` extraction directly to complete analysis.

- [ ] **Step 5: Implement duplicate-safe session analysis resume**

For a `complete` job, page through `/sessions?skip=<offset>&limit=500` and `/results?skip=<offset>&limit=200`. Build a set of existing result `session_id`s before POSTing. Submit only records whose session IDs are absent, one at a time to `/api/analyses`. After each successful response, persist `analyzedCount`; set phase `complete` only after all sessions are accounted for. An empty extraction sets phase `empty` without attempting analysis.

Fetch the newest result for `latestAnalysis` after a successful analysis batch. Keep the current `AnalysisRecord` shape and parse only required persisted fields; invalid result payloads become a visible provider error, not fabricated data.

- [ ] **Step 6: Verify provider wiring**

Run: `npx tsc --noEmit && npm run lint`

Expected: PASS after the workspace is switched to the provider in Task 3; before Task 3, only the planned consumer migration errors are acceptable.

- [ ] **Step 7: Commit provider and layout wiring**

```bash
git add components/providers/capture-queue-provider.tsx app/layout.tsx
 git commit -m "feat: persist capture jobs across navigation"
```

---

### Task 3: Render authoritative progress and remove local queue ownership

**Files:**
- Modify: `components/ui/analysis-workspace.tsx`
- Modify: `components/ui/task-rows.tsx`

**Interfaces:**
- Consumes `useCaptureQueue()` from Task 2.
- `QueuePanel` receives provider `queueItems` and renders `getQueueProgress(item)`; it does not call `fetch`, `setTimeout`, or maintain `jobStates`.
- `TaskRow.progress` is `number | null` and is rendered only when the value is finite.

- [ ] **Step 1: Replace workspace-local state and handlers**

Remove `attachments`, `jobStates`, `batchQueued`, `mounted`, `processAttachment`, polling helpers, and local queue handlers from `AnalysisWorkspace`. Use:

```ts
const {
  attachments,
  queueItems,
  isProcessing,
  canQueue,
  setAttachments,
  removeAttachment,
  queueFiles,
  latestAnalysis,
} = useCaptureQueue();
```

Keep the server-provided `analysis` as the fallback when `latestAnalysis` is null. Wire `AttachmentUpload` as a controlled value with `onValueChange={setAttachments}`, call `removeAttachment` from `onRemove`, disable it only while the provider is uploading/processing, and disable Queue batch when `canQueue` is false.

- [ ] **Step 2: Render phase-aware queue summary**

For the active item, display filename plus the progress object from `getQueueProgress`. Use copy exactly aligned with the API contract:

- ready: `Select captures, then queue the batch.`
- uploading: `Uploading <filename> to the dashboard.`
- queued: `Waiting for the extraction worker.`
- extracting: `The server is extracting mail sessions.`
- analyzing: `Analyzing <analyzedCount> of <sessionCount> sessions.`
- complete/empty/failed: state-specific terminal guidance.

The progress bar receives `aria-valuenow` only for determinate values. For `queued` and unavailable extraction telemetry, render an indeterminate visual state with no percentage. Keep the capture summary as `completed captures / total captures`; never label extraction progress as ETA.

- [ ] **Step 3: Add authoritative row progress**

Extend `TaskRow` with `progress?: number | null` and add a compact progress track below each row header when `progress !== null`. Use the provider phase's current progress, not a timer or file-count ratio. Include the phase/count in row details so a returned user can understand what is happening without opening another page.

- [ ] **Step 4: Verify the consumer migration**

Run: `node --experimental-strip-types --test test/capture-queue.test.ts && npx tsc --noEmit && npm run lint`

Expected: PASS with no references to `processAttachment`, `jobStates`, or a local polling loop in `analysis-workspace.tsx`.

- [ ] **Step 5: Commit the UI migration**

```bash
git add components/ui/analysis-workspace.tsx components/ui/task-rows.tsx
 git commit -m "feat: show authoritative capture progress"
```

---

### Task 4: End-to-end verification against the configured API

**Files:**
- No source changes unless a verification failure identifies a contract mismatch.

- [ ] **Step 1: Run static checks**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Expected: all commands pass. If `npm test` fails because Node cannot strip the repository's TypeScript syntax, replace the test script with a compatible built-in Node invocation before continuing; do not claim tests passed while the script is broken.

- [ ] **Step 2: Verify the API payload boundary without exposing secrets**

Use the configured server-side environment only to request `GET /capture-jobs?limit=10` and confirm responses contain the documented `capture-job.v1` fields. Do not print the API key or raw PCAP content.

- [ ] **Step 3: Run the browser flow with the valid backend fixture**

Start the existing dev server, upload `/Users/subham/Dev/SecureMail-ML-Backend/datasets/lab/captures/synthetic_mail.pcap`, and verify:

1. The upload bar reports measured upload percentage before the `202` response.
2. The row becomes `Queued`/`Extracting` from API status, not `Complete`.
3. Extraction progress uses API `progress` and remains distinct from analysis progress.
4. After extraction, the row reports `Analyzing n / total sessions` while `POST /api/analyses` requests run.
5. Navigate to `/history`, then return to `/analytics`; the same job and current status remain visible.
6. Refresh the browser after the API returns `202`; the stored job reappears and polling resumes.
7. Reopening/resuming does not POST session IDs already present in `/results`.
8. Invalid `/tmp/queue-state-check.pcap` is shown as a safe failed/rejected upload and never as a completed job.

Capture browser snapshot/text evidence and check for console errors. Stop the dev server after verification.

- [ ] **Step 4: Inspect the final diff and report limits**

Run `git status --short` and `git diff --stat`. Confirm no API key, PCAP bytes, generated build output, or unrelated user changes entered the diff. Report the known limits: upload interrupted before `202` cannot resume, server extraction telemetry currently has only `null/0/100`, and cross-tab duplicate coordination is not provided by the API.
