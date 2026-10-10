# Kinds

One folder per interaction kind (ADR-0008). The shared files (`src/content/schema.ts`, `grade.ts`,
`steps.ts`, `src/stage/QuestionView.tsx`) only dispatch to this registry.

## A kind folder

| File | Holds | Loaded |
|---|---|---|
| `spec.ts` | Zod spec and its misconception detectors | build time only (content parsing) |
| `logic.ts` | `grade`, the ADR-0007 step contract (`steps`), the answer type, pure helpers | always (small, no Zod) |
| `ui.tsx` | `Practice`, `Explain`, `Preload`; the marker `Practice.displayName = "kind:<id>"` | on demand |
| the rest | the kind's component, styles, tests, README | with `ui.tsx` |

## Adding a kind

1. Create `src/kinds/<kind>/` with the files above.
2. Add one line to each registry: `index.ts` (logic and answer type), `specs.ts` (spec and
   detectors), `ui.ts` (the three `dynamic(() => import("./<kind>/ui")…)` lines).
3. Add the kind to the list in `kinds.test.ts`.

Nothing else is edited: the schema, grader, step helpers and stage pick the kind up from the registries.

## Rules

- A kind imports shared helpers (`src/interactions/*` components by file, `src/kinds/shared`,
  `src/content/template`, `binary`, `notation`), never another kind.
- Browser code never imports the `@/interactions` barrel (lint rule): it would put every
  component in one chunk.
- `logic.ts` imports types only from `spec.ts` (`import type`), so Zod stays out of the browser.
- Views never grade: they call `onSubmit` with the kind's answer.
- In `ui.ts` every `import()` is written inside its `dynamic()` call. The build reads it there to
  pre-render the view and preload its chunk, which keeps challenge 1 in the exported HTML (#158).
- Other chunks are fetched ahead of use by `KindPrefetch`, which the runner mounts when the browser is idle.

## Kinds

`bit-grouping`, `circuit-predict`, `column-addition`, `cpu-schedule` (CPET181 Ch4), `memory-map` (CPET181 Ch2), `multiple-choice`, `numeric` (with its
contexts, including the bit row), `place-value`, `repeated-division`.

`shared/` holds what several kinds use: `Prompt`, the built-in `Calculator` (#579: pre-loaded expression, press =, never fills an answer), the worked contexts above a numeric or
multiple-choice question (`ContextView`, `BitGroups`, `contextSpec.ts`), and their text styles.
`shared/figures/` is the figure layer (ADR-0009): the drawings several kinds and the stage use
(`DeviceFigure`, `LatchFigure`), their one style sheet, `figureSpec.ts` (the `figure` field of a
variant) and `FigureView`, which the stage draws above or beside any kind's question.
Arithmetic helpers (`divisionSteps`, `groupBits`, `additionSteps`…) live in `src/content/binary.ts`
because content tests use them too.

## Detectors

A kind's misconception detectors are exported from its `spec.ts` and listed in `specs.ts`.
`equals` is the only detector every kind may use. `kinds.test.ts` fails if a variant uses another
kind's detector, which would validate and then never fire.
