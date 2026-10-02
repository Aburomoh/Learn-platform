# 0004 — Native drag and drop
Status: Accepted · Date: 2026-10-03 · Owner: Frontend / Interaction Engineer

## Context
M1 needs one drag-to-target interaction (bits into place-value slots) with mouse, touch,
keyboard and reduced-motion support. Dependency policy: justify every library.

## Decision
Implement `DragToTarget` with native Pointer Events (`setPointerCapture`), a select-then-place
keyboard path (Space/Enter grab, arrows/Tab move, Space/Enter place, Escape cancel) and a live
region for announcements. No drag library.

## Consequences
Roughly 200 lines we own; no bundle cost; full control over a11y. If a later activity needs
sortable lists or multi-container drag with collision detection, revisit `@dnd-kit` in a new ADR.

## Alternatives considered
`@dnd-kit/core` (good a11y, ~10 kB gz, but unused capability in M1). HTML5 DnD API (poor touch
and keyboard story).
