# SecureMailScope mail-transfer demo video

**Status:** Approved for implementation

**Date:** 2026-09-10

**Scope:** A 50-second Remotion composition in `remotion-video/` that demonstrates SecureMailScope's capture-to-evidence journey. The existing Next.js dashboard, deployment, and their data integrations are not changed.

## 1. Objective

Create a clean 1920x1080, 30fps product demo that makes one story legible: an analyst receives a capture, follows a mail transfer into its SMTP/TCP/TLS evidence, and lands on the linked analysis result.

The product screen is the focal point. The composition recreates the live SecureMailScope information hierarchy rather than screen-recording the deployed site, so every click, value, and hold remains deterministic during render.

## 2. Reference and product boundary

The visual reference is the authenticated SecureMailScope deployment:

- left navigation with Dashboard, Forensics, Capture & Evidence, Intelligence, Output, and Settings groups;
- Dashboard metric cards and compact data charts;
- All Analysis capture queue;
- Inbox list with an inspection sheet;
- message detail tabs for Email, Headers, Preview, TCP Stream, and TLS;
- linked history/analysis result with risk and evidence detail.

The demo recreates those product states locally. It does not make network requests, log into the deployed app, use live account data, or render an email address/account identity. The on-screen analyst identity is the generic `Analyst`.

## 3. Output contract

| Property | Value |
| --- | --- |
| Composition ID | `SecureMailScopeDemo` |
| Canvas | 1920x1080 |
| Frame rate | 30fps |
| Duration | 1500 frames / 50 seconds |
| Location | `remotion-video/` |
| Product name | `SecureMailScope` |
| Background | `#141318` |
| Primary text | `#F4F0E8` |
| Accent | `#EE8C38` (warm orange derived from the live dashboard) |
| Typeface | Manrope |
| Motion | restrained, state-driven, cursor-led; no raw browser or OS chrome |

Semantic status cues may use low-saturation green or red only when indicating healthy or high-risk states. They are not additional decorative accents.

## 4. Locked copy

The following visible product strings are kept exactly as currently written in the live experience or approved storyboard:

| Beat | Copy |
| --- | --- |
| Setup | `Security & Packet Analysis` |
| Step one | `Upload PCAP or PCAPNG files for server-side extraction.` |
| Step two | `Each extracted session is analyzed separately.` |
| Step three action | `Open analysis` |
| Payoff | `Evidence references retained with analyses.` |
| Terminal URL | `https://securemail-dash.vercel.app/` |
| Closing line | `Think before you click. We already did. Be safe, be secure.` |

## 5. Timeline and interaction choreography

The three workflow steps occupy 1,020 of the 1,500 frames, so the product flow has substantially more screen time than the setup and close.

| Frames | Time | Beat | On-screen action |
| --- | --- | --- | --- |
| 0-89 | 0-3s | Setup | The setup line resolves quietly on the warm dark canvas. |
| 90-269 | 3-9s | Screen at rest | The dashboard slides in from the right, settles, and holds. Metric cards show a fixed demo snapshot: Sessions analysed, Flagged sessions, Average risk score, Evidence archived. No cursor action occurs here. |
| 270-599 | 9-20s | Step one: capture | The cursor clicks `All Analysis`. A PCAP file chip, `pcap-dd12d420405fa966.pcap`, appears in the capture area. The cursor clicks `Queue batch`; queue state advances to complete with a measured progress fill. |
| 600-989 | 20-33s | Step two: mail transfer | The cursor clicks `Inbox`, selects a mail row, and opens the inspection sheet. It selects `TCP Stream`, revealing SMTP, `104.195.127.27:41385 -> :25`, 477 packets, 78,410 bytes, and bounded evidence references. |
| 990-1289 | 33-43s | Step three: analysis | The cursor selects `TLS`: STARTTLS used, TLS 1.3, and the negotiated cipher resolve. It then clicks `Open analysis`; the history detail lands with a risk result, one security finding, and the evidence-backed analysis panel. |
| 1290-1409 | 43-47s | Payoff | The completed analysis remains visible. A single payoff line lands without obscuring the result. |
| 1410-1499 | 47-50s | Close | A compact terminal types the URL. It resolves to a SecureMailScope wordmark and the closing line on a calm hold. |

## 6. Scene design

### Dashboard shell

The screen is a large, high-contrast application frame that fills the viewer's central field. It preserves the live product's sidebar grouping, broad metric cards, chart grid, and table density while adapting the surface to the dark video palette. Text remains large enough to read at normal 1080p playback.

The at-rest dashboard must not count cards up or animate charts before the first interaction. The only entry movement is the frame settling into place.

### Capture state

The All Analysis screen presents one clear sequence: capture selected, queue clicked, progress completed. It never shows a file picker, real filesystem path, or backend request. The queue animation is a local, deterministic state change.

### Transfer evidence state

The Inbox panel is a clean two-pane interpretation of the live screen. The selected mail row opens a sheet. TCP Stream shows only the information that advances the story: protocol, endpoints, packets, bytes, and evidence references. It does not expose raw message bodies or arbitrary packet payloads.

### TLS and linked analysis state

The TLS tab establishes the protected mail-transfer context with a visible STARTTLS result, TLS version, cipher suite, and certificate posture. `Open analysis` then takes the viewer to the linked history detail. The final panel communicates one risk result and one finding; it does not imply automated blocking, message-content access, or unsupported threat certainty.

## 7. remocn strategy

This is a catalog-composed product demo with a small new reusable `SecureMailScreen` layer for the product-specific dashboard. The custom layer is justified because the exact SecureMailScope sidebar, metric cards, table, inspection sheet, and evidence tabs are the video subject; generic dashboard footage would not be reference-faithful.

Install these remocn components into `remotion-video/components/remocn/` using the shadcn registry:

| Component | Purpose |
| --- | --- |
| `@remocn/soft-blur-in` | quiet setup and payoff copy entrance |
| `@remocn/simulated-cursor` | deterministic, deliberate screen-demo cursor gestures |
| `@remocn/progress` | capture queue progress state |
| `@remocn/tabs` | TCP Stream and TLS tab transitions |
| `@remocn/typewriter` | terminal URL in the closing beat |
| `@remocn/backdrop` | shared dark composition backdrop |

Each installed component is used for the beat it is suited to; the custom dashboard remains visually still while the workflow state changes. Transitions between product states are plain fades or short focus shifts, never flashy wipes.

## 8. Implementation shape

```
remotion-video/
  src/
    Composition.tsx          # SecureMailScopeDemo registration and metadata
    Root.tsx                 # Remotion root
    securemail/
      SecureMailScopeDemo.tsx
      SecureMailScreen.tsx
      DashboardState.tsx
      CaptureState.tsx
      InboxEvidenceState.tsx
      AnalysisState.tsx
      tokens.ts
  components/remocn/         # generated by the remocn registry
```

The composition uses explicit frame ranges and `useCurrentFrame()`/`interpolate()` for local screen states. There are no timers, DOM event listeners, browser automation, random values, or live API calls in the render path. Manrope is loaded before the first frame.

## 9. Verification

1. Run `npm run lint` from `remotion-video/`.
2. Open the Remotion Studio and scrub each storyboard boundary: frames 0, 90, 270, 600, 990, 1290, and 1410.
3. Render `SecureMailScopeDemo` at 1920x1080 and 30fps.
4. Inspect a still from the resting dashboard, each flow step, payoff, and close for legibility, copy accuracy, one-accent discipline, and absence of account identifiers.
5. Confirm the final render is 1,500 frames / 50 seconds and that each click has a visible response followed by a short rest.

## 10. Out of scope

- Changes to the production Next.js dashboard, backend, API contracts, authentication, or data source.
- Recording the live app or embedding provided login credentials.
- Voiceover, music licensing, automatic threat mitigation, or a claim of live monitoring.
- Raw mail bodies, unrestricted headers, packet payloads, secrets, or personal account information.
