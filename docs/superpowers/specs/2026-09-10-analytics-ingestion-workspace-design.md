# Analytics Ingestion Workspace Design

**Status:** Draft for backend contract review
**Date:** 2026-09-10
**Scope:** PCAP analysis workspace, batch progress, response presentation, and expandable results

## 1. Objective

Give an authorized analyst one place to submit a PCAP or a batch of PCAP files, see ingestion progress, inspect the resulting risk/model signals, and expand a result row into evidence-first details.

The current frontend implementation is preview-only. It accepts local file selection and renders the supplied `analysis-response.v1` fixture, but it does not execute tshark or upload files. This prevents the browser from pretending that a backend ingestion contract exists.

> “D-Shark” is interpreted as `tshark`, the command-line Wireshark capture reader. Confirm if a different converter is intended.

## 2. Current backend boundary

The existing backend exposes:

- `POST /api/v1/analyses` for one validated `session-features.v1` JSON record;
- `GET /api/v1/analyses` for persisted analysis rows;
- `GET /api/v1/analyses/{request_id}` for one persisted result;
- `GET /api/v1/analyses/stats` for aggregates.

It does not currently expose multipart PCAP upload, tshark execution, batch jobs, job progress, or a durable capture artifact contract. The browser must not send raw PCAP bytes to the single-session JSON endpoint.

## 3. Proposed production flow

1. The browser validates file extension, size, and batch count at the trust boundary.
2. The browser uploads files to a dedicated capture-ingestion endpoint using multipart form data.
3. A restricted server-side worker stores each file in temporary storage and invokes an allowlisted tshark command. The browser never shells out to tshark.
4. The worker converts each capture into one or more validated `session-features.v1` records.
5. Each session record is analyzed through the existing ML boundary or an internal batch equivalent.
6. The job persists result references and exposes bounded progress to the browser.
7. The browser renders rows as they become available and keeps failed/degraded sessions visible.

The proposed job API needs backend approval before frontend integration:

- `POST /api/v1/capture-jobs` — multipart files, returns `202` with `job_id` and accepted-file metadata;
- `GET /api/v1/capture-jobs/{job_id}` — job state, per-file state, session counts, and safe error codes;
- `GET /api/v1/capture-jobs/{job_id}/results` — paginated analysis records;
- optional `POST /api/v1/capture-jobs/{job_id}/cancel` — only after cancellation semantics are defined.

Use an idempotency key derived from the upload request and file hashes. Do not retry a file indefinitely; expose `queued`, `converting`, `analysing`, `complete`, `degraded`, `failed`, and `rejected` states.

## 4. Analytics page layout

The page is ordered for triage:

### Capture input

- Use the `@beui/attachment-upload` component for a native multi-file dropzone accepting `.pcap` and `.pcapng`.
- Single and batch selection use the same queue.
- Each queued file shows name, size, and state.
- A right-side `TaskRows` queue shows per-file loaders, expandable task details, processed count, and ETA. Preview mode displays `ETA pending` rather than inventing duration.
- Primary action is `Queue batch` in preview mode and becomes `Analyze captures` after the ingestion API is available.
- The UI must state when conversion/upload is unavailable; it must not display a fake progress state.

### Current analysis summary

For the selected or latest result, show:

- ensemble risk score and risk class;
- XGBoost risk probability;
- Random Forest risk probability;
- anomaly state and detected flag;
- action as an analyst prioritization, not an automated remediation.

The supplied response renders `69.5%` ensemble risk, `High`, XGBoost `75.0%`, Random Forest `61.2%`, anomaly `Disabled`, and action `Prioritize`.

Do not label `risk.score` as generic confidence. It is an advisory risk score. Model probabilities remain separate signals.

### Results table

Each row shows:

- capture ID;
- protocol;
- risk-score bar with numeric percentage;
- transport status;
- an expand control.

Rows are keyboard-operable. The expanded panel shows:

- observed posture and the main analyst-facing issue;
- session observations with null values rendered as `Not observed`;
- model probabilities and their advisory disclaimer;
- model bundle version;
- evidence references;
- anomaly status and diagnostics.

A missing or disabled signal must remain explicit. It must not be rendered as safe, zero risk, or successful encryption.

## 5. Response mapping

For `analysis-response.v1`:

- capture ID: `session.capture_id`, fallback `result.capture_id`;
- session ID: `session.session_id`;
- protocol: `session.protocol`;
- risk class: `result.risk.class`;
- risk score: `result.risk.score * 100`, formatted to one decimal place;
- status: top-level `status`;
- action: `result.action`;
- model bundle: `result.model_bundle_version`;
- anomaly: `result.anomaly.status` and `result.anomaly.detected`;
- XGBoost signal: `result.model_outputs.xgboost.risk_probability`;
- Random Forest signal: `result.model_outputs.random_forest.risk_probability`;
- observations: `session.observations`;
- evidence: `result.evidence_refs`;
- diagnostics: merge result and envelope diagnostics without hiding duplicates.

The response's `rule_findings` array is authoritative for deterministic findings. An empty array must not be replaced with a frontend-generated finding. The frontend may summarize raw observations as posture, but policy rules remain backend-owned.

## 6. States

- **Empty:** Explain accepted file types, privacy boundary, and the analysis action. Do not show risk values.
- **Ready:** Files are selected locally but not uploaded.
- **Queued:** The backend accepted a batch and returned a job ID.
- **Converting:** tshark extraction is running server-side.
- **Analysing:** sessions are being scored.
- **Partial:** completed rows render beside failed/degraded rows.
- **Complete:** all accepted sessions have results.
- **Degraded:** result is visible with unavailable capabilities and diagnostics.
- **Rejected/failed:** show safe error code and recovery guidance; never echo secrets or full traces.

## 7. Security and reliability boundaries

- Raw PCAP files may contain sensitive network metadata. Enforce authorization, size/count limits, retention, and deletion policy before ingestion.
- Never run tshark in the browser or from an unsandboxed request handler.
- Do not expose raw email bodies, credentials, key material, internal paths, or full packet payloads in the dashboard.
- Keep upload retries bounded and idempotent.
- Preserve request IDs, job IDs, capture IDs, and evidence references for supportability.
- Model explanations describe model behavior and are not proof of attacker intent.

## 8. Acceptance checks

- Analytics opens with an input area, batch-capable file selector, current-analysis metrics, and an expandable results table.
- Selecting multiple files updates the attachment component and right-side task queue without network calls in preview mode.
- Queued task rows show loaders, expandable conversion/ETA details, and `ETA pending` until backend telemetry exists.
- The supplied analysis response is represented accurately, including `pcap-82398e69c96f0dfd`, `69.5%`, `High`, model probabilities, disabled anomaly state, and evidence/diagnostic text.
- Expanding the table row reveals the main posture issue, observations, model bars, evidence, and diagnostics.
- Null/disabled values remain explicit and no UI claims attacker intent.
- Production upload and batch analysis remain blocked until the proposed job contract is implemented and authenticated.
