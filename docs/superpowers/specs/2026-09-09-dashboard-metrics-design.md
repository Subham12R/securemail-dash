# SecureMailScope Dashboard Metrics Design

**Status:** Draft for review  
**Date:** 2026-09-09  
**Scope:** Initial dashboard metrics placeholders

## 1. Objective

Add the first metrics section to the existing dashboard page without changing the current sidebar, breadcrumb, or route structure.

The initial dashboard shows exactly three metric cards in one row on desktop:

1. **Total analyses**
2. **Average risk**
3. **Critical analyses**

The main page remains a read-only overview. No analysis submission, history navigation, or remediation action is included in this slice.

## 2. Acceptance check

A dashboard visitor can open the initial page and see three consistently sized metric cards beneath the existing breadcrumb. The cards render typed placeholder data, retain a clear loading/empty state, and do not present missing data as a safe or zero-risk result.

## 3. Backend contract

The future data source is the existing aggregate endpoint:

```http
GET /api/v1/analyses/stats
```

Response shape:

```ts
type VerdictCount = {
  verdict: string;
  count: number;
};

type StatsResponse = {
  total_analyses: number;
  total_synthetic: number;
  total_real: number;
  avg_risk_score: number | null; // 0..1
  verdict_distribution: VerdictCount[];
  total_validations: number;
  validation_pass_rate: number | null; // 0..1
};
```

The first UI slice may use a local typed fixture with this exact response shape. It must be clearly treated as preview data until a live API boundary is wired.

## 4. Metric mapping

| Card | Source | Presentation | Missing-data behavior |
|---|---|---|---|
| Total analyses | `total_analyses` | Integer with locale grouping | Show `—` when unavailable |
| Average risk | `avg_risk_score` | Percentage, one decimal place | Show `Not available` for `null`; never infer safety |
| Critical analyses | `verdict_distribution` entry where `verdict === "critical"` | Integer with locale grouping | Show `—` when distribution is unavailable; show `0` only when a complete distribution contains no critical entry |

The browser may format values and derive the critical count, but it must not invent risk policy, severity thresholds, or verdicts.

## 5. Layout and visual requirements

- Preserve the existing collapsible sidebar and external sidebar toggle.
- Preserve the existing `Dashboard > Overview` breadcrumb.
- Place the metric section directly below the breadcrumb bar.
- Use a three-column grid at desktop widths with equal card widths and a consistent gap.
- Stack cards vertically on narrow screens; do not introduce horizontal scrolling.
- Keep the visual language minimal: white cards, subtle border, small label, prominent value, and optional supporting text.
- Use semantic critical styling for the Critical analyses card, pairing color with a text label or icon.
- Do not add charts, animation, filters, API controls, or a new component library.

Suggested content structure:

```text
Dashboard > Overview

[ Total analyses ] [ Average risk ] [ Critical analyses ]
```

## 6. UI states

### Preview/fixture state

- Render representative typed fixture values only when the page is explicitly in preview mode.
- Mark the section as preview/demo data if fixture values are visible.
- Keep the fixture separate from the eventual fetch boundary.

### Loading state

- Preserve the three-card layout.
- Show neutral skeletons or `—` values.
- Do not animate fake metric changes.

### Empty state

- Show `—` for unavailable aggregate values.
- Do not render an empty dataset as a positive security result.

### Unavailable/degraded state

- Keep the cards visible with unavailable values.
- Add a concise status message explaining that metrics could not be loaded.
- Do not display stale values as current without an explicit last-updated label.

## 7. Component/data boundaries

- `HomePage` owns page composition only.
- A small metrics component owns card layout and presentation.
- A typed fixture or future fetch adapter owns the `StatsResponse` data shape.
- Formatting helpers may convert ratios to percentages and numbers to locale strings.
- Business rules remain in backend/API contracts, not in card copy or CSS.

No authentication, API key, mutation, retry loop, or persistence work is part of the placeholder implementation.

## 8. Accessibility requirements

- Use a section heading or accessible label for the metrics group.
- Each card must expose a readable label and value to assistive technology.
- Do not rely on color alone to identify critical metrics.
- Preserve visible focus styles for any future interactive elements; metric cards are non-interactive in this slice.
- Maintain readable contrast and responsive text sizing.

## 9. Verification

- `npm run lint` passes without new warnings.
- `npm run build` completes successfully.
- `git diff --check` passes.
- The desktop layout renders exactly three cards in one row.
- A narrow viewport stacks the cards without clipping.
- Preview, loading, null average-risk, missing distribution, and unavailable states do not crash or show fabricated values.

## 10. Deferred work

- Live fetching from `/api/v1/analyses/stats`.
- Authenticated API proxy and environment configuration.
- Recent analyses table and detailed risk views.
- Metric trend comparisons and time windows.
- Server-side caching, polling, and refresh controls.
