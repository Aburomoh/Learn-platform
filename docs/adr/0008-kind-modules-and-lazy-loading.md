# 0008 — One module per interaction kind, loaded on demand
Status: Accepted · Date: 2026-10-04 · Owner: Technical Lead

## Context
Completing ECET 111 (epic for Chapters 2–5) adds about seven interaction kinds: truth table,
expression entry, derivation, K-map, timing diagram, state table/diagram, row select. Today every
kind is wired by hand into shared files (`schema.ts`, `grade.ts`, `steps.ts`, `QuestionView.tsx`),
and every activity page ships every interaction component. Two problems follow:
- **Size.** The activity route is at about 164 kB gzip against a 200 kB budget (`docs/COST_RULES.md`).
  Seven more components would exceed it.
- **Collisions.** Thirteen sessions editing the same four files produce constant merge conflicts.

## Decision
1. **A kind is a folder:** `src/kinds/<kind>/` exporting one `KindModule`:
   `spec` (Zod schema), `grade`, `steps` (ADR-0007: stepCount, stepTag, stepVars), and lazy UI
   entry points `Practice`, `Explain`, optional `Context`. Its component, styles, tests and README
   live in the same folder.
2. **One registry:** `src/kinds/index.ts` maps `kind → KindModule`. `schema.ts`, `grade.ts`,
   `steps.ts` and `QuestionView.tsx` become thin dispatchers over the registry. Adding a kind adds a
   folder and **one line** in the registry; it does not edit the shared files.
3. **Lazy UI:** `Practice`/`Explain`/`Context` are `React.lazy` imports, so an activity downloads
   only the kinds it uses. Schema, grading and steps stay eager (small, needed for content checks).
   The pre-rendered first challenge (#158) must still be in the exported HTML.
4. **Order:** migrate the existing kinds first (no behaviour change, tests unchanged), then add
   new kinds. New kinds do not start before the registry lands.
5. **Budget:** first-load JS for any activity route stays under 200 kB gzip; the CI size report
   lists the shared stage chunk and each kind chunk.

## Consequences
Bundle grows per activity, not per course. Parallel work on different kinds stops colliding.
One more indirection when reading the stage code; the registry file is the map.

## Alternatives considered
Keep hand-wiring and raise the budget (cost rule violated, conflicts continue). One generic
data-driven interaction (ADR-0007 already rejected it as premature).
