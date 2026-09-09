# SecureMailScope live API contract

## Current observation

The configured API is reachable from the frontend server. The current live responses are healthy but empty:

- `GET /api/v1/health`: healthy; bundle and calibration loaded; XGBoost and Random Forest reported.
- `GET /api/v1/analyses/stats`: `total_analyses: 0`, empty `verdict_distribution`.
- `GET /api/v1/analyses?limit=3`: `total: 0`, `records: []`.

This is an empty database/result-set state, not a frontend rendering failure.

## Frontend requirements already wired

The frontend makes these server-side requests:

```text
GET ${SECUREMAILSCOPE_API_URL}/health
GET ${SECUREMAILSCOPE_API_URL}/analyses/stats
GET ${SECUREMAILSCOPE_API_URL}/analyses?limit=5
GET ${SECUREMAILSCOPE_API_URL}/analyses?skip=<offset>&limit=10
Authorization: ${SECUREMAILSCOPE_API_KEY}
```

`SECUREMAILSCOPE_API_URL` already includes `/api/v1`; it must not be appended a second time. The key must remain in `.env`/server runtime configuration and must never use a `NEXT_PUBLIC_` variable or be sent from browser JavaScript.

The `/history` route uses `skip`/`limit` from the URL page query and renders previous/next pagination from `total`, `skip`, `limit`, and `records`.

The frontend expects:

- `StatsResponse.total_analyses`
- `StatsResponse.avg_risk_score` as a number in `[0, 1]` or `null`
- `StatsResponse.verdict_distribution[]` with `{ verdict, count }`
- `AnalysisListResponse.records[]` with `id`, `request_id`, `session_id`, `timestamp`, `risk_score`, `final_verdict`, and the persisted detail fields
- `HealthResponse.status`, `bundle_loaded`, `calibration_loaded`, and `model_names`

## Frontend loading and empty states

Route loading skeletons now cover metric cards, bar charts, pie/posture charts, queue rows, and tables while the server request is pending. Once the API responds with an empty result, the UI shows an explicit `No data yet`/`not supplied` state instead of presenting a fabricated zero, percentage, or completed job.

## How to populate the current API

Use the existing Bruno analysis request (`09-analyze-dummy-pcap-session.bru`) or an authorized client to send:

```text
POST /api/v1/analyses
Authorization: <raw configured API key>
Content-Type: application/json
```

The body must be an `analysis-request.v1` envelope containing a valid `session-features.v1` record. This endpoint accepts structured session JSON; it does **not** accept a PCAP multipart upload.

After a successful response, verify in order:

1. `POST /api/v1/analyses` returns `200` with `status` `complete` or `degraded`.
2. `GET /api/v1/analyses/stats` reports `total_analyses > 0`.
3. `GET /api/v1/analyses?limit=5` returns records.

If step 1 succeeds but steps 2–3 remain empty, inspect the backend database URL, database file/instance, transaction commit path, and runtime logs. The frontend cannot create records by reading these endpoints.

### Backend persistence blocker found in the referenced source

The referenced `api/routes.py` persistence block currently reads fields that are not present in the active `MLResult`/`SafeSessionContext` contracts, including `session_context.client_id`, `result.risk_score`, `result.final_verdict`, and `result.ml_scores`. It catches the persistence exception and still returns a successful analysis response. That can produce exactly the observed state: a successful-looking POST with `total_analyses: 0` afterward.

Fix the mapper at the backend boundary instead of changing the frontend:

```text
client_id       <- session_context.capture_id
risk_score      <- result.risk.score
final_verdict   <- result.risk.class
ml_scores       <- result.model_outputs
trigger_details <- result.rule_findings
model_bundle    <- { version: result.model_bundle_version }
```

`rule_score` has no active MLResult field. Make it nullable (and migrate the database) or add a documented rule-score contract; do not silently write `0.0`. Flush/commit the row and return a failure response when persistence fails instead of swallowing the exception. Add an integration test that posts one valid record, then asserts stats and list each contain it.

## Required backend work for the PCAP workspace

The current backend has no multipart PCAP/tshark job contract. To make the upload UI perform real work, add an authenticated server-side job API:

```text
POST /api/v1/capture-jobs                 multipart PCAP/PCAPNG -> 202 { job_id, files[] }
GET  /api/v1/capture-jobs/{job_id}        job + per-file state + progress
GET  /api/v1/capture-jobs/{job_id}/results paginated persisted analysis results
```

The worker owns tshark execution, file validation, bounded retries, progress, and result persistence. The browser must only poll the job endpoint; it must not execute tshark or invent progress/ETA.

For the dashboard fields not present in the current API, add explicit backend fields rather than deriving security meaning in the UI:

- `flagged_sessions`
- `evidence_archived`
- `cryptographic_posture_distribution`
- per-record `capture_id` and `protocol` (the current list response does not expose protocol)
- an explicit record/job status if `complete` versus `degraded` is needed after persistence

## Do not fix this by

- hard-coding records, percentages, zero-risk values, or fake loading completion;
- treating an empty `records` array as a failed request;
- mapping `final_verdict` to a cryptographic risk class in the frontend;
- exposing the API key through client components or `NEXT_PUBLIC_*` variables;
- sending raw PCAPs to `/api/v1/analyses`; or
- showing an ETA/progress value before the job API supplies telemetry.
