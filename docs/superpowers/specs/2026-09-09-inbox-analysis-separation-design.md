# Inbox and Separate Analysis Design

**Status:** Approved for implementation
**Date:** 2026-09-09
**Scope:** SecureMailScope frontend Inbox experience, separate Analysis navigation, typed fixture mode, and a future external Inbox API adapter

## 1. Objective

Replace the `/inbox` Coming Soon page with a live-data-shaped email investigation workspace based on the supplied reference screens. Keep email triage in Inbox and move risk findings, model output, and evidence review into a separate Analysis section.

The first implementation uses typed fixture data so the interface can be built and verified before the external service is available. The fixture contract must match the external list/detail contract closely enough that switching data sources does not require rewriting the UI.

No changes are required in `SecureMail-ML-Backend`. The future Inbox API is supplied by an external service and is treated as an untrusted, versioned integration boundary.

## 2. Product boundary

### Inbox owns email investigation

`/inbox` answers: **What message or mail transaction should I inspect, and what was observed in the message and network data?**

Inbox shows:

- sender, recipients, subject, timestamp, protocol, and bounded preview;
- all/flagged/healthy triage counts and client-side filters;
- per-view check indicators for headers, content, TCP, and TLS;
- selected-item Email, Headers, Content, TCP Stream, and TLS tabs;
- a link to the related Analysis record.

Inbox does not show the full model explanation view and does not contain an Analysis tab.

### Analysis owns security findings

The Analysis section answers: **Why was this item flagged, what did the models and deterministic rules observe, and what evidence supports the result?**

The navigation is:

```text
Analysis
  Flagged Emails  → /analytics/flagged
  All Analysis    → /analytics
```

`/analytics` retains the existing capture upload/processing workflow and persisted analysis results. `/analytics/flagged` is the filtered analysis entry point for backend-flagged items. Dashboard, History, and Settings remain outside this change.

## 3. Data-source architecture

The UI consumes a narrow source interface:

```ts
interface InboxDataSource {
  list(input: { skip: number; limit: number }): Promise<InboxListResponse>;
  detail(itemId: string): Promise<InboxDetailResponse>;
}
```

There are two implementations:

1. **Fixture source:** used now. It returns deterministic, screenshot-shaped data and is visibly marked `Preview data`.
2. **External source:** used when the friend’s list/detail API is supplied. It validates and maps the upstream payload into the normalized types above.

The external source is accessed through Next.js server code. Any upstream credential remains server-only and is never placed in a `NEXT_PUBLIC_*` variable or client bundle. The exact upstream URLs and authentication mechanism are configuration supplied at integration time; no endpoint path or credential is invented in the frontend before that contract is available.

The frontend exposes the same-origin routes `/api/inbox` and `/api/inbox/{itemId}` for list and detail loading. These routes proxy the configured external source and return safe, normalized JSON. They are frontend server routes, not changes to `SecureMail-ML-Backend`.

## 4. Normalized contracts

The normalized types are the contract between the data source and components. Upstream payloads that do not validate are rejected at the adapter boundary with a safe error; components do not read arbitrary upstream JSON.

### 4.1 List response

```ts
type InboxListResponse = {
  schema_version: "inbox-list.v1";
  total: number;
  skip: number;
  limit: number;
  counts: {
    all: number;
    flagged: number;
    healthy: number;
  };
  items: InboxListItem[];
};

type InboxListItem = {
  mail_item_id: string;
  capture_id: string | null;
  session_id: string | null;
  protocol: "SMTP" | "IMAP" | "POP3" | string;
  observed_at: string | null;
  sender: {
    name: string | null;
    address: string | null;
    host: string | null;
  };
  recipients: Array<{
    name: string | null;
    address: string | null;
  }>;
  subject: string | null;
  preview: string | null;
  triage_state: "flagged" | "healthy" | "unavailable";
  view_checks: {
    headers: ViewCheck;
    content: ViewCheck;
    tcp: ViewCheck;
    tls: ViewCheck;
  };
  analysis: {
    request_id: string | null;
    status: "complete" | "degraded" | "unavailable";
    risk_score: number | null;
    risk_class: string | null;
  };
};

type ViewCheck = {
  state: "pass" | "flagged" | "unavailable" | "not_observed";
  label: string | null;
};
```

`triage_state` and `view_checks` are authoritative upstream policy outputs. The UI must not calculate them from a risk score, missing value, or local heuristic. The list response counts are displayed as supplied and are not recomputed from a paginated page.

### 4.2 Detail response

```ts
type InboxDetailResponse = {
  schema_version: "inbox-detail.v1";
  item: InboxListItem;
  email: Section<EmailDetails>;
  headers: Section<HeaderDetails>;
  content: Section<ContentDetails>;
  network: Section<NetworkDetails>;
  tls: Section<TlsDetails>;
  analysis_ref: {
    request_id: string | null;
    status: "complete" | "degraded" | "unavailable";
    risk_score: number | null;
    risk_class: string | null;
  };
  diagnostics: string[];
};

type Section<T> = {
  state: "available" | "unavailable" | "redacted";
  data: T | null;
  reason: string | null;
  source: string | null;
};
```

The section payloads contain:

- **Email:** sender, recipients, subject, observed date, message ID, protocol, and bounded display metadata.
- **Headers:** allowlisted fields such as From, To, Subject, Date, Message-ID, Reply-To, Return-Path, and parsed SPF/DKIM/DMARC observations.
- **Content:** server-sanitized plain text, bounded length, truncation flag, and redaction notices. HTML is not rendered as executable markup.
- **Network:** stream ID, client/server addresses and ports, start/end time, duration, packet count, byte count, retransmission/order counts, TCP flags, and evidence ranges.
- **TLS:** STARTTLS advertised/used, handshake result/failures, negotiated version, cipher suite, supported versions/groups, certificate presence, expiry, chain, hostname, key, and signature metadata.

A section may be unavailable because the upstream source did not observe it, the capture was encrypted, or the source policy withheld it. The UI displays the supplied reason and never substitutes a safe-looking value.

Full model findings, explanations, diagnostics, and evidence references are fetched by the existing analysis resource using `analysis_ref.request_id`. Inbox uses the reference only to link to the separate Analysis experience.

## 5. Capture and persistence assumptions

This frontend does not parse PCAPs, run TShark, persist mail data, or change the capture worker. The external API owns whatever extraction and retention are needed to produce the normalized responses.

The frontend contract requires the external service to return only data it is authorized to expose. It must not return:

- credentials, private keys, TLS key logs, or secrets;
- arbitrary raw packet payloads;
- executable HTML or unrestricted MIME parts;
- unbounded raw email bodies or arbitrary headers.

A bounded, redacted plain-text content projection is acceptable when the upstream service provides one. A missing or encrypted projection remains explicitly unavailable.

## 6. Inbox interaction design

### Desktop

- Use a dark navy, dense two-pane workspace matching the reference screens.
- The left pane contains the Inbox heading, counts, segmented All/Flagged/Healthy controls, and the message table/list.
- The right pane contains the selected message header and detail tabs.
- The panes scroll independently within the existing viewport shell. The selected row uses a blue focus/selection treatment; flagged and healthy badges retain red and green semantic colors.
- Rows show sender/host, subject/preview, time, view-check chips, and triage state. Long identifiers and addresses truncate with accessible full-value titles.
- After a populated list loads, desktop selects the first available row unless the previously selected ID is still present. An empty list has no selected detail.

### Detail tabs

The selected detail header shows the triage label, subject, sender, recipients, and time. Tabs are:

```text
Email | Headers | Content | TCP Stream | TLS
```

The tab control is keyboard-operable. Switching tabs does not issue another request because the aggregate detail response has already been fetched. Each tab renders its own section state, source, and diagnostic reason where present.

An `Open analysis` link uses the stable `request_id`. It is absent or disabled when no analysis reference exists; the UI does not construct an analysis URL from a missing ID.

### Responsive behavior

- On narrow screens, show the list first and navigate to the detail view after selection.
- The detail view provides a visible back-to-list control.
- The tab strip remains horizontally usable without clipping.
- The desktop split is not merely compressed into unreadable columns.

## 7. Analysis interaction design

- Replace the current generic navigation label with an Analysis group containing Flagged Emails and All Analysis.
- All Analysis preserves capture upload, queue progress, persisted result rows, risk metrics, and evidence-oriented analysis details already implemented for `/analytics`.
- Flagged Emails loads the normalized `InboxDataSource.list` response and displays only rows whose backend-provided `triage_state` is `flagged`. It does not add an undocumented upstream filter or infer flagged status from numeric thresholds in the browser.
- Both routes link back to the selected Inbox item when a stable `mail_item_id` is available.
- Model probabilities, risk class, deterministic findings, explanations, action, evidence references, and diagnostics remain advisory/authoritative according to the existing analysis contract. Model explanations are not proof of attacker intent.

## 8. Fixture mode

Fixture mode is the current default until the external API contract is supplied.

The fixture source contains:

- 12 rows with the reference examples’ sender/subject/protocol patterns;
- authoritative-looking fixture counts of 12 total, 5 flagged, and 7 healthy;
- flagged and healthy view-check combinations;
- one selected flagged item with populated Email, Headers, Content, TCP Stream, TLS, and analysis-link data;
- explicit examples of unavailable/redacted section states;
- stable IDs so selection and links can be tested deterministically.

The UI shows `Preview data` near the Inbox heading. Fixture errors are handled through the same normalized error path as live errors. Live-mode errors never silently fall back to fixtures, because doing so would disguise an external outage as real mail data.

## 9. Loading, empty, and failure states

- **List loading:** neutral gray skeleton rows and controls; no semantic red/green verdict colors until data arrives.
- **List empty:** explain that no Inbox records are available; do not show fabricated counts or a selected detail.
- **List unavailable:** show a concise error, retry control, and no stale-looking fixture data.
- **Detail loading:** preserve the selected row and show detail skeletons.
- **Detail unavailable:** show retry and back-to-list controls without clearing the list.
- **Section unavailable:** keep the tab enabled when its state is known; show the supplied reason and `Not observed`/`Unavailable` labels as appropriate.
- **Section redacted:** explain that the source withheld the data; never imply that redaction means healthy.
- **Malformed upstream response:** show a safe integration error and record no raw payload in client logs.
- **Timeout/5xx:** use bounded server-side request timeouts and one user-triggered retry; do not loop indefinitely.

## 10. Accessibility and security requirements

- Use semantic navigation, headings, tables/lists, tab roles, selected state, and keyboard-visible focus.
- Give icon-only controls accessible names and preserve row names when the sidebar is collapsed.
- Ensure contrast for muted text, blue borders, red flagged badges, and green healthy badges on the dark surface.
- Do not render upstream HTML as trusted markup. Content is plain text or a sanitized representation defined by the external contract.
- Keep external credentials in server runtime configuration only. Never include them in client props, local storage, or browser requests to the upstream host.
- Do not log full message content, headers, or upstream response bodies in the browser.
- Preserve explicit degraded states; absence of certificate, content, or analysis data is not a positive security result.

## 11. Verification and acceptance checks

### Fixture checks

- Fixture payloads validate against `InboxListResponse` and `InboxDetailResponse`.
- The list renders 12 items and the supplied counts without calculating replacement values.
- Selecting a row loads the matching detail and switching all five tabs renders the corresponding section.
- Flagged/healthy filters operate on loaded rows without creating API query parameters.
- An unavailable or redacted fixture section stays explicit.
- The Analysis link uses the fixture request ID and does not appear for a missing ID.

### Browser checks

- `/inbox` renders the desktop two-pane workspace with no console errors.
- Selection, focus, keyboard tab navigation, retry, empty, and unavailable states work.
- Mobile renders list-first navigation and a usable back control.
- `/analytics` remains functional for capture upload and persisted analysis results.
- `/analytics/flagged` uses backend-provided triage state from its source.
- The sidebar exposes the Analysis group and correct active links.

### Live integration checks

When the external list/detail URLs and authentication contract are supplied:

1. The server adapter sends authenticated requests without exposing credentials to the browser.
2. A list response validates and renders without fixture data.
3. Selecting an item requests detail by its stable ID.
4. A 404, timeout, malformed payload, or unavailable section produces the documented state.
5. Browser bundles and network requests contain no upstream credential.

No live integration result is claimed while the external endpoint contract is unavailable.

## 12. Out of scope

- Changes to `SecureMail-ML-Backend`, its database, migrations, worker, or PCAP parser.
- Archive, delete, reply, forwarding, marking read, or other mailbox mutations.
- Raw packet-payload or unrestricted email-body viewing.
- Client-side security policy, risk thresholds, or triage heuristics.
- Export behavior or undocumented server-side Inbox filters.
- Live API wiring before the external list/detail schemas, URLs, and authentication behavior are supplied.
