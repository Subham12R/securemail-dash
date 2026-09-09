# Shared Table Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all SecureMail data tables a consistent, accessible toolbar and compact table treatment modeled on the supplied history references.

**Architecture:** A client-side `TableToolbar` owns only visible-row filtering and date-label state. Server pages keep their existing API retrieval and pagination. History, recent-analysis, and analytics tables consume the toolbar with only relevant controls.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, React Aria Components, Lucide.

**Spec:** `docs/superpowers/specs/2026-09-11-table-toolbar-design.md`

## Global Constraints

- Do not add API search/filter parameters, export behavior, or undocumented row actions.
- Filter only records already rendered in the browser; keep server pagination unchanged.
- Preserve semantic tables, keyboard-accessible controls, and horizontal scroll regions.
- Keep loading skeletons neutral and status meaning available in text as well as color.

---

### Task 1: Shared table toolbar

**Files:**
- Create: `components/ui/table-toolbar.tsx`
- Modify: `components/ui/date-range-filter.tsx`

**Interfaces:**
- Produces: `TableToolbar({ searchPlaceholder, filters, onQueryChange, onFilterChange }: TableToolbarProps)`.
- Produces: `DateRangeFilter({ onRangeChange }: { onRangeChange?: (label: string) => void })` with quick ranges and an accessible calendar.

- [ ] **Step 1: Write a browser assertion script**

Create a temporary browser check that opens the History page, verifies `Search history`, `Date range`, `Verdict`, `Source`, and disabled `Export history` controls exist, then exits non-zero if any is missing.

```bash
agent-browser open http://localhost:3000/history
agent-browser eval '["Search history", "Date range", "Verdict", "Source", "Export history"].every(label => document.body.innerText.includes(label)) ? "PASS" : "FAIL"'
```

- [ ] **Step 2: Run it to verify it fails**

Run the script before adding the toolbar. Expected: `FAIL`.

- [ ] **Step 3: Write the minimal implementation**

Create `TableToolbar` with these props:

```ts
type TableToolbarProps = {
  searchPlaceholder: string;
  filters?: ReadonlyArray<{ label: string; value: string; options: readonly string[] }>;
  onQueryChange: (query: string) => void;
  onFilterChange: (name: string, value: string) => void;
  showExport?: boolean;
};
```

Use a native `<input type="search">`, native `<select>` elements, the existing date-range control, and a disabled RichButton with `aria-label="Export history"`. Extend the date control’s popover with quick-range buttons (`Today`, `Yesterday`, `Last 3 days`, `Last 7 days`, `Last 15 days`, `Last 30 days`) beside its React Aria calendar. The control must call `onRangeChange` with the selected label; it must not issue fetches.

- [ ] **Step 4: Run the browser assertion**

Expected: `PASS`, with no Next.js error overlay.

- [ ] **Step 5: Commit**

```bash
git add components/ui/table-toolbar.tsx components/ui/date-range-filter.tsx
git commit -m "feat: add shared table toolbar"
```

### Task 2: History table filters and reference layout

**Files:**
- Modify: `app/history/page.tsx`
- Modify: `components/ui/history-table.tsx`

**Interfaces:**
- Consumes: `TableToolbarProps` from Task 1.
- Produces: local history-row visibility based on query, verdict, and source selections.

- [ ] **Step 1: Write a browser assertion script**

With the History page loaded, enter a known capture/session substring into `Search history` and assert the visible row count is less than or equal to the initial row count. Clear it and assert the count is restored.

```bash
const before = document.querySelectorAll("tbody tr").length;
// fill search with the first rendered identifier prefix
// assert filtered <= before, then clear and assert restored === before
```

- [ ] **Step 2: Run it to verify it fails**

Expected: row count does not change because controls are not wired.

- [ ] **Step 3: Write the minimal implementation**

Make `HistoryTable` a client component. Store `query`, `verdict`, and `source` in local state and filter the existing `records` prop by case-insensitive capture/session ID, request ID, verdict, and source. Place `TableToolbar` above the table. Keep every existing column, timestamp formatting, status badge, empty row, and server pagination link. Add one compact overflow column only as a non-interactive visual indicator if it has no behavior; otherwise omit it.

- [ ] **Step 4: Run the browser assertion**

Expected: filtered rows change and clearing the search restores the original rows.

- [ ] **Step 5: Commit**

```bash
git add app/history/page.tsx components/ui/history-table.tsx
git commit -m "feat: add history table filters"
```

### Task 3: Apply the shared shell to recent-analysis and analytics tables

**Files:**
- Modify: `components/ui/recent-analysis-table.tsx`
- Modify: `components/ui/analysis-workspace.tsx`

**Interfaces:**
- Consumes: `TableToolbarProps` from Task 1.
- Produces: local text/status filtering for each visible table.

- [ ] **Step 1: Write browser assertions**

Assert that the Dashboard recent-analysis and Analytics results tables each expose a search control and that entering a value absent from their rendered rows shows their existing empty-state row.

```bash
agent-browser open http://localhost:3000
agent-browser eval 'document.body.innerText.includes("Search analysis") ? "PASS" : "FAIL"'
```

- [ ] **Step 2: Run the assertions to verify they fail**

Expected: `FAIL` because those toolbars do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Add `TableToolbar` above each table. For Recent Analysis expose search and status; for Analytics Results expose search and processing status. Filter only the client fixture/visible array before mapping rows. Keep metric cards, risk score bars, current status badges, capture identifiers, and existing horizontal-scroll table wrappers unchanged.

- [ ] **Step 4: Run the browser assertions**

Expected: both searches are present and return the table empty state for a non-matching query.

- [ ] **Step 5: Commit**

```bash
git add components/ui/recent-analysis-table.tsx components/ui/analysis-workspace.tsx
git commit -m "feat: unify analysis table controls"
```

### Task 4: Finish gate

**Files:**
- Modify only files required to correct observed defects.

- [ ] **Step 1: Run static verification**

```bash
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: all commands exit successfully.

- [ ] **Step 2: Run browser verification**

Verify desktop and narrow viewport History, Dashboard, and Analytics routes. Confirm toolbar alignment, popover does not clip, controls have visible focus, and horizontal table scrolling remains usable.

- [ ] **Step 3: Commit verification fixes**

```bash
git add <corrected-files>
git commit -m "fix: polish shared table toolbar"
```

## Self-review

- Spec coverage: Tasks 1–3 cover all specified table toolbars, local-only filtering, the date calendar, compact visual treatment, and disabled export; Task 4 covers responsive/accessibility verification.
- Placeholder scan: no design TODOs or undefined interfaces remain.
- Type consistency: `TableToolbarProps` is the shared interface; each consumer owns local filter state and accepts existing server-provided records.
