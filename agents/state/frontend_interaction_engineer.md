# Current State — Frontend / Interaction Engineer

Current assignment: complete ECET 111 (epic #192). In review: #260 kind registry part 1 (ADR-0008; circuit-predict, place-value), #272 course-page chapters (#232).
Recent important decision: Kinds live in `src/kinds/<kind>/` (spec / logic / ui) with three registries (`index.ts` logic, `specs.ts` Zod at build time, `ui.ts` next/dynamic). The stage imports shared components by file, never the `@/interactions` barrel. The question view is keyed by `questionViewKey(variant, state)`.
Blocker: None
Relevant issue/PR: #196, #260, #232, #272; UX spec `docs/design/ecet111-representations.md`.
Wake me: `npm run alarm frontend-interaction-engineer <#> "<reason>" <your-role>` (label `wake:frontend`).
Next expected action: after #260 merges, part 2 as a new PR against main: migrate repeated-division, numeric (+contexts), multiple-choice, bit-grouping, column-addition, bit-row; remove fallbacks; lint rule against the barrel in src/stage; detector-ownership test (Backend's note). Then the truth-table kind.
