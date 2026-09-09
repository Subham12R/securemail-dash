# Shared Table Toolbar Design

## Objective

Apply the supplied email-history reference to SecureMail tables without inventing backend filtering or duplicating toolbar markup.

## Scope

- **History:** searchable/filterable table shell with a compact toolbar: search, date range, verdict, source, and export control.
- **Recent analysis:** compact toolbar with search, date range, and status filters.
- **Analytics results:** compact toolbar with search and processing-status filter.
- All tables retain semantic `table` markup, their current columns, horizontal scrolling, and empty states.

## Shared ownership

A client `TableToolbar` component owns local query/filter state and the visual control layout. A native search input filters the records already rendered in the browser. Date selection uses the existing React Aria range calendar; status/source choices use native selects. The toolbar does not claim filters have changed API results.

The server pages remain responsible for fetching their existing records. History pagination remains server-owned; client filters apply only to the current page. Export is explicitly disabled until an export contract exists.

## Visual contract

- Controls follow the reference: equal-height rounded fields, subdued zinc border/background, compact labels, and a right-aligned export icon.
- Tables use a lightly tinted header, 1px row dividers, hover feedback, compact status pills, and a final overflow/menu column only where an action contract exists.
- The custom calendar shows quick ranges (Today, Yesterday, 3, 7, 15, and 30 days) beside a one-month selectable range, with keyboard navigation and dismissal inherited from React Aria.
- Avoid colored skeletons and decorative effects; verdict badges retain semantic color plus text.

## Acceptance checks

- History, recent analysis, and analytics results render the shared toolbar in their applicable controls.
- Searching or selecting a local filter visibly reduces only rendered records; clearing restores them.
- The date popover opens, keyboard navigation works, and selecting a complete range updates the control label.
- Tables remain readable at narrow widths through their existing horizontal scroll regions.
- No URL/API parameters, export behavior, or undeclared row actions are fabricated.

## Deferred

- Server-side search/filter/query parameters.
- Export endpoint and download generation.
- Cross-page filter persistence and saved views.
