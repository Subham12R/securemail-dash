# Apple & System Alert Hybrid Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize SecureMailScope's notification system by creating an iOS frosted glass `AppleSystemAlertBanner` component (combining opensourceui.in Apple Notification & System Alert patterns) and wiring it to Sonner's `toast.custom` in `lib/notifications.ts`.

**Architecture:** Build a typed React component `components/notifications/apple-system-alert.tsx` featuring adaptive squircle severity tiles, frosted glass backdrop, dismiss transitions, and optional action pills. Connect all notifications in `lib/notifications.ts` (`notifyCriticalThreat`, `notifyAnalysisComplete`, `notifyExtractionProgress`) through `toast.custom` with support for light mode and `dark-soc` SOC dark mode.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Sonner, Node.js test runner (`node:test`).

## Global Constraints
- Must support light mode and `dark-soc` dark theme without unreadable contrast.
- Must preserve existing `lib/notifications.ts` callers without breaking parameter contracts.
- Must preserve Sonner's auto-dismiss timers, swipe-to-dismiss, and stacking behaviors.
- No external unvetted dependencies; use existing `clsx`, `tailwind-merge`, `lucide-react`, `sonner`.

---

### Task 1: Notification Types & Contract Unit Tests

**Files:**
- Create: `test/notifications.test.ts`
- Modify: `lib/notifications.ts`

**Interfaces:**
- Produces:
  - `type AlertVariant = "critical" | "warning" | "success" | "info"`
  - `interface AppleSystemAlertAction { label: string; onClick: () => void }`
  - `interface SystemAlertOptions { variant?: AlertVariant; appName?: string; title: string; description: string; time?: string; action?: AppleSystemAlertAction; avatarSrc?: string; duration?: number }`
  - `buildSystemAlertPayload(options: SystemAlertOptions)` helper function for predictable testable payload construction.

- [ ] **Step 1: Write the failing test**

Create `test/notifications.test.ts`:
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSystemAlertPayload,
  type SystemAlertOptions,
} from "../lib/notifications.ts";

test("buildSystemAlertPayload assigns default duration and appName for critical threats", () => {
  const options: SystemAlertOptions = {
    variant: "critical",
    title: "Weak TLS Handshake",
    description: "Insecure cipher detected.",
  };

  const payload = buildSystemAlertPayload(options);
  assert.equal(payload.variant, "critical");
  assert.equal(payload.appName, "SecureMailScope");
  assert.equal(payload.duration, 8000);
  assert.equal(payload.time, "now");
});

test("buildSystemAlertPayload configures success alerts with 5000ms duration", () => {
  const options: SystemAlertOptions = {
    variant: "success",
    title: "Analysis Complete",
    description: "No threats flagged.",
  };

  const payload = buildSystemAlertPayload(options);
  assert.equal(payload.variant, "success");
  assert.equal(payload.duration, 5000);
});

test("buildSystemAlertPayload preserves custom appName and explicit duration", () => {
  const options: SystemAlertOptions = {
    variant: "info",
    appName: "PCAP Dissector",
    title: "Extracting Packets",
    description: "Streaming bytes...",
    duration: 3500,
  };

  const payload = buildSystemAlertPayload(options);
  assert.equal(payload.appName, "PCAP Dissector");
  assert.equal(payload.duration, 3500);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test test/notifications.test.ts`
Expected: FAIL with `buildSystemAlertPayload is not exported from ../lib/notifications.ts`

- [ ] **Step 3: Implement `buildSystemAlertPayload` and types in `lib/notifications.ts`**

Update `lib/notifications.ts`:
```typescript
export type AlertVariant = "critical" | "warning" | "success" | "info";

export interface AppleSystemAlertAction {
  label: string;
  onClick: () => void;
}

export interface SystemAlertOptions {
  variant?: AlertVariant;
  appName?: string;
  title: string;
  description: string;
  time?: string;
  action?: AppleSystemAlertAction;
  avatarSrc?: string;
  duration?: number;
}

export function buildSystemAlertPayload(options: SystemAlertOptions) {
  const variant = options.variant ?? "info";
  const defaultDuration =
    variant === "critical" || variant === "warning" ? 8000 : 5000;

  return {
    ...options,
    variant,
    appName: options.appName || "SecureMailScope",
    time: options.time || "now",
    duration: options.duration ?? defaultDuration,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test test/notifications.test.ts`
Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add test/notifications.test.ts lib/notifications.ts
git commit -m "test(notifications): add contract unit tests and payload builder"
```

---

### Task 2: Build `AppleSystemAlertBanner` Component

**Files:**
- Create: `components/notifications/apple-system-alert.tsx`

**Interfaces:**
- Consumes: `AlertVariant`, `AppleSystemAlertAction` from `lib/notifications.ts`
- Produces: `export const AppleSystemAlertBanner: React.FC<AppleSystemAlertBannerProps>`

- [ ] **Step 1: Create `components/notifications/apple-system-alert.tsx`**

Implement component with:
- Frosted glass container (`backdrop-blur-xl`, rounded-[1.25rem], shadow, border)
- Light theme & `dark-soc` classes
- Adaptive squircle severity tile (Rose / `ShieldAlert`, Amber / `AlertTriangle`, Emerald / `CheckCircle2`, Sky / `Cpu` or `Loader2`)
- Optional `avatarSrc` image with `next/image` or `<img>`
- Header: `appName`, `time`, and dismiss `[×]` button
- Body: `title` in bold + `: ` + `description`
- Action button pill (if `action` prop provided) with click handling and `toast.dismiss(toastId)`
- Smooth exit transition when closing

```tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { AlertVariant, AppleSystemAlertAction } from "@/lib/notifications";

const EXIT_MS = 220;

export interface AppleSystemAlertBannerProps {
  toastId?: string | number;
  appName?: string;
  variant?: AlertVariant;
  title: string;
  description: string;
  time?: string;
  action?: AppleSystemAlertAction;
  avatarSrc?: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function AppleSystemAlertBanner({
  toastId,
  appName = "SecureMailScope",
  variant = "info",
  title,
  description,
  time = "now",
  action,
  avatarSrc,
  icon,
  onDismiss,
  className,
}: AppleSystemAlertBannerProps) {
  const [phase, setPhase] = useState<"open" | "closing">("open");

  const handleDismiss = () => {
    if (phase !== "open") return;
    setPhase("closing");
    onDismiss?.();
    setTimeout(() => {
      if (toastId !== undefined) {
        toast.dismiss(toastId);
      }
    }, EXIT_MS);
  };

  const handleAction = () => {
    if (action) {
      action.onClick();
      if (toastId !== undefined) {
        toast.dismiss(toastId);
      }
    }
  };

  const renderIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case "critical":
        return <ShieldAlert size={18} className="text-white" strokeWidth={2.2} />;
      case "warning":
        return <AlertTriangle size={18} className="text-white" strokeWidth={2.2} />;
      case "success":
        return <CheckCircle2 size={18} className="text-white" strokeWidth={2.2} />;
      case "info":
      default:
        return <Cpu size={18} className="text-white" strokeWidth={2.2} />;
    }
  };

  const tileBgClass = {
    critical: "bg-rose-500 shadow-rose-500/20",
    warning: "bg-amber-500 shadow-amber-500/20",
    success: "bg-emerald-500 shadow-emerald-500/20",
    info: "bg-sky-500 shadow-sky-500/20",
  }[variant];

  return (
    <div
      role="status"
      data-phase={phase}
      className={cn(
        "pointer-events-auto relative w-88 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.25rem] p-0 font-sans select-none",
        "border border-white/70 bg-white/90 text-neutral-900 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] backdrop-blur-xl",
        "dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]/90 dark-soc:text-neutral-100 dark-soc:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.50)]",
        "transition-all duration-240 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        phase === "closing" && "-translate-y-2 opacity-0 duration-200 ease-in",
        className,
      )}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss alert"
        className="absolute top-2.5 right-2.5 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-700 dark-soc:text-slate-400 dark-soc:hover:bg-white/10 dark-soc:hover:text-slate-200"
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      {/* Grid: Tile/Avatar on left + Body on right */}
      <div className="grid grid-cols-[2.375rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 p-3.5 pr-8">
        {/* Left Squircle or Avatar */}
        {avatarSrc ? (
          <div className="relative row-span-2 mt-0.5 size-9.5 shrink-0 overflow-hidden rounded-[0.625rem] shadow-sm ring-1 ring-black/5">
            <Image
              src={avatarSrc}
              alt="Avatar"
              fill
              sizes="38px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              "row-span-2 mt-0.5 flex size-9.5 shrink-0 items-center justify-center rounded-[0.625rem] shadow-sm ring-1 ring-black/5",
              tileBgClass,
            )}
          >
            {renderIcon()}
          </div>
        )}

        {/* Subsystem & Timestamp */}
        <div className="col-start-2 flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-[12px] font-semibold text-neutral-900 tracking-tight dark-soc:text-neutral-100">
            {appName}
          </p>
          <span className="shrink-0 text-[10.5px] text-neutral-400 dark-soc:text-slate-400 font-medium">
            {time}
          </span>
        </div>

        {/* Title & Description */}
        <div className="col-start-2 space-y-1.5">
          <p className="text-[12.5px] leading-snug text-neutral-700 dark-soc:text-slate-300">
            <span className="font-semibold text-neutral-900 dark-soc:text-white">
              {title}
            </span>
            <span className="text-neutral-400 dark-soc:text-slate-500 font-normal">
              :{" "}
            </span>
            {description}
          </p>

          {/* Action pill button */}
          {action && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleAction}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 dark-soc:bg-[#1E2D56] dark-soc:text-blue-100 dark-soc:hover:bg-[#2A3F75]"
              >
                <span>{action.label}</span>
                <span className="text-[10px] leading-none">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type check and test compile**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/notifications/apple-system-alert.tsx
git commit -m "feat(ui): add AppleSystemAlertBanner hybrid notification component"
```

---

### Task 3: Wire Notification Engine in `lib/notifications.ts` and `app/layout.tsx`

**Files:**
- Modify: `lib/notifications.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `lib/notifications.ts` to trigger `toast.custom`**

Wire `notifySystemAlert`, `notifyCriticalThreat`, `notifyAnalysisComplete`, `notifyExtractionProgress` to render `AppleSystemAlertBanner`:
```typescript
import { toast } from "sonner";
import { AppleSystemAlertBanner } from "@/components/notifications/apple-system-alert";

export function notifySystemAlert(options: SystemAlertOptions): string | number {
  const payload = buildSystemAlertPayload(options);
  return toast.custom(
    (id) => (
      <AppleSystemAlertBanner
        toastId={id}
        appName={payload.appName}
        variant={payload.variant}
        title={payload.title}
        description={payload.description}
        time={payload.time}
        action={payload.action}
        avatarSrc={payload.avatarSrc}
      />
    ),
    { duration: payload.duration },
  );
}

export function notifyCriticalThreat({
  title,
  description,
  requestId,
  actionLabel = "Inspect",
}: CriticalThreatNotification) {
  notifySystemAlert({
    variant: "critical",
    appName: "SOC Alert",
    title,
    description,
    duration: 8000,
    action: requestId
      ? {
          label: actionLabel,
          onClick: () => {
            window.location.href = `/history/${encodeURIComponent(requestId)}`;
          },
        }
      : undefined,
  });
}

export function notifyAnalysisComplete({
  filename,
  sessionCount,
  criticalCount = 0,
  latestRequestId,
}: {
  filename: string;
  sessionCount: number;
  criticalCount?: number;
  latestRequestId?: string;
}) {
  if (criticalCount > 0) {
    notifySystemAlert({
      variant: "warning",
      appName: "Analysis Engine",
      title: `Critical Threats Detected (${criticalCount})`,
      description: `${filename}: ${sessionCount} session(s) analyzed. Malicious or degraded transport flagged.`,
      duration: 8000,
      action: latestRequestId
        ? {
            label: "Inspect",
            onClick: () => {
              window.location.href = `/history/${encodeURIComponent(latestRequestId)}`;
            },
          }
        : undefined,
    });
  } else {
    notifySystemAlert({
      variant: "success",
      appName: "Analysis Engine",
      title: "Analysis Completed",
      description: `${filename}: ${sessionCount} session(s) analyzed. No critical violations found.`,
      duration: 5000,
      action: latestRequestId
        ? {
            label: "View details",
            onClick: () => {
              window.location.href = `/history/${encodeURIComponent(latestRequestId)}`;
            },
          }
        : undefined,
    });
  }
}

export function notifyExtractionProgress({
  filename,
  phase,
  sessionsExtracted,
}: {
  filename: string;
  phase: "queued" | "extracting" | "analyzing";
  sessionsExtracted?: number;
}) {
  if (phase === "queued") {
    notifySystemAlert({
      variant: "info",
      appName: "PCAP Queue",
      title: "Capture Queued",
      description: `${filename} added to analysis queue.`,
      duration: 3000,
    });
  } else if (phase === "extracting") {
    notifySystemAlert({
      variant: "info",
      appName: "PCAP Dissector",
      title: "Dissecting Packets",
      description: `Extracting protocol streams from ${filename}.`,
      duration: 3500,
    });
  } else if (phase === "analyzing") {
    notifySystemAlert({
      variant: "info",
      appName: "Transport Security",
      title: "Evaluating Transport",
      description: `Classifying ${sessionsExtracted ?? ""} session(s) against ML models and RFC rules.`,
      duration: 3500,
    });
  }
}
```

- [ ] **Step 2: Check `app/layout.tsx` Toaster configuration**

Inspect `app/layout.tsx` to verify `<Toaster position="top-right" />` cleanly renders custom toasts without default border/background collisions.

- [ ] **Step 3: Run all unit tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/notifications.ts app/layout.tsx
git commit -m "feat(notifications): connect all app notifications to AppleSystemAlertBanner"
```

---

### Task 4: Full System Verification & Build Check

**Files:**
- Test: `test/notifications.test.ts`
- Verify: Full test suite and Next.js build

- [ ] **Step 1: Add end-to-end trigger integration test in `test/notifications.test.ts`**

Verify that all domain helper functions call `buildSystemAlertPayload` with correct arguments and severity classifications.

- [ ] **Step 2: Run test suite**

Run: `npm test`
Expected: 61+ passing tests, 0 failures.

- [ ] **Step 3: Run full Next.js production build**

Run: `npm run build`
Expected: Clean build without lint or typescript compilation issues.

- [ ] **Step 4: Commit**

```bash
git add test/notifications.test.ts
git commit -m "test(notifications): verify full notification domain suite and build"
```
