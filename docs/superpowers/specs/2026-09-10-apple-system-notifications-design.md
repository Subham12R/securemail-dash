# Design Specification: Apple & System Alert Hybrid Notification System

## 1. Overview
This specification details the modernization of SecureMailScope's alert and notification system by blending two complementary UI patterns from opensourceui.in:
1. **Apple Notification Banner** ([opensourceui.in/components/apple-notification](https://opensourceui.in/components/apple-notification)): Frosted glass iOS aesthetic, elegant typography, timestamping, smooth dismiss transitions, and optional sender/avatar attributes.
2. **System Alert Banner** ([opensourceui.in/components/system-alert](https://opensourceui.in/components/system-alert)): Settings-style status indicator with colored squircle icon tiles, inline `Title: Description` structure, and diagnostic clarity for warnings, quotas, and security anomalies.

The resulting component, `AppleSystemAlertBanner`, serves as the unified floating notification component across the dashboard, powered by Sonner's `toast.custom` engine with native light and `dark-soc` theme integration.

---

## 2. Requirements & Constraints
1. **Visual Style**:
   - iOS-style frosted glass container with `backdrop-blur-xl`, subtle border, rounded squircle corners (`rounded-[1.25rem]`), and deep ambient elevation.
   - Support for both default light mode and the dashboard's `dark-soc` SOC dark theme.
2. **Adaptive Severity Tiles**:
   - 38×38px squircle icon tile on the left:
     - `critical`: Rose-500 tile with `ShieldAlert` vector icon.
     - `warning`: Amber-500 tile with `AlertTriangle` vector icon.
     - `success`: Emerald-500 tile with `CheckCircle2` vector icon.
     - `info`: Sky-500 tile with `Cpu` (or spinning `Loader2` for in-progress captures).
   - Optional `avatarSrc` image override when messages originate from AI security agents.
3. **Information Layout**:
   - Top header: Subsystem/app name (`SecureMailScope`, `SOC Engine`, `PCAP Parser`) + timestamp (`now`) + dismiss button (`X`).
   - Content row: `<span className="font-semibold text-neutral-900 dark-soc:text-white">{title}</span>: {description}`.
   - Interactive Action: Optional sleek pill action button (e.g., `Inspect →`, `View details`) triggering client-side routing and auto-dismiss.
4. **Integration**:
   - Full backward compatibility for existing notification callers (`notifyCriticalThreat`, `notifyAnalysisComplete`, `notifyExtractionProgress` in `lib/notifications.ts`).
   - Seamless wiring into `app/layout.tsx` via Sonner `toast.custom`, keeping Sonner's auto-dismiss timers, swipe-to-dismiss, and stacking order.

---

## 3. Component Architecture

### 3.1 File Structure
```
components/
└── notifications/
    └── apple-system-alert.tsx       # Unified Apple/System Alert banner component
lib/
└── notifications.ts                 # Typed trigger functions utilizing toast.custom
app/
└── layout.tsx                       # Toaster mount configuration
```

### 3.2 Component Interface (`apple-system-alert.tsx`)
```typescript
export type AlertVariant = "critical" | "warning" | "success" | "info";

export interface AppleSystemAlertAction {
  label: string;
  onClick: () => void;
}

export interface AppleSystemAlertProps {
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
```

### 3.3 Theming Matrix

| Element | Light Theme | `dark-soc` Theme |
| :--- | :--- | :--- |
| **Card Background** | `bg-white/90 border-white/70 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)]` | `bg-[#111C38]/90 border-[#1E2D56] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.50)]` |
| **Subsystem Title** | `text-neutral-900` | `text-neutral-100` |
| **Timestamp** | `text-neutral-400` | `text-slate-400` |
| **Title Text** | `text-neutral-900 font-semibold` | `text-white font-semibold` |
| **Description Text** | `text-neutral-600` | `text-slate-300` |
| **Dismiss Button** | `text-neutral-400 hover:bg-black/5 hover:text-neutral-700` | `text-slate-400 hover:bg-white/10 hover:text-slate-200` |
| **Action Pill** | `bg-neutral-900 text-white hover:bg-neutral-800` | `bg-[#1E2D56] text-blue-200 hover:bg-[#2A3F75]` |

---

## 4. Notifications System API (`lib/notifications.ts`)

### 4.1 Generic Trigger
```typescript
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

export function notifySystemAlert(options: SystemAlertOptions): string | number {
  const duration = options.duration ?? (options.variant === "critical" ? 8000 : 5000);
  return toast.custom(
    (id) => (
      <AppleSystemAlertBanner
        toastId={id}
        {...options}
      />
    ),
    { duration }
  );
}
```

### 4.2 Specific Domain Triggers
1. **`notifyCriticalThreat`**:
   - `variant`: `"critical"`
   - `appName`: `"SOC Alert"`
   - `title`: e.g. `"Critical Threat Detected"`
   - `action`: `{ label: "Inspect", onClick: () => router.push(`/history/${requestId}`) }`
   - `duration`: `8000ms`
2. **`notifyAnalysisComplete`**:
   - When `criticalCount > 0`: `variant: "warning"`, `appName: "Analysis Engine"`, `title: "Threats Flagged (${criticalCount})"`, `duration: 8000ms`, `action: Inspect`.
   - When `criticalCount === 0`: `variant: "success"`, `appName: "Analysis Engine"`, `title: "Analysis Completed"`, `duration: 5000ms`, `action: View details`.
3. **`notifyExtractionProgress`**:
   - `variant`: `"info"`
   - `appName`: `"PCAP Dissector"`
   - Stages: `queued` (added to queue), `extracting` (extracting packet streams), `analyzing` (evaluating transport rules).
   - `duration`: `3500ms`.

---

## 5. Exit Animations & Interaction Lifecycle
1. When the dismiss button `[×]` is clicked:
   - Triggers exit transition phase (`closing`).
   - Smoothly slides up by `-8px` and fades to `opacity-0` over `200ms`.
   - Fires `toast.dismiss(toastId)` on completion.
2. When the action button is clicked:
   - Executes callback action (e.g. Next.js router transition).
   - Immediately calls `toast.dismiss(toastId)`.

---

## 6. Verification & Test Plan
1. **Component Verification**:
   - Verify all 4 variants (`critical`, `warning`, `success`, `info`) render accurate squircle colors and Lucide icons.
   - Verify action pill presence when `action` prop is provided.
   - Verify clean dismiss animation without ghosting or stuck elements.
2. **Theme Verification**:
   - Toggle between standard light mode and `dark-soc` SOC dark mode; verify contrast, backdrop blur, borders, and readability.
3. **End-to-End Triggering**:
   - Trigger a PCAP analysis capture and verify progression:
     1. Queued / Dissecting info alerts.
     2. Analysis completed success or threat warning alert.
     3. Clicking "Inspect" opens the analysis history page.
