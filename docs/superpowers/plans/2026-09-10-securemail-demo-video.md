# SecureMailScope Mail-Transfer Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and render a deterministic 50-second SecureMailScope product demo that follows a PCAP capture into Inbox TCP/TLS evidence and a linked analysis result.

**Architecture:** The existing `remotion-video/` scaffold becomes the isolated video workspace. A pure timeline module owns 1,500-frame beat boundaries; a custom SecureMailScope UI layer renders dashboard and evidence states; remocn components provide only the reusable timing primitives for copy, cursor, progress, tabs, dark backdrop, and terminal typing.

**Tech Stack:** Remotion 4, React 19, Tailwind 4, TypeScript, Manrope through `@remotion/google-fonts`, shadcn registry, remocn.

**Spec:** `docs/superpowers/specs/2026-09-10-securemail-demo-video-design.md`

## Global Constraints

- Render `SecureMailScopeDemo` at exactly 1920x1080, 30fps, 1,500 frames.
- Keep all application content render-local: no API calls, credentials, browser automation, timers, or random values.
- Preserve the live product hierarchy but genericize account identity as `Analyst`.
- Use `#141318`, off-white `#F4F0E8`, and one decorative accent `#EE8C38`; semantic health/risk colors are status-only.
- Use Manrope and the locked copy from the spec verbatim.
- Keep transitions restrained; show cursor click feedback and short rest after each response.
- Do not modify the parent Next.js application or live deployment.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `remotion-video/components.json` | shadcn aliases, Tailwind target, and `@remocn` registry configuration for this standalone video project. |
| `remotion-video/package.json` | scripts and dependencies required to lint, test timeline boundaries, preview, and render. |
| `remotion-video/tsconfig.json` | `@/* -> ./src/*` alias used by installed remocn components. |
| `remotion-video/src/lib/utils.ts` | shared `cn()` helper required by shadcn/remocn-generated UI primitives. |
| `remotion-video/src/securemail/tokens.ts` | palette, surface, typography, and fixed demo-data tokens. |
| `remotion-video/src/securemail/timeline.ts` | source of truth for scene starts, ends, and state lookup. |
| `remotion-video/src/securemail/timeline.test.ts` | frame-boundary tests for all seven beats. |
| `remotion-video/src/securemail/SecureMailScopeDemo.tsx` | 1,500-frame composition orchestrator and Manrope loading. |
| `remotion-video/src/securemail/SecureMailScreen.tsx` | large app frame, sidebar, cursor targets, and state switcher. |
| `remotion-video/src/securemail/DashboardState.tsx` | resting Dashboard state and fixed metrics/charts. |
| `remotion-video/src/securemail/CaptureState.tsx` | All Analysis capture/queue interaction. |
| `remotion-video/src/securemail/InboxEvidenceState.tsx` | Inbox selection, inspection sheet, TCP Stream, and TLS evidence views. |
| `remotion-video/src/securemail/AnalysisState.tsx` | linked analysis result and evidence-backed finding state. |
| `remotion-video/src/Composition.tsx` | `SecureMailScopeDemo` composition registration and metadata. |
| `remotion-video/src/Root.tsx` | root registration for the final composition. |

## Task 1: Configure remocn in the existing Remotion workspace

**Files:**

- Create: `remotion-video/components.json`
- Create: `remotion-video/src/lib/utils.ts`
- Modify: `remotion-video/tsconfig.json`
- Modify: `remotion-video/package.json`
- Modify: `remotion-video/src/index.css`

**Interfaces:**

- Produces the `@/*` alias that copied remocn components import.
- Produces `cn(...inputs: ClassValue[]): string` for registry components.
- Produces generated files under `remotion-video/src/components/remocn/`.

- [ ] **Step 1: Add the video-local shadcn registry configuration**

Create `remotion-video/components.json` with the `@remocn` registry URL, `src/index.css` as the Tailwind CSS entry, and aliases rooted at `src/`.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "registries": { "@remocn": "https://remocn.dev/r/{name}.json" }
}
```

- [ ] **Step 2: Add alias and utility support before installing registry components**

Update `tsconfig.json` with `baseUrl` and the alias, then create the utility module.

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

```ts
import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

- [ ] **Step 3: Install the selected remocn components**

Run from `remotion-video/`:

```bash
npx shadcn@latest add @remocn/backdrop @remocn/soft-blur-in @remocn/simulated-cursor @remocn/progress @remocn/tabs @remocn/typewriter --yes
```

Expected: components are written under `src/components/remocn/`, registry dependencies are installed, and generated imports resolve through `@/`.

- [ ] **Step 4: Add test and render scripts**

Add the following script without removing existing scripts:

```json
"test": "node --experimental-strip-types --test src/securemail/timeline.test.ts"
```

- [ ] **Step 5: Validate the setup**

Run:

```bash
npm run lint
```

Expected: the empty scaffold, alias, and generated remocn components type-check cleanly before the demo implementation starts.

## Task 2: Define timeline, tokens, and the frame-boundary contract

**Files:**

- Create: `remotion-video/src/securemail/tokens.ts`
- Create: `remotion-video/src/securemail/timeline.ts`
- Create: `remotion-video/src/securemail/timeline.test.ts`

**Interfaces:**

- Produces `DEMO_DURATION`, `DemoBeat`, `getBeatAtFrame(frame)`, and `BEATS`.
- Produces shared `TOKENS` and `DEMO_DATA` objects used by every visual state.

- [ ] **Step 1: Write the failing timeline-boundary test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {DEMO_DURATION, getBeatAtFrame} from "./timeline.ts";

test("the video is exactly 1,500 frames", () => {
  assert.equal(DEMO_DURATION, 1500);
});

test("every storyboard boundary maps to its intended beat", () => {
  assert.equal(getBeatAtFrame(0), "setup");
  assert.equal(getBeatAtFrame(90), "dashboard");
  assert.equal(getBeatAtFrame(270), "capture");
  assert.equal(getBeatAtFrame(600), "inbox");
  assert.equal(getBeatAtFrame(990), "analysis");
  assert.equal(getBeatAtFrame(1290), "payoff");
  assert.equal(getBeatAtFrame(1410), "close");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test
```

Expected: FAIL because `timeline.ts` does not exist yet.

- [ ] **Step 3: Implement the immutable timing contract and design tokens**

```ts
export const DEMO_DURATION = 1500;
export type DemoBeat = "setup" | "dashboard" | "capture" | "inbox" | "analysis" | "payoff" | "close";

export const getBeatAtFrame = (frame: number): DemoBeat => {
  if (frame < 90) return "setup";
  if (frame < 270) return "dashboard";
  if (frame < 600) return "capture";
  if (frame < 990) return "inbox";
  if (frame < 1290) return "analysis";
  if (frame < 1410) return "payoff";
  return "close";
};
```

Put `#141318`, `#F4F0E8`, `#EE8C38`, the locked copy, generic `Analyst`, and fixed transfer evidence values in `tokens.ts`.

- [ ] **Step 4: Run the timeline test and lint**

Run:

```bash
npm test && npm run lint
```

Expected: PASS. The seven frame boundaries remain stable independently of visual implementation.

## Task 3: Build the quiet dashboard and capture queue states

**Files:**

- Create: `remotion-video/src/securemail/DashboardState.tsx`
- Create: `remotion-video/src/securemail/CaptureState.tsx`
- Create: `remotion-video/src/securemail/SecureMailScreen.tsx`

**Interfaces:**

- `DashboardState` renders the no-action resting dashboard.
- `CaptureState` receives `localFrame: number` and returns the selected file/queue-completion state.
- `SecureMailScreen` receives `{view: "dashboard" | "capture" | "inbox" | "analysis", localFrame: number}` and preserves the shared sidebar and topbar.

- [ ] **Step 1: Implement the shared application frame**

Build a 16:9 application surface with the product's sidebar groups and generic `Analyst` account row. Keep it large, opaque, and readable; use a 1px low-contrast border and no decorative glow.

```tsx
export type ScreenView = "dashboard" | "capture" | "inbox" | "analysis";

export const SecureMailScreen: React.FC<{view: ScreenView; localFrame: number}> = ({view, localFrame}) => (
  <div className="h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#1b1a1f] text-[#F4F0E8]">
    <Sidebar activeView={view} />
    <main>{view === "dashboard" ? <DashboardState /> : <ScreenContent view={view} localFrame={localFrame} />}</main>
  </div>
);
```

- [ ] **Step 2: Implement the stationary dashboard state**

Render exactly four readable metrics: Sessions analysed, Flagged sessions, Average risk score, Evidence archived. Use fixed values and static chart shapes. The dashboard may enter as one framed object but card counts and chart traces do not animate.

- [ ] **Step 3: Implement deterministic capture progress**

Use the installed remocn `Progress` component in the queue card. At the local capture frame for the first click, show `pcap-dd12d420405fa966.pcap`; after the queue click, progress advances to complete and holds.

- [ ] **Step 4: Validate the first three beats visually**

Run:

```bash
npx remotion still SecureMailScopeDemo out/dashboard.png --frame=180
npx remotion still SecureMailScopeDemo out/capture.png --frame=540
```

Expected: dashboard at rest at frame 180; selected capture and completed queue state at frame 540.

## Task 4: Build the Inbox evidence and linked analysis states

**Files:**

- Create: `remotion-video/src/securemail/InboxEvidenceState.tsx`
- Create: `remotion-video/src/securemail/AnalysisState.tsx`
- Modify: `remotion-video/src/securemail/SecureMailScreen.tsx`

**Interfaces:**

- `InboxEvidenceState` receives `localFrame: number` and owns list selection, inspection sheet, TCP and TLS views.
- `AnalysisState` receives `localFrame: number` and owns the linked risk/finding result.
- `SecureMailScreen` mounts those views without changing shared chrome.

- [ ] **Step 1: Implement the Inbox selection and inspection sheet**

Show one selected email row without personal information. Open the sheet after the Inbox click and use the installed remocn `Tabs` primitive for the `TCP Stream` and `TLS` active-state changes.

- [ ] **Step 2: Implement the TCP Stream evidence view**

Show only SMTP transfer information needed for the story:

```ts
{
  protocol: "SMTP",
  client: "104.195.127.27:41385",
  server: ":25",
  packets: "477",
  bytes: "78,410",
  evidence: "pcap:tcp.stream, smtp.command, smtp.response"
}
```

Keep arbitrary payloads and message content out of the visual.

- [ ] **Step 3: Implement the TLS and linked analysis state**

Show `STARTTLS used`, `TLS 1.3`, `TLS_AES_128_GCM_SHA256`, certificate posture, one security finding, a medium risk score, and `Open analysis`. The linked analysis must be the visual consequence of the cursor click, not a page jump with no causal cue.

- [ ] **Step 4: Validate evidence frames**

Run:

```bash
npx remotion still SecureMailScopeDemo out/tcp-stream.png --frame=870
npx remotion still SecureMailScopeDemo out/analysis.png --frame=1200
```

Expected: legible TCP evidence at frame 870; TLS-derived result and linked analysis at frame 1200.

## Task 5: Compose the full video and close

**Files:**

- Create: `remotion-video/src/securemail/SecureMailScopeDemo.tsx`
- Modify: `remotion-video/src/Composition.tsx`
- Modify: `remotion-video/src/Root.tsx`
- Modify: `remotion-video/src/index.css`

**Interfaces:**

- `SecureMailScopeDemo` is the registered 1,500-frame React component.
- `Composition.tsx` exports a `Composition` with id `SecureMailScopeDemo`.

- [ ] **Step 1: Load Manrope before rendering the first frame**

Use `@remotion/google-fonts/Manrope` and wait for its font-loading handle in composition metadata or the root wrapper before rendering scene text.

- [ ] **Step 2: Implement setup, screen entry, cursor, payoff, and close**

Use `SoftBlurIn` for the setup/payoff lines, `SimulatedCursor` for each deliberate click, `Backdrop` for the warm dark canvas, and `Typewriter` for the final URL. The screen slides in and settles between frames 90-120. Keep all other state changes inside the screen, using short opacity/focus shifts only.

```tsx
<Sequence from={1410} durationInFrames={90}>
  <Typewriter text="https://securemail-dash.vercel.app/" />
  <Wordmark name="SecureMailScope" />
</Sequence>
```

- [ ] **Step 3: Register the final composition metadata**

```tsx
<Composition
  id="SecureMailScopeDemo"
  component={SecureMailScopeDemo}
  durationInFrames={1500}
  fps={30}
  width={1920}
  height={1080}
/>
```

- [ ] **Step 4: Run automated verification**

Run:

```bash
npm test && npm run lint && npx remotion render SecureMailScopeDemo out/securemailscope-demo.mp4
```

Expected: all checks pass and the MP4 is exactly 50 seconds at 1920x1080/30fps.

- [ ] **Step 5: Review key frames and commit scoped work**

Render and inspect frames 0, 180, 540, 870, 1200, 1350, and 1470. Confirm locked copy, one-accent discipline, cursor response beats, no account identifiers, and no visual clipping. Then stage only `remotion-video/` changes created for this video and commit with:

```bash
git add remotion-video
git commit -m "feat: add SecureMailScope demo video"
```

## Plan self-review

**Spec coverage:** Tasks 2 and 5 implement the 1,500-frame contract and locked copy. Tasks 3 and 4 implement the three workflow steps and dashboard-as-star requirement. Task 1 installs the named remocn registry components. Task 5 verifies the final MP4 and key frames. The existing Next.js app and live data source remain out of scope throughout.

**Placeholder scan:** No TBDs, deferred implementation notes, or unspecified component choices remain.

**Type consistency:** `DemoBeat`, `ScreenView`, `localFrame`, `SecureMailScreen`, and `SecureMailScopeDemo` are defined once and consumed consistently by later tasks.
