# SecureMailScope Dashboard Metrics Design

**Status:** Draft for review  
**Date:** 2026-09-09  
**Scope:** Initial dashboard metrics placeholders

## 1. Objective

Add the first metrics section to the existing dashboard page without changing the current sidebar, breadcrumb, or route structure.

The initial dashboard shows exactly four metric cards in one row on desktop:

1. **Sessions analysed**
2. **Flagged sessions**
3. **Average risk score**
4. **Evidence archived**

The main page remains a read-only overview. No analysis submission, history navigation, or remediation action is included in this slice.

## 2. Acceptance check

A dashboard visitor can open the initial page and see four consistently sized metric cards beneath the existing breadcrumb. The cards render typed placeholder data, retain clear loading/empty states, and do not present missing data as a safe or zero-risk result.

## 3. Data contract

The current backend aggregate endpoint is:

```http
GET /api/v1/analyses/stats
```

It currently provides `total_analyses`, `avg_risk_score`, and verdict distribution data. It does not currently provide authoritative `flagged_sessions` or `evidence_archived` fields.

The placeholder UI uses a frontend adapter contract so the missing backend fields are explicit:

```ts
type DashboardMetrics = {
  sessions_analysed: number;
  flagged_sessions: number;
  avg_risk_score: number | null; // 0..1
  evidence_archived: number;
};
```

Current and planned mappings:

| Dashboard field | Current backend mapping | Live-contract requirement |
|---|---|---|
| `sessions_analysed` | `StatsResponse.total_analyses` | Keep the existing aggregate count or expose the aliased name |
| `flagged_sessions` | None | Backend must define and return the authoritative count; the browser must not guess severity membership |
| `avg_risk_score` | `StatsResponse.avg_risk_score` | Keep the existing 0..1 ratio |
| `evidence_archived` | None | Backend must define what archived evidence means and return the count |

A local typed fixture may provide all four values for the initial visual implementation. Fixture data must be clearly marked as preview/demo data until a live API boundary is wired.

## 4. Metric presentation

| Card | Presentation | Missing-data behavior |
|---|---|---|
| Sessions analysed | Integer with locale grouping | Show `—` when unavailable |
| Flagged sessions | Integer with locale grouping and a flagged-status label | Show `—` when unavailable; do not infer from raw verdict names |
| Average risk score | Percentage, one decimal place | Show `Not available` for `null`; never infer safety |
| Evidence archived | Integer with locale grouping | Show `—` when unavailable |

The browser may format values, but it must not invent risk policy, flagged-session rules, or evidence-retention semantics.

## 5. Layout and visual requirements

- Preserve the existing collapsible sidebar and external sidebar toggle.
- Preserve the existing `Dashboard > Overview` breadcrumb.
- Place the metrics section directly below the breadcrumb bar.
- Use a four-column grid at desktop widths with equal card widths and a consistent gap.
- Stack cards at narrower widths; do not introduce horizontal scrolling.
- Keep the visual language minimal: white cards, subtle border, small label, prominent value, and optional supporting text.
- Use semantic warning styling for Flagged sessions and Average risk score, pairing color with text or an icon.
- Do not add charts, animation, filters, API controls, or a new component library.

Suggested content structure:

```text
Dashboard > Overview

[ Sessions analysed ] [ Flagged sessions ] [ Average risk score ] [ Evidence archived ]
```

## 6. UI states

### Preview/fixture state

- Render representative typed fixture values only when the page is explicitly in preview mode.
- Mark the metrics section as preview/demo data when fixture values are visible.
- Keep the fixture separate from the eventual fetch boundary.

### Loading state

- Preserve the four-card layout.
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
- A typed fixture or future fetch adapter owns the `DashboardMetrics` data shape.
- Formatting helpers may convert ratios to percentages and numbers to locale strings.
- Business rules remain in backend/API contracts, not in card copy or CSS.

No authentication, API key, mutation, retry loop, or persistence work is part of the placeholder implementation.

## 8. Accessibility requirements

- Use a section heading or accessible label for the metrics group.
- Each card must expose a readable label and value to assistive technology.
- Do not rely on color alone to identify flagged sessions or risk.
- Preserve visible focus styles for any future interactive elements; metric cards are non-interactive in this slice.
- Maintain readable contrast and responsive text sizing.

## 9. Verification

- `npm run lint` passes without new warnings.
- `npm run build` completes successfully.
- `git diff --check` passes.
- The desktop layout renders exactly four cards in one row.
- A narrow viewport stacks the cards without clipping.
- Preview, loading, null average-risk, unavailable flagged count, unavailable evidence count, and degraded states do not crash or show fabricated values.

## 10. Deferred work

- Extend or adapt `/api/v1/analyses/stats` to return authoritative flagged-session and evidence-archive metrics.
- Live fetching from the stats endpoint.
- Authenticated API proxy and environment configuration.
- Recent analyses table and detailed risk views.
- Metric trend comparisons and time windows.
- Server-side caching, polling, and refresh controls.
