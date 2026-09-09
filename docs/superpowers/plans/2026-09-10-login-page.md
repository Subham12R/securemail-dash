# White Theme Animated Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a white/light-themed split-screen login page at `/login` with an animated, mouse-reactive dithered pixel canvas, testimonial quote, enterprise badges, and work email magic link flow (without 3rd-party logins).

**Architecture:** A route-aware `AppShell` isolates `/login` from dashboard chrome (sidebar and capture queue). The login page splits into a left form panel and a right animated canvas panel. An ordered 4×4 Bayer matrix canvas engine renders dynamic wave and mouse-ripple dithering in pure 2D canvas math, while a clean magic link form manages validation, submission, and confirmation states.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, HTML5 Canvas 2D, Lucide React, Sonner, `node:test`.

## Global Constraints

- **Theme**: Clean white theme (`#ffffff` left panel, `#f8fafc` canvas panel, slate dither dots).
- **Logins**: Work email magic link only; omit Google, Apple, GitHub, and all 3rd-party auth buttons.
- **Route**: Dedicated `/login` route; bypasses `<Sidebar />` and dashboard capture queue.
- **Performance**: Stepped-pixel canvas loop using `requestAnimationFrame`, zero heavy WebGL libraries, respects `prefers-reduced-motion`.
- **Testing**: Use Node native test runner (`node --experimental-strip-types --test test/<file>.test.ts`).

---

### Task 1: Dither Math Engine & Logic Helper

**Files:**
- Create: `lib/dither.ts`
- Test: `test/dither.test.ts`

**Interfaces:**
- Produces:
  - `BAYER_4X4: readonly (readonly number[])[]`
  - `getBayerThreshold(x: number, y: number): number`
  - `computeWaveIntensity(x: number, y: number, time: number, mouseX?: number, mouseY?: number): number`
  - `shouldDrawDitherPixel(x: number, y: number, time: number, mouseX?: number, mouseY?: number): boolean`

- [ ] **Step 1: Write the failing test**

Create `test/dither.test.ts`:
```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  BAYER_4X4,
  getBayerThreshold,
  computeWaveIntensity,
  shouldDrawDitherPixel,
} from "../lib/dither.ts";

test("Bayer 4x4 matrix normalization", () => {
  assert.equal(BAYER_4X4.length, 4);
  assert.equal(BAYER_4X4[0].length, 4);
  assert.equal(getBayerThreshold(0, 0), 0);
  assert.equal(getBayerThreshold(3, 3), 5 / 16);
  assert.equal(getBayerThreshold(4, 4), getBayerThreshold(0, 0));
});

test("computeWaveIntensity stays within [0, 1]", () => {
  for (let x = 0; x < 100; x += 25) {
    for (let y = 0; y < 100; y += 25) {
      const val = computeWaveIntensity(x, y, 1.5);
      assert.ok(val >= 0 && val <= 1, `Intensity ${val} out of bounds at (${x}, ${y})`);
    }
  }
});

test("mouse interaction affects intensity locally", () => {
  const base = computeWaveIntensity(50, 50, 2.0);
  const withMouseNear = computeWaveIntensity(50, 50, 2.0, 52, 51);
  const withMouseFar = computeWaveIntensity(50, 50, 2.0, 500, 500);

  assert.notEqual(base, withMouseNear, "Mouse near target should modulate intensity");
  assert.ok(Math.abs(base - withMouseFar) < 0.01, "Mouse far away should have negligible effect");
});

test("shouldDrawDitherPixel returns boolean", () => {
  const draw = shouldDrawDitherPixel(10, 20, 0.5, 10, 20);
  assert.equal(typeof draw, "boolean");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test test/dither.test.ts`
Expected: FAIL with module not found `../lib/dither.ts`.

- [ ] **Step 3: Implement minimal dither engine**

Create `lib/dither.ts`:
```ts
export const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
] as const;

export function getBayerThreshold(x: number, y: number): number {
  const bx = Math.abs(Math.floor(x)) % 4;
  const by = Math.abs(Math.floor(y)) % 4;
  return BAYER_4X4[by][bx];
}

export function computeWaveIntensity(
  x: number,
  y: number,
  time: number,
  mouseX?: number,
  mouseY?: number,
): number {
  const w1 = Math.sin(x * 0.008 + y * 0.006 + time * 0.7);
  const w2 = Math.cos(x * 0.005 - y * 0.007 - time * 0.5);
  const w3 = Math.sin((x + y) * 0.004 + time * 0.3);
  let base = 0.5 + 0.22 * w1 + 0.18 * w2 + 0.1 * w3;

  if (mouseX !== undefined && mouseY !== undefined) {
    const dx = x - mouseX;
    const dy = y - mouseY;
    const dist = Math.hypot(dx, dy);
    if (dist < 180) {
      const falloff = Math.exp(-dist / 65);
      const ripple = Math.sin(dist * 0.07 - time * 2.5) * 0.28 * falloff;
      base += ripple;
    }
  }

  return Math.max(0, Math.min(1, base));
}

export function shouldDrawDitherPixel(
  x: number,
  y: number,
  time: number,
  mouseX?: number,
  mouseY?: number,
): boolean {
  const intensity = computeWaveIntensity(x, y, time, mouseX, mouseY);
  const threshold = getBayerThreshold(x, y);
  return intensity > threshold;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test test/dither.test.ts`
Expected: PASS (4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add lib/dither.ts test/dither.test.ts
git commit -m "feat: implement dither math engine with Bayer matrix and wave intensity"
```

---

### Task 2: Email Validation & Submission Logic

**Files:**
- Create: `lib/login-validation.ts`
- Test: `test/login-validation.test.ts`

**Interfaces:**
- Produces:
  - `validateWorkEmail(email: string): { valid: boolean; error?: string }`
  - `maskEmail(email: string): string`

- [ ] **Step 1: Write the failing test**

Create `test/login-validation.test.ts`:
```ts
import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkEmail, maskEmail } from "../lib/login-validation.ts";

test("validateWorkEmail accepts standard work email addresses", () => {
  assert.deepEqual(validateWorkEmail("analyst@securitycorp.com"), { valid: true });
  assert.deepEqual(validateWorkEmail("user.name+tag@sub.example.org"), { valid: true });
});

test("validateWorkEmail rejects empty or invalid email strings", () => {
  assert.equal(validateWorkEmail("").valid, false);
  assert.equal(validateWorkEmail("not-an-email").valid, false);
  assert.equal(validateWorkEmail("@company.com").valid, false);
  assert.equal(validateWorkEmail("user@").valid, false);
  assert.equal(validateWorkEmail("user@domain").valid, false);
});

test("maskEmail correctly obscures email address for confirmation displays", () => {
  assert.equal(maskEmail("alice@company.com"), "a***e@company.com");
  assert.equal(maskEmail("bob@domain.org"), "b*b@domain.org");
  assert.equal(maskEmail("invalid"), "invalid");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test test/login-validation.test.ts`
Expected: FAIL with module not found `../lib/login-validation.ts`.

- [ ] **Step 3: Implement validation helpers**

Create `lib/login-validation.ts`:
```ts
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateWorkEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: "Email address is required." };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid work email address." };
  }
  return { valid: true };
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 1) return trimmed;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);

  if (local.length <= 2) {
    return `${local[0]}*${domain}`;
  }

  const first = local[0];
  const last = local[local.length - 1];
  const stars = "*".repeat(Math.min(3, local.length - 2));
  return `${first}${stars}${last}${domain}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test test/login-validation.test.ts`
Expected: PASS (3 tests passing).

- [ ] **Step 5: Commit**

```bash
git add lib/login-validation.ts test/login-validation.test.ts
git commit -m "feat: add email validation and masking utilities"
```

---

### Task 3: AppShell & Route Isolation

**Files:**
- Create: `components/layout/app-shell.tsx`
- Modify: `app/layout.tsx:30-41`
- Modify: `components/ui/sidebar.tsx:184-189`

**Interfaces:**
- Consumes: `usePathname()` from `next/navigation`
- Produces: `<AppShell>{children}</AppShell>` that suppresses dashboard sidebar and live providers on `/login`.

- [ ] **Step 1: Create AppShell component**

Create `components/layout/app-shell.tsx`:
```tsx
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { CaptureQueueProvider } from "@/components/providers/capture-queue-provider";
import LiveDataRefreshProvider from "@/components/providers/live-data-refresh-provider";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login";

  if (isAuthRoute) {
    return (
      <main className="min-h-screen w-full bg-white">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <Sidebar />
      <CaptureQueueProvider>
        <LiveDataRefreshProvider />
        {children}
      </CaptureQueueProvider>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/layout.tsx` to wrap body with `AppShell`**

Replace lines 30-37 in `app/layout.tsx`:
```tsx
import AppShell from "@/components/layout/app-shell";
```
And inside `RootLayout`:
```tsx
      <body className="flex h-screen w-full flex-col overflow-hidden bg-white">
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" richColors closeButton />
      </body>
```

- [ ] **Step 3: Update `Sidebar` logout button to navigate to `/login`**

In `components/ui/sidebar.tsx`, replace lines 184-189 with an accessible `Link`:
```tsx
          <Link
            href="/login"
            className={`flex w-full items-center gap-2 rounded-md p-2 text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-700 ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <LogOutIcon size={18} aria-hidden="true" />
            {collapsed ? null : <span className="text-sm font-medium tracking-tighter text-current">Logout</span>}
          </Link>
```

- [ ] **Step 4: Run linter and tests**

Run: `npm run lint`
Expected: Clean pass with no errors.

- [ ] **Step 5: Commit**

```bash
git add components/layout/app-shell.tsx app/layout.tsx components/ui/sidebar.tsx
git commit -m "feat: isolate auth routes from dashboard shell and link sidebar logout"
```

---

### Task 4: Vector Enterprise Badges Component

**Files:**
- Create: `components/login/enterprise-logos.tsx`

**Interfaces:**
- Produces: `<EnterpriseLogos />` rendering clean SVG marks for OpenAI, Stripe, Supabase, Slack.

- [ ] **Step 1: Implement `components/login/enterprise-logos.tsx`**

Create `components/login/enterprise-logos.tsx`:
```tsx
interface LogoProps {
  className?: string;
}

export function OpenAILogo({ className = "h-5 w-auto" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="OpenAI">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.98 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.784a4.472 4.472 0 0 1 2.365-1.98v5.673a.784.784 0 0 0 .392.68l5.822 3.362-2.02 1.168a.076.076 0 0 1-.071 0l-4.839-2.795A4.505 4.505 0 0 1 2.34 8.784zm16.597 3.855l-5.833-3.37L15.124 8.1a.076.076 0 0 1 .071 0l4.839 2.795a4.504 4.504 0 0 1-.61 8.113v-5.674a.787.787 0 0 0-.487-.695zM20.93 7.697l-.141-.086-4.783-2.758a.771.771 0 0 0-.78 0l-5.843 3.369V5.89a.08.08 0 0 1 .033-.062l4.84-2.788a4.5 4.5 0 0 1 6.674 4.657zm-10.99 4.148l2.06-1.19 2.06 1.19v2.38l-2.06 1.19-2.06-1.19z" />
    </svg>
  );
}

export function StripeLogo({ className = "h-5 w-auto" }: LogoProps) {
  return (
    <svg viewBox="0 0 60 25" fill="currentColor" className={className} aria-label="Stripe">
      <path d="M59.64 14.28c0-4.48-2.18-8.03-7.53-8.03-5.38 0-8.56 3.55-8.56 8.01 0 5.3 3.66 7.96 8.94 7.96 2.58 0 4.52-.58 5.99-1.4l-.87-2.61c-1.25.68-2.8 1.16-4.91 1.16-2.58 0-4.74-.97-5.03-3.83h11.91c.03-.41.06-.85.06-1.26zm-12.01-1.45c.17-2.45 1.74-3.52 3.96-3.52 2.16 0 3.73 1.07 3.91 3.52h-7.87zM35.6 6.57c-1.89 0-3.13.88-3.79 1.51V1.12L27.69 2v20.01h4.12v-9.33c.66-.75 1.83-1.6 3.57-1.6 2.21 0 3.52 1.39 3.52 4.14v6.79h4.12v-7.23c0-4.83-2.44-7.77-7.42-7.77zm-13.89-.32l-4.13.88v3.42h-2.5v3.45h2.5v6.5c0 3.25 1.77 5.09 5.37 5.09 1.48 0 2.58-.26 3.19-.58v-3.28c-.52.2-1.22.38-2.12.38-1.54 0-2.31-.67-2.31-2.29v-5.82h4.43v-3.45h-4.43V6.25zM6.55 10.36c-1.74-.82-2.32-1.34-2.32-2.18 0-.81.76-1.42 2.06-1.42 1.95 0 3.92.79 5.2 1.63l1.45-3.37C11.37 3.96 9.07 3.4 6.29 3.4 2.5 3.4 0 5.4 0 8.78c0 3.37 2.15 4.8 5.58 6.05 2.06.75 2.76 1.4 2.76 2.35 0 .99-.87 1.63-2.38 1.63-2.27 0-4.74-1.07-6.22-2.12L-1.7 20c1.74 1.28 4.5 1.95 7.67 1.95 4.04 0 6.63-1.92 6.63-5.38 0-3.51-2.27-4.88-6.05-6.21z" />
    </svg>
  );
}

export function SupabaseLogo({ className = "h-5 w-auto" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Supabase">
      <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.648 13.916a.396.396 0 0 0 .313.638h9.362v8.958a.396.396 0 0 0 .716.233l10.636-13.753a.396.396 0 0 0-.313-.638z" />
    </svg>
  );
}

export function SlackLogo({ className = "h-5 w-auto" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Slack">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

export function EnterpriseLogos() {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-zinc-700/80">
      <div className="flex items-center gap-1.5 transition-opacity hover:opacity-100">
        <OpenAILogo className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight">OpenAI</span>
      </div>
      <div className="transition-opacity hover:opacity-100">
        <StripeLogo className="h-5 w-auto" />
      </div>
      <div className="flex items-center gap-1.5 transition-opacity hover:opacity-100">
        <SupabaseLogo className="h-4 w-4" />
        <span className="text-sm font-semibold tracking-tight">supabase</span>
      </div>
      <div className="flex items-center gap-1.5 transition-opacity hover:opacity-100">
        <SlackLogo className="h-4 w-4" />
        <span className="text-sm font-semibold tracking-tight">slack</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/login/enterprise-logos.tsx
git commit -m "feat: add enterprise logos component for login page"
```

---

### Task 5: Animated Dither Canvas Component

**Files:**
- Create: `components/login/dither-canvas.tsx`

**Interfaces:**
- Consumes: `computeWaveIntensity`, `getBayerThreshold` from `lib/dither.ts`
- Produces: `<DitherCanvas />` (client component rendering the interactive 2D canvas)

- [ ] **Step 1: Implement `components/login/dither-canvas.tsx`**

Create `components/login/dither-canvas.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { computeWaveIntensity, getBayerThreshold } from "@/lib/dither";

export default function DitherCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let startTime = performance.now();

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", onMotionChange);

    const step = 3; // Pixel grid step (3px)

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current = null;
    };

    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave, { passive: true });

    const render = (now: number) => {
      const time = isReducedMotion ? 0 : (now - startTime) * 0.001;

      // Base background: clean soft light gray
      ctx.fillStyle = "#f4f4f5";
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const mouseX = mouse?.x;
      const mouseY = mouse?.y;

      // Dither dot color: soft slate
      ctx.fillStyle = "rgba(71, 85, 105, 0.22)";

      const cols = Math.ceil(width / step);
      const rows = Math.ceil(height / step);

      for (let r = 0; r < rows; r++) {
        const y = r * step;
        for (let c = 0; c < cols; c++) {
          const x = c * step;
          const intensity = computeWaveIntensity(x, y, time, mouseX, mouseY);
          const threshold = getBayerThreshold(c, r);

          if (intensity > threshold) {
            ctx.fillRect(x, y, step - 0.5, step - 0.5);
          }
        }
      }

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", onMotionChange);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full overflow-hidden bg-zinc-100"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Verify component compiles cleanly**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/login/dither-canvas.tsx
git commit -m "feat: implement animated dither canvas with mouse reactivity"
```

---

### Task 6: Work Email Magic Link Form Component

**Files:**
- Create: `components/login/login-form.tsx`

**Interfaces:**
- Consumes: `validateWorkEmail`, `maskEmail` from `lib/login-validation.ts`
- Produces: `<LoginForm />` (client component managing input, validation, magic link submission, and confirmation card)

- [ ] **Step 1: Implement `components/login/login-form.tsx`**

Create `components/login/login-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { validateWorkEmail, maskEmail } from "@/lib/login-validation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateWorkEmail(email);
    if (!validation.valid) {
      setError(validation.error || "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    // Simulate authentication magic link dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSent(true);
    toast.success(`Magic link sent to ${email}`);
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    toast.success(`New magic link dispatched to ${email}`);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Brand Icon Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-800">
          <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-zinc-900">SecureMailScope</span>
          <span className="block text-xs font-medium text-zinc-500">Security & Packet Analysis</span>
        </div>
      </div>

      {!isSent ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Enter your work email to get a magic link.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="work-email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700"
              >
                Work email
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="work-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@company.com"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "email-error" : "email-helper"}
                  className={`block w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10"
                  }`}
                />
              </div>

              {error ? (
                <p id="email-error" className="mt-1.5 text-xs text-red-600 font-medium">
                  {error}
                </p>
              ) : (
                <p id="email-helper" className="mt-1.5 text-xs text-zinc-500">
                  Your magic link stays active for 15 minutes.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Sending magic link...</span>
                </>
              ) : (
                <>
                  <span>Send magic link</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        /* Sent Confirmation State */
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Check your inbox</h2>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            We sent a secure magic link to{" "}
            <span className="font-semibold text-zinc-900">{maskEmail(email)}</span>. Click the link
            in your email to sign in to your workspace.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors"
            >
              <span>Enter Dashboard (Demo)</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResend}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Sending new link..." : "Didn't get the email? Send again"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail("");
              }}
              className="block w-full text-center text-xs text-zinc-500 hover:text-zinc-800 mt-2"
            >
              Use a different email address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/login/login-form.tsx
git commit -m "feat: implement login form with validation, magic link flow, and confirmation state"
```

---

### Task 7: Login Page Integration & Responsive Split Layout

**Files:**
- Create: `app/login/page.tsx`

**Interfaces:**
- Consumes: `<LoginForm />`, `<DitherCanvas />`, `<EnterpriseLogos />`
- Produces: `/login` route

- [ ] **Step 1: Implement `app/login/page.tsx`**

Create `app/login/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Star } from "lucide-react";
import DitherCanvas from "@/components/login/dither-canvas";
import LoginForm from "@/components/login/login-form";
import { EnterpriseLogos } from "@/components/login/enterprise-logos";

export const metadata: Metadata = {
  title: "Sign in | SecureMailScope",
  description: "Sign in to SecureMailScope to analyze SMTP, IMAP, and POP3 network sessions.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row bg-white">
      {/* Left Column: Sign-in Form */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 md:w-1/2 lg:w-[45%] xl:w-[40%] md:min-h-screen md:p-12 lg:p-16 z-10 bg-white">
        <div className="flex-1 flex flex-col justify-center py-8">
          <LoginForm />
        </div>

        {/* Left Column Footer */}
        <div className="text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} SecureMailScope Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Animated Dither Canvas & Testimonial Overlay */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between overflow-hidden border-l border-zinc-200/80 bg-zinc-50 p-8 sm:p-12 lg:p-16">
        {/* Animated Dither Canvas Background */}
        <DitherCanvas />

        {/* Center Testimonial Card Overlay */}
        <div className="relative z-10 my-auto max-w-xl">
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-amber-500 mb-6" aria-label="5 out of 5 stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
          </div>

          {/* Testimonial Quote */}
          <blockquote className="text-2xl lg:text-3xl font-semibold tracking-tight text-zinc-900 leading-snug">
            “The best security tools disappear into your workflow. SecureMailScope already feels instantaneous.”
          </blockquote>

          {/* Testimonial Author */}
          <div className="mt-8 flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white shadow-sm ring-2 ring-white">
              SB
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Sean Bold</div>
              <div className="text-xs text-zinc-500">Co-founder • ReUI</div>
            </div>
          </div>
        </div>

        {/* Enterprise Trust Logos Footer */}
        <div className="relative z-10 pt-8 border-t border-zinc-200/70">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Trusted by leading teams
          </p>
          <EnterpriseLogos />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation and linting**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: integrate white theme animated login page with split layout"
```

---

### Task 8: Full Test Suite, Build & End-to-End Verification

**Files:**
- Test: All test files in `test/`
- Build: Next.js build verification

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: All tests pass cleanly.

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: Clean pass with 0 errors and 0 warnings.

- [ ] **Step 3: Run Next.js production build**

Run: `npm run build`
Expected: Successfully generates static and dynamic routes including `/login` and `/`.

- [ ] **Step 4: Final commit and verification log**

```bash
git status
```
Ensure working tree is clean.
