# History Analysis Detail Page Design

**Status:** Approved for implementation
**Date:** 2026-09-10
**Scope:** A separate History detail page with source-specific email/PCAP views, Inbox-detail parity, and a static AI panel demo

## 1. Objective

Replace the History table's current Inbox-side-sheet link with a full-page analysis detail route. The page is inspired by the supplied Resend-style screenshot: a large record header, metadata, activity/content area, and a focused central reading surface. It must remain a SecureMailScope investigation page, not a Resend clone.

The page has two source-specific experiences:

- **Email client response:** show the email identity and every safe detail currently available in the Inbox inspection side sheet.
- **Analysed PCAP:** show the persisted analysis record, ML/model fields, feature or series keys when the backend actually supplies them, evidence, findings, and an explicit available/missing inventory.

Both experiences share the same route, shell, responsive layout, failure states, and right-side collapsible AI-information demo. The AI panel is presentation-only for this phase; it does not call an LLM or claim to produce live analysis.

## 2. Current state and visual reference

The current History action navigates to:

```text
/inbox?requestId=<request_id>&tab=network
```

That route can open the existing native Inbox inspection sheet only when the request ID matches a currently available Inbox item. It is not a durable full-page record view.

The supplied screenshot establishes the visual direction:

- white page background with generous spacing;
- prominent mail icon and sender/record identity;
- From, Subject, To, and ID metadata near the top;
- optional provider/template/log information only when a typed source contract supplies it;
- an activity/event area when typed event data exists;
- a large bordered content surface with clear tabs.

The public Resend URL used as the reference redirects unauthenticated visitors to `https://resend.com/login`. No authenticated Resend data or markup is copied into this feature.

## 3. Product boundary

### History owns the durable record page

History answers: **What was analyzed, which source produced it, what information was available, and what did the analysis record contain?**

Activating the History link opens the full detail route directly. It does not open the Inbox dialog, select the first Inbox item, or silently fall back to another record.

The existing Inbox route remains unchanged for Inbox-first inspection. Its `Open analysis` action continues to target the existing `/analytics?requestId=...` workflow unless a later request changes that boundary.

### The detail page is read-only

This page may expose safe copy/read navigation controls, but it does not send mail, convert templates, reply, forward, archive, delete, or mutate analysis records. Screenshot actions such as template conversion are visual references only and are not part of this phase.

## 4. Route and navigation contract

The new route is:

```text
/history/[requestId]
```

The History table's network/details action uses:

```text
/history/${encodeURIComponent(record.request_id)}
```

The request ID is trimmed and bounded before it is used for the server lookup. An empty request ID has no detail link and remains an explicit unavailable value in the row.

The page is a normal App Router page inside the existing SecureMailScope shell. It supports direct navigation and reload. It does not use a dialog or the Inbox sheet's focus-return behavior.

The page topbar contains a History breadcrumb and the current record context. The existing sidebar remains visible on desktop and the page's main content owns its scroll area.

## 5. Source classification

Source classification is deterministic code, not an AI prompt and not a presentation-only heuristic. Add a shared classifier with this contract:

```ts
type AnalysisSourceKind =
  | "email_client"
  | "analysed_pcap"
  | "synthetic"
  | "unknown";

function classifyAnalysisSource(record: AnalysisRecord): AnalysisSourceKind;
```

Rules, in order:

1. `record.is_synthetic === true` → `synthetic`.
2. A source label, capture ID, or session ID containing `pcap`/`capture` → `analysed_pcap`.
3. A source label containing `email`/`mail`/`client`, or a non-empty `client_id` → `email_client`.
4. Otherwise → `unknown`.

The classifier returns a source kind and display label. It does not infer risk, verdict, or security posture. `synthetic` and `unknown` use the PCAP-style record view with an explicit source state rather than pretending to be an email client response.

The phrase “series codes” is interpreted as backend-provided model/feature keys or fields inside the persisted model output. No new `series_codes` field is invented. If the active contract does not provide those keys, the page reports them as not supplied.

## 6. Server-side data flow

The detail page loads data on the server:

1. Validate and decode the route request ID.
2. Call the existing `getAnalysisByRequestId(requestId)` SecureMail proxy function.
3. Classify the returned `AnalysisRecord`.
4. For an email-client record, resolve the matching safe Inbox detail by request ID using the existing Inbox source seam. The server may list the bounded Inbox page, find `item.analysis.request_id`, and then call `detail(item.mail_item_id)`; no undocumented upstream request-by-request-ID endpoint is introduced.
5. Build a bounded detail view model before passing data to client components.

The API key remains in server runtime configuration. Client components receive only typed projections. The source adapter remains the only code allowed to read arbitrary upstream Inbox fields.

If the history record exists but no current Inbox item matches its request ID, the email view still renders the SecureMail analysis metadata and shows an explicit `Inbox details unavailable for this record` state. It never selects another email or fabricates the missing side-sheet data.

## 7. Detail view model

The page should not pass the raw `AnalysisRecord`'s `unknown` nested objects directly to the browser. Create a bounded projection with this shape:

```ts
type SafeAnalysisEntry = {
  path: string;
  value: string;
};

type AnalysisDetailViewModel = {
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
  inbox: {
    state: "available" | "not_found" | "unavailable";
    detail: InboxDetailResponse | null;
    reason: string | null;
  };
};
```

Structured SecureMail values are flattened into bounded path/value entries with a fixed maximum depth, entry count, and string length. Omitted values are represented in `missing_fields`; raw nested JSON is not serialized into client props. Scalar summary fields use the existing validated `AnalysisRecord` fields.

The required PCAP/model availability inventory includes:

```text
capture_id
session_id
protocol
posture
model_bundle
ml_scores
explanations
rule_score
trigger_details
evidence_ref_count
```

A missing field is displayed as `Not supplied` or in the missing inventory. A zero, empty array, disabled capability, and missing field remain distinct.

## 8. Shared page layout

The page uses a three-zone application composition:

```text
existing sidebar | main detail workspace | collapsible AI information panel
```

The main detail workspace is the primary reading surface and receives the available width. The AI panel is a bounded right column, approximately 20–24rem on desktop, with its own scroll behavior. A collapse control changes it to a narrow labelled rail without removing its accessible name.

On mobile:

- the sidebar follows existing responsive behavior;
- the detail workspace becomes the primary full-width content;
- the AI panel moves below the detail content or opens as a full-width disclosure;
- no horizontal page overflow is introduced;
- the main information remains readable without requiring the AI panel.

The page uses the existing white visual system, bordered cards, semantic verdict colors, and neutral loading placeholders. It does not introduce a generic anomaly dashboard or a second full-page navigation system.

## 9. Email client response view

When `source === "email_client"`, the center workspace follows the screenshot's email-detail composition while retaining the existing Inbox detail contract.

### Header and metadata

Show:

- mail icon and `Email client response` source label;
- sender identity as the primary heading, falling back to `Sender unavailable`;
- subject as the supporting heading;
- From, Subject, To, and ID metadata;
- timestamp, protocol, triage state, risk class, and risk score when supplied;
- a compact analysis reference using the current request ID.

Provider/template/log labels and an event timeline are conditional. The current SecureMailScope/Inbox contracts do not provide those fields, so the first implementation omits them or shows an explicit unavailable section rather than inventing provider data or event timestamps.

### Inbox parity

The full page must carry every safe detail currently shown in the Inbox inspection side sheet:

```text
Email
Headers
Preview / safe content
TCP Stream
TLS
```

The existing normalized `InboxDetailResponse` remains authoritative. Reuse or extract the existing section renderers rather than creating a second mapping. The page must preserve:

- email envelope metadata;
- allowlisted headers and SPF/DKIM/DMARC results;
- bounded, redacted plain-text preview;
- IP reputation, including Spamhaus state, quality score/level/source, IPInfo fields, and bounded issues;
- TCP stream fields and flags;
- TLS negotiation, version status, warnings, and certificate posture;
- section-level unavailable/redacted reasons and diagnostics.

The content surface defaults to the safe preview. HTML and raw message bytes remain restricted by the existing project boundary; a screenshot-inspired HTML/Raw affordance may only render a disabled/restricted state explaining why it is unavailable.

## 10. Analysed PCAP view

When `source === "analysed_pcap"` (and for `synthetic`/`unknown` with an explicit source label), the center workspace is analysis-first rather than mail-first.

### Header and record identity

Show:

- `Analysed PCAP capture` source label;
- capture/session identity;
- request ID;
- protocol, posture, timestamp, and client ID when supplied;
- risk score and final verdict with semantic colors;
- a visible degraded/source state when the source is synthetic or unknown.

### ML/model section

Show the bounded entries from:

- model bundle/version;
- model scores and predicted classes/probabilities;
- explanation entries and their feature keys/contributions when supplied;
- deterministic rule score and findings;
- evidence reference count and evidence references when the validated record provides them;
- model/feature/series keys only when present in the backend payload.

The page must not turn model output into proof of attacker intent. It must label advisory model output and preserve the existing analysis disclaimer where explanations are shown.

### Availability section

Show a compact `Available`/`Not supplied` inventory for the required fields. This lets a reviewer distinguish “the model returned an empty result” from “the API did not return that field.” No zero or completed state is substituted for absent telemetry.

### Related Inbox evidence

If a safe Inbox detail matches the request ID, expose the same Inbox parity sections described above as a related evidence area. If it does not match, show the explicit unavailable state and keep the PCAP analysis view usable. The page must not make the live Inbox's first record appear related to an unrelated PCAP.

## 11. AI information panel demo

The right panel is a static, source-aware demo for this phase.

It contains:

- a collapsible heading such as `AI analysis assistant`;
- source and record-status badges derived from the typed view model;
- a small `Available fields`/`Missing fields` summary;
- seeded assistant copy that clearly says live AI is not connected;
- source-specific example prompts such as `Summarize this record`, `What fields are missing?`, and `Explain the model output`;
- a disabled or local-only composer labelled `Demo only`.

The demo does not:

- call an AI provider;
- send analysis data to a chat endpoint;
- persist chat messages;
- claim a live explanation or recommendation;
- place business/security policy in a prompt.

Any future AI implementation will consume the same bounded view model through a separately specified server boundary.

## 12. Loading, empty, and failure states

- **Page loading:** neutral skeleton for the header, metadata, main detail surface, and AI panel.
- **Missing request ID:** safe invalid-route state with a link back to History.
- **Analysis not found:** `Analysis record unavailable` with the request ID omitted from error text if it is invalid or sensitive, plus a History link.
- **SecureMail error:** preserve the existing safe API error style; do not render partial arbitrary payloads.
- **Email Inbox match unavailable:** render the analysis header and a bounded unavailable state for Inbox parity details.
- **Section unavailable/redacted:** preserve the existing Inbox section component semantics and reason.
- **Unknown source:** render the PCAP-style generic record view and mark the source as not supplied.
- **Model field absent:** show `Not supplied` and include the field in the availability inventory.
- **AI demo:** always available as a static demo; no network failure is implied because no AI request is made.

## 13. Accessibility and security

- Use real headings in order, semantic metadata lists, accessible tabs/disclosures, and labelled collapse controls.
- The collapse control exposes `aria-expanded` and a stable label; collapsed AI content is removed from the tab order.
- Keyboard users can navigate the content tabs and return to History without relying on browser back.
- Icon-only actions have accessible names.
- The page maintains visible focus and does not create an inaccessible nested dialog.
- Keep `SECUREMAILSCOPE_API_KEY` server-only; no `NEXT_PUBLIC_*` secret or browser-to-upstream request is added.
- Render only normalized Inbox data and bounded analysis entries. Never use `dangerouslySetInnerHTML` for message content.
- Never expose raw HTML, raw message bytes, credentials, private keys, packet payloads, or unbounded nested API data.
- Do not log API responses or AI context in the browser.
- Treat source labels, model keys, explanations, and event text as untrusted display data.

## 14. Verification and acceptance checks

### Contract and unit checks

- `classifyAnalysisSource()` returns the expected kind for email-client, PCAP, synthetic, and unknown records.
- The detail projection bounds strings, depth, entry counts, and nested values without serializing raw objects.
- Missing model fields appear in `missing_fields` and do not become fabricated zeros.
- A matching Inbox request ID returns the normalized detail; an unmatched ID returns `not_found` without selecting another item.
- Existing Inbox detail tests continue to cover all five sections, IP reputation, TLS status/warnings, and redacted/unavailable states.

### Browser checks

- A History action navigates to `/history/<requestId>`, not `/inbox` and not a dialog.
- An email-client fixture renders the screenshot-inspired header and all five existing Inbox detail sections.
- A PCAP fixture renders model bundle/scores/explanations/findings and the available/missing inventory.
- The AI panel collapses and expands with an accessible control and contains explicit demo-only copy.
- Direct route reload, missing record, unmatched Inbox detail, and partial sections render truthful states.
- Desktop and mobile layouts have no horizontal overflow or console errors.
- Axe reports no violations on both source variants and with the AI panel collapsed.
- Browser network inspection shows no direct upstream credential or AI request.

### Static checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

## 15. Out of scope

- Authenticated Resend integration or copying Resend account data.
- A production AI/chat backend, streaming responses, tools, MCP, chat persistence, or prompt orchestration.
- New SecureMail-ML-Backend endpoints, database changes, migrations, or model fields.
- Inventing `series_codes`, email events, templates, provider logs, or an upstream request-ID lookup endpoint.
- Rendering raw HTML, raw email bytes, raw packet payloads, or unrestricted headers.
- Mail mutations, template conversion, export, delete, reply, forwarding, or archive actions.
- Replacing the existing Inbox sheet for Inbox-originated selections.
