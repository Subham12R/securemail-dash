# Analysis Response Display Design

**Status:** Draft for implementation
**Date:** 2026-09-09
**Scope:** Dashboard presentation of `analysis-response.v1`, fixed dashboard shell, and placeholder navigation pages

## 1. Objective

Display the persisted analysis response without turning advisory model output into a claim of attacker intent or a safe result. The dashboard summary remains fixture-backed until the frontend fetch boundary is wired to the backend.

The response contains three display layers:

1. A compact recent-analysis row.
2. A future analysis-detail view.
3. A degraded/diagnostic state that remains visible when optional model data is disabled or missing.

## 2. Contract boundary

The frontend receives an `analysis-response.v1` envelope with:

- top-level request metadata: `request_id`, `status`, and `diagnostics`;
- session context: capture, flow, session, source, protocol, ports, and observed features;
- result metadata: model bundle, risk, anomaly, model outputs, findings, explanations, action, evidence, and diagnostics.

The browser may format values and group fields for presentation. It must not infer flagged-session policy, attacker intent, evidence retention, or a positive security result from absent data.

## 3. Recent analysis row

The dashboard table keeps the requested columns:

- **Capture ID:** `session.capture_id`, falling back to `result.capture_id`.
- **Date:** the timestamp from the paginated analysis-list contract. The single analysis response shown in this spec has no timestamp, so the UI renders `—` until the list contract supplies one.
- **Protocols:** `session.protocol` as a visible protocol badge. TLS posture is not invented as a protocol; it belongs in the detail view as observations such as `starttls_advertised`, `starttls_used`, and `handshake_success`.
- **Risk score:** `result.risk.score`, a ratio in `[0, 1]`, formatted as a percentage with one decimal place and paired with an accessible progress bar. The supplied response displays `69.5%`. The risk class remains available to the detail view and assistive text.
- **Status:** the top-level response status (`complete` or `degraded`). `result.action` is a separate decision label and must not replace the transport status.

Missing values render as `—` or `Not observed`; they do not render as zero.

## 4. Analysis-detail view

When a detail route is implemented, render the response in this order:

### Decision summary

Show:

- risk class: `result.risk.class`;
- risk score: `result.risk.score`;
- source: `result.risk.source`, labelled advisory;
- action: `result.action`;
- minimum rule severity, or `None recorded` when null;
- the explanation disclaimer exactly or equivalently: model explanations describe model behavior and are not proof of attacker intent.

### Session context

Show the capture ID, flow ID, session ID, source type, protocol, source/destination ports, and analysis status. Keep identifiers copyable but do not add actions until an explicit interaction contract exists.

### Cryptographic posture

Show the raw observations as labelled values:

- STARTTLS advertised and used;
- handshake success and failures;
- TLS version and cipher suite when present;
- certificate presence and certificate validity fields when present;
- session duration, packet count, byte count, retransmissions, and ordering anomalies.

Boolean values render as `Yes`/`No`; null values render as `Not observed`.

### Model and anomaly state

Show XGBoost and Random Forest predicted classes/probabilities as advisory model outputs. Show anomaly status explicitly. For the supplied response, anomaly is `Disabled`, detected is `No`, and the diagnostic `isolation_forest_removed` remains visible as a degraded capability note.

### Explanations and evidence

Show the highest-impact explanation entries grouped by model and feature view. Preserve direction (`increases_risk` or `decreases_risk`), observed value, contribution, and evidence references. Keep the supplied evidence reference visible as a source reference, not as a fabricated packet link.

## 5. Shell and navigation

- The body owns a fixed viewport (`h-screen`) and prevents an outer page scrollbar.
- The sidebar owns the full viewport height and remains fixed/sticky at the left while the main content scrolls independently.
- The dashboard topbar remains sticky at the top of the scrolling main area.
- The topbar contains a `Dashboard > Current page` breadcrumb. `Dashboard` is an internal link to `/`.
- The topbar also exposes a `Dashboard` link for non-dashboard pages.
- Sidebar links resolve to `/`, `/analytics`, `/history`, and `/settings`.
- Analytics, History, and Settings currently render an accessible `Coming soon` page rather than a dead link or 404.
- The external sidebar collapse control remains outside the sidebar and the sidebar starts collapsed on narrow viewports.

## 6. Preview boundary

The current dashboard uses typed fixture data. The supplied response is represented by the first recent-analysis fixture row so the mapping is visible without claiming that the browser has fetched it. Live integration is deferred until the list/detail API boundary and timestamp contract are finalized.

## 7. Acceptance checks

- The response mapping is documented and null/disabled fields have explicit display rules.
- The recent table shows capture ID, date, protocol, risk score bar, and status.
- The supplied capture ID and `69.5%` risk score are represented in the preview row.
- The main page scrolls without moving the full-height sidebar.
- The topbar remains visible while the main content scrolls and its Dashboard links resolve to `/`.
- `/analytics`, `/history`, and `/settings` render coming-soon states with correct breadcrumbs.
- Collapsed sidebar links retain accessible names and the table's horizontal scroll region is keyboard accessible.
- No UI copy presents `model_ensemble_advisory` as proof of malicious intent or treats missing certificate/TLS values as secure.

## 8. Deferred work

- Fetch recent records from `GET /api/v1/analyses`.
- Fetch detail records from `GET /api/v1/analyses/{request_id}`.
- Add an analysis-detail route and explanation/evidence interactions.
- Define the authoritative flagged-session and evidence-archive aggregates.
- Apply the selected date range to API queries.
