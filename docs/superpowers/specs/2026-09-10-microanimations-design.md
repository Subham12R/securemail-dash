# SecureMailScope Microanimations Specification

**Date:** 2026-09-10  
**Status:** In Review  
**Target:** `app/globals.css`, `components/ui/recent-analysis-table.tsx`, `components/ui/history-table.tsx`, `components/ui/inbox-list.tsx`, `components/ui/overview-charts.tsx`, `app/pages/home.tsx`

---

## 1. Objective

This specification details the microanimations and interactive tactile feedback across SecureMailScope, ensuring tables, charts, and metric surfaces feel responsive, lively, and fluid without introducing motion sickness or performance overhead.

---

## 2. Table Row Microanimations (Staggered Blur-In Reveal)

### 2.1 Motion Curve & Properties
- **Animation Name:** `row-blur-reveal`
- **Duration:** 380ms – 400ms
- **Timing Function:** Physics-inspired cubic bezier: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out)
- **Keyframes:**
  - `0%`: `opacity: 0; filter: blur(4px); transform: translateY(6px);`
  - `100%`: `opacity: 1; filter: blur(0); transform: translateY(0);`
- **Stagger Mechanics:**
  - Each rendered row index `i` receives `animation-delay: (min(i, 12) * 35)ms`.
  - Capped at index 12 (~420ms max delay) to maintain instantaneous responsiveness on large datasets.
  - Applied with `animation-fill-mode: both` so rows start hidden/blurred before their delay triggers.

### 2.2 Row Hover Micro-Interactions
- Subtle background transition on hover: `hover:bg-zinc-50/80 transition-colors duration-150`.
- Badges and action links within the hovered row feature subtle scale feedback (`hover:scale-105 transition-transform`).

---

## 3. Chart Microanimations (`OverviewCharts`)

### 3.1 Bar Chart (`Verdict Distribution`)
- **Entrance Animation:** Re-enable Recharts `isAnimationActive={true}` with `animationDuration={700}` and `animationEasing="ease-out"`.
- **Bar Hover State:**
  - When hovering over a bar, cursor shows a soft backdrop highlight.
  - Active bar slightly scales or deepens in contrast, while non-hovered bars dim slightly (`opacity: 0.8`).
- **Tooltip Animation:** Fluid SVG tooltip repositioning with subtle fade and drop shadow.

### 3.2 Donut / Pie Chart (`Cryptographic Posture`)
- **Entrance Animation:** `isAnimationActive={true}`, `animationDuration={850}` with smooth rotation/growth.
- **Dynamic Sector Expansion:**
  - Active hovered slice expands outwards by +8px (`outerRadius + 8`) with a smooth spring transition.
- **Center Statistical Display:**
  - The center donut cavity dynamically displays the active slice name, count, and calculated percentage on hover.

---

## 4. Metric Cards & System Micro-States

- **Dashboard Metric Cards:**
  - Elevation lift on hover: `motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md transition-all duration-200`.
- **Progress Gauges & Sliders:**
  - SVG stroke fill uses `transition-all duration-700 ease-out` on mount or value update.

---

## 5. Accessibility & Reduced Motion

- All animation utilities strictly respect `@media (prefers-reduced-motion: reduce)`:
  - Disables blur filters, transforms, and staggered delays.
  - Recharts animations fall back to immediate static rendering when reduced motion is detected.
