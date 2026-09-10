# SecureMailScope landing-page content brief

## Purpose

Replace the current landing-page copy with a clear, evidence-led product story that explains:

1. what SecureMailScope analyzes;
2. how the analysis works;
3. what a user receives after analysis; and
4. who benefits from the result.

This is a content and showcase brief, not a claim that the current landing page already implements every interaction below.

## Product positioning

### One-line description

> SecureMailScope analyzes SMTP, IMAP, and POP3 traffic from packet captures and shows how the mail transport was secured, session by session.

### Primary promise

> Turn a packet capture into an evidence-backed view of mail-transport security.

### Supporting promise

> Reconstruct the session, inspect the TLS and certificate evidence, apply deterministic security rules, and keep the result traceable to the analyzed traffic.

### Product vocabulary

Use these terms consistently:

- **Capture**: a PCAP or PCAPNG file supplied for analysis.
- **Session**: one reconstructed mail-transport conversation.
- **Finding**: a concrete security observation tied to evidence.
- **Verdict**: the backend-authoritative result for a session.
- **Risk score**: a normalized score used to communicate severity; it is not a compliance grade.
- **Analysed PCAP capture**: a history record produced from packet-capture ingestion.
- **Email client**: a history record whose source metadata identifies an email-client flow.
- **Evidence**: packet, stream, handshake, certificate, or protocol metadata returned by the analysis service.

## Claims we can make

- SecureMailScope accepts PCAP and PCAPNG captures through the capture-ingestion flow.
- Capture processing and protocol extraction happen on the server-side job service.
- The analysis targets SMTP, IMAP, and POP3 traffic.
- The service reconstructs sessions and inspects observable protocol and TLS behavior.
- The result can include STARTTLS behavior, negotiated TLS details, certificate information, protocol metadata, findings, risk, and verdict data when supplied by the backend.
- Analysis results are persisted and can be reviewed in the dashboard, Analytics, History, and Inbox workspaces.
- Source metadata can distinguish **Analysed PCAP capture** from **Email client** records when the backend provides enough provenance.
- Sensitive message content is not treated as universally available: previews must show an explicit unavailable or redacted state when appropriate.
- Deterministic backend findings remain authoritative. Model scores are advisory and must not be presented as a replacement for the backend verdict.

## Claims to remove or qualify

Do not use these statements without a verified implementation contract:

- “Runs entirely in your browser.”
- “Nothing is uploaded.”
- “Nothing is stored.”
- “Every message is decrypted.”
- “The product certifies compliance.”
- A hard-coded number of rules unless the active backend exposes that number.
- A fixed list of RFCs unless each finding or rule response returns the corresponding reference.
- Guaranteed detection of content that was not present in the capture.

Preferred privacy wording:

> SecureMailScope does not break TLS or recover protected secrets. It reports what the capture and analysis service can observe, and it marks unavailable or redacted content instead of inventing it.

## Recommended page structure

1. Header and primary navigation
2. Hero with a clear analysis CTA
3. What the product answers
4. How the analysis works
5. Interactive result showcase
6. What appears in a result
7. Who uses it
8. Privacy and evidence boundary
9. FAQ
10. Final CTA and footer

## Ready-to-use page copy

### Header

**Brand:** SecureMailScope

**Navigation:**

- How it works
- What you get
- Use cases
- FAQ

**Primary action:** Analyze a capture

**Secondary action:** View the dashboard

### Hero

**Eyebrow:** PASSIVE MAIL-TRANSPORT SECURITY ANALYSIS

# See how your mail traffic was actually secured.

SecureMailScope turns SMTP, IMAP, and POP3 packet captures into session-level security findings. Reconstruct the conversation, inspect the TLS negotiation and certificate evidence, and see the backend-authoritative verdict without guessing from a single port or protocol label.

**Primary CTA:** Analyze a PCAP

**Secondary CTA:** See how it works

**Trust line:** PCAP / PCAPNG · SMTP · IMAP · POP3 · TLS · STARTTLS · X.509 evidence

**Hero note:** Capture processing runs through the server-side ingestion service. The browser stages the file and displays job progress; it does not run tshark or invent analysis results.

### Problem section

## Encryption on the port is not the whole story.

A mail session can use the expected port and still negotiate an outdated protocol, fail a STARTTLS upgrade, present a problematic certificate, or expose an unexpected transport condition. SecureMailScope follows the session evidence instead of treating the port number as proof of security.

### What the product answers

#### Was encryption actually negotiated?

See whether the advertised upgrade was used, whether the handshake completed, and which transport state the session reached.

#### Is the cryptography still acceptable?

Review the observed TLS version, cipher information, key exchange, and certificate signals returned by the analyzer.

#### What evidence supports the verdict?

Open the session, findings, network details, and available message metadata. Each unavailable or redacted section is labeled instead of being filled with a guess.

### How it works

## From capture to defensible finding

### 01 — Ingest

Upload a PCAP or PCAPNG capture through the authenticated capture workflow. The server-side job validates the file and reports its processing state.

### 02 — Reconstruct

The extraction service rebuilds supported mail sessions from the capture and preserves the session identifiers needed to trace a result back to its source.

### 03 — Inspect

The analyzer evaluates observable protocol behavior, STARTTLS or TLS negotiation, certificate metadata, and other session features returned by the capture pipeline.

### 04 — Judge

Deterministic rules establish the security findings and backend verdict. Model scores can add advisory context, but they do not override authoritative findings.

### 05 — Review

Use Analytics for aggregate posture, History for persisted records, and Inbox for safe message and network detail when those sections are available.

### Showcase section

## See the evidence behind the score.

The showcase should be an interactive set of result cards. Each card should use a real fixture or a real persisted analysis response; never use invented numbers or a fabricated verdict.

#### Showcase card: STARTTLS completed

**Label:** Transport upgrade observed

**Heading:** STARTTLS was advertised and negotiated.

**Description:** Show the observed protocol, negotiated TLS details, certificate state, final verdict, and the evidence references returned by the backend.

**Action:** Open session details

#### Showcase card: Deprecated transport

**Label:** Legacy cryptography observed

**Heading:** The session reached an outdated TLS state.

**Description:** Show the exact version or cipher evidence, the finding severity, the backend verdict, and the recommendation supplied by the analysis policy.

**Action:** Inspect finding

#### Showcase card: Certificate issue

**Label:** Certificate validation finding

**Heading:** The certificate evidence needs attention.

**Description:** Show only the certificate properties returned by the backend, such as validity, identity binding, chain state, or key details.

**Action:** View certificate evidence

#### Showcase card: Upgrade not completed

**Label:** STARTTLS behavior

**Heading:** The advertised upgrade did not complete as expected.

**Description:** Show the observed command flow, handshake state, related finding, and supporting stream evidence.

**Action:** Review session

### Result anatomy

## One result, several useful views

### Verdict

The backend-authoritative classification for the session. Keep this distinct from model output and from the numeric risk score.

### Risk score

A normalized severity signal shown with a clear color scale and the exact percentage. The color is visual guidance only; the backend verdict and findings remain authoritative.

### Findings

Concrete observations such as protocol, handshake, certificate, or transport issues. Each finding should retain its supplied evidence reference and severity.

### Session and network detail

Show the capture or session identifier, protocol, endpoints, ports, and network evidence when available. If an IP or network section is unavailable, say so.

### Safe message preview

Show a bounded, redacted preview only when the source supplies message content. Use explicit states:

- Content available
- Content unavailable
- Content redacted
- Content not observed

Do not imply that encrypted content was recovered.

### Source provenance

History should expose and filter the normalized source labels:

- Analysed PCAP capture
- Email client

Records that do not contain enough provenance should remain **Not supplied** rather than being assigned a source by guesswork.

### Audience section

## Built for people who need the evidence, not just a green checkmark.

### Security operations

Triage sessions by verdict and severity, then open the finding and the network evidence behind it.

### Incident response and digital forensics

Move from a persisted result to the capture/session identifier, reconstructed flow, handshake details, and certificate evidence.

### Mail and infrastructure teams

Validate how SMTP, IMAP, and POP3 traffic behaves in the environment and identify transport or certificate changes that need attention.

### Audit and assurance teams

Use persisted, traceable analysis records as technical evidence. SecureMailScope is an analysis aid, not a compliance certification or legal opinion.

### Privacy and trust section

## Evidence first. No invented certainty.

SecureMailScope reports the boundary of the data it received:

- PCAP processing is performed by the server-side capture service.
- TLS is analyzed from observable handshake and certificate evidence; the product does not claim to break encryption.
- Message previews are bounded and redacted where required.
- Missing data is shown as unavailable or not observed.
- Backend findings and verdicts are authoritative.
- Model output is advisory and should be labeled as such.
- API credentials remain server-side and are never exposed in browser configuration.

### FAQ

#### What files can I analyze?

PCAP and PCAPNG captures containing supported SMTP, IMAP, or POP3 traffic.

#### Does SecureMailScope decrypt TLS?

No. It evaluates observable transport behavior, TLS negotiation, certificate evidence, and other features supplied by the capture pipeline. It does not promise recovery of protected secrets.

#### Where is the capture processed?

The browser stages the file and submits it to the authenticated server-side capture job. The server performs extraction and analysis while the dashboard polls for job state and results.

#### What does a verdict mean?

A verdict is the backend-authoritative classification for the analyzed session. The risk score and model outputs provide context, but they do not replace the findings or verdict.

#### Why is part of the message unavailable?

The capture may not contain the content, the transport may be encrypted, the source may withhold it, or the content may be redacted by policy. SecureMailScope shows the reason instead of filling the gap with a fabricated preview.

#### Can I use this as a compliance certificate?

No. It provides technical evidence for investigation and review. Compliance conclusions require the applicable policy, scope, controls, and human assessment.

#### What happens to my results?

The configured API persists analysis records so they can be reviewed in the dashboard, Analytics, History, and Inbox workspaces. Add the actual retention and deletion policy here before publishing a stronger claim.

### Final CTA

## Find out what the session actually did.

Upload a capture, follow the job, and inspect the evidence behind each result.

**Primary CTA:** Analyze a capture

**Secondary CTA:** Explore the dashboard

### Footer

SecureMailScope — passive mail-transport security analysis for SMTP, IMAP, and POP3.

Evidence first. Backend verdicts authoritative. Missing data stays visible.

Footer links:

- How it works
- Dashboard
- History
- Privacy
- Contact / Support

## Showcase implementation rules

- Use real API responses or explicitly labeled fixtures.
- Do not render fake risk scores, fake progress, fake ETAs, or fake evidence counts.
- Keep sample data visually distinct from persisted production records.
- Make every showcase card keyboard accessible.
- Give every icon-only control an accessible name.
- Preserve loading, empty, error, unavailable, and redacted states in the copy.
- Do not make a card claim “encrypted” solely from `SMTP`, `IMAP`, `POP3`, or a port number.
- Do not display a standard or RFC citation unless the active rule/evidence response supplies it.
- Keep the browser-facing copy independent of the server API key and private configuration.

## SEO and sharing copy

### Title

SecureMailScope — Evidence-backed mail-transport security analysis

### Meta description

Analyze SMTP, IMAP, and POP3 packet captures, inspect TLS and certificate evidence, and trace each session verdict back to the traffic that produced it.

### Open Graph title

See how your mail traffic was actually secured.

### Open Graph description

Session-level analysis for mail transport security: reconstruct the flow, inspect TLS and certificates, and review evidence-backed findings.

### Suggested structured-data category

Use `SoftwareApplication` only when the deployment, operating model, and data handling claims are accurate. Do not add reviews, ratings, pricing, or compliance claims that the product does not publish.

## Acceptance checklist

- [ ] Hero explains the product in one sentence.
- [ ] Primary CTA leads to the real capture workflow.
- [ ] No copy says that PCAP processing is entirely local unless the architecture changes.
- [ ] SMTP, IMAP, and POP3 are named without implying every session is encrypted.
- [ ] TLS and certificate claims are limited to observable evidence.
- [ ] Backend verdicts and model outputs are clearly separated.
- [ ] Showcase cards use real or explicitly labeled fixture data.
- [ ] Source labels distinguish Analysed PCAP capture and Email client.
- [ ] Unavailable and redacted content states are represented.
- [ ] Accessibility names exist for icon-only controls.
- [ ] Mobile layout keeps the primary CTA and product promise visible without horizontal scrolling.
- [ ] Metadata and social copy match the implemented data-handling model.
