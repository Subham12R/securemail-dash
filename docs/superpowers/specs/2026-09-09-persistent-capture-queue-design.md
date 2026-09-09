# Persistent capture queue and real progress

**Status:** Proposed
**Date:** 2026-09-09
**Scope:** SecureMailScope dashboard capture upload, queue state, and resume behavior

## Objective

Make the analytics capture queue reflect the SecureMail API instead of page-local guesses. Users must see actual upload progress, API-reported extraction progress, and completed session-analysis progress. Queue state must survive navigation between dashboard routes and browser refresh/reopen for jobs already accepted by the API.

## Backend contract

Use the existing authenticated same-origin proxy routes and the contract in `/Users/subham/Dev/SecureMail-ML-Backend/docs/api.md`:

1. `POST /capture-jobs` accepts one PCAP/PCAPNG and returns `202 capture-job.v1`.
2. `GET /capture-jobs/{job_id}` is authoritative for `queued`, `running`, `complete`, `empty`, or `failed`, plus `progress`, `session_count`, and `processed_sessions`.
3. `GET /capture-jobs/{job_id}/sessions` returns validated session records after terminal extraction.
4. `GET /capture-jobs/{job_id}/results` returns persisted analysis records.
5. Each session is sent separately to `POST /analyses`; raw PCAP bytes never enter that endpoint.

No API key is exposed to client code and no backend endpoint is invented.

## Architecture

Add a client `CaptureQueueProvider` under the existing root layout. The provider owns queue state and the long-running upload/poll/analyze pipeline, so an App Router route transition does not unmount the owner of the work. `AnalysisWorkspace` becomes a view/controller over the provider rather than owning polling state.

The provider stores only serializable metadata in `localStorage` under a versioned key. It never stores a `File`, PCAP bytes, API key, response body, or sensitive diagnostics. A stored entry contains the stable job ID once accepted, filename/size, latest safe job response, current phase, analysis count, error code, and update timestamp. Invalid or stale local data is ignored. Active backend jobs returned by the authorized `GET /capture-jobs` list are adopted on startup so work from before the persistence change is not invisible.

A full refresh can resume accepted jobs because the API job ID and server state are durable. If the browser is closed during the local upload before the API returns a job ID, that upload cannot be resumed; the UI reports it as interrupted rather than claiming completion. The server worker continues extraction independently after acceptance.

## State and progress

Use explicit phases:

- `ready`: selected locally; no network request started.
- `uploading`: browser upload is active; progress is `loaded / total` from `XMLHttpRequest.upload.onprogress`.
- `queued`: API accepted the capture and is waiting for its worker; extraction progress is `null` and the UI says “Waiting for worker”.
- `extracting`: API status is `running`; use the API's `progress` only.
- `analyzing`: extraction is terminal and each missing session is submitted individually; use `analyzedCount / sessionCount` from successful API requests.
- `complete`: all available sessions have persisted results.
- `empty`: extraction completed with no supported sessions.
- `failed`: show the safe API error code or a bounded client error and recovery guidance.

The queue summary remains `completed captures / total captures`. The visible progress bar is explicitly labeled with the current capture and phase; it is never an ETA and never combines unrelated phases into a fabricated percentage. When the API supplies no numeric extraction progress, render an indeterminate waiting state rather than a guessed value. Terminal extraction progress of `100` does not mean analysis is complete; analysis gets its own progress phase.

## Data flow

1. The workspace adds local files to the provider without network calls.
2. Queueing starts one bounded pipeline per selected file. Upload response metadata is persisted immediately.
3. The provider polls active jobs at a bounded interval using `cache: no-store` and persists every authoritative status update.
4. After `complete`, it retrieves all session records with bounded pagination.
5. It retrieves existing results first and skips session IDs already persisted, preventing normal refresh/resume from creating duplicate analysis rows.
6. It submits remaining records one at a time, persisting the analyzed count after each successful response.
7. It refreshes the latest result from the job's results endpoint and exposes it to the analytics view.

At most one provider pipeline claims a job per browser tab. Cross-tab coordination and server-side analysis orchestration are outside the current API contract and remain a known limitation.

## UI changes

- Replace the current file-count-only bar with a phase-aware real progress bar.
- Show the current filename, phase, numeric progress where authoritative, and session counts during analysis.
- Keep the task row status synchronized with the same provider state used by the bar.
- Explain the next step for ready, queued, extracting, analyzing, empty, complete, and failed states.
- Preserve existing neutral loading colors, accessibility labels, semantic terminal colors, and no-ETA policy.

## Error and retry behavior

- Parse only safe `detail`/`error_code` values returned by the proxy.
- Do not retry malformed uploads or terminal API failures automatically.
- Poll network errors with bounded backoff while retaining the stored job; show a recoverable unavailable state when polling cannot continue.
- Do not delete or overwrite server jobs when a local queue entry is removed. The API has no cancellation endpoint.

## Acceptance checks

- Starting a valid upload shows measured upload bytes rather than a timer animation.
- A `202` response changes the row to `Queued` immediately; `running` uses API `progress`; completed extraction changes to `Analyzing` and displays analyzed session counts.
- The header, progress bar, and row never show contradictory states such as `Complete` with `0 / 1` and `Ready`.
- Navigating to another dashboard route and returning preserves the active job and current API state.
- Refreshing/reopening the app rehydrates accepted jobs and continues polling/resume analysis without duplicate results for already persisted session IDs.
- Raw PCAP data is sent only to `/api/capture-jobs`; structured session records are sent one per request to `/api/analyses`.
- TypeScript, lint, production build, and a browser flow covering upload → route change → return → status display pass.

## Deferred

Incremental server-side TShark telemetry, backend-owned session-analysis orchestration, cancellation, and cross-tab locks require backend contracts not present in `docs/api.md`.
