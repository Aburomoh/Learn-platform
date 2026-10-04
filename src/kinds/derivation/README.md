# derivation

A Boolean derivation, one law per line (#221). From `start`, each line is two goals (ADR-0007):
name the law (chips from `lawOptions`), then give the line.

- `lineMode: choose` (default): the right line and `wrongLines` as options (`lineOptions` rotates
  them); a wrong line may carry its own `misconceptionId`.
- `lineMode: type`: graded by structure (`canonical`): term and factor order and nesting do not
  matter, a different expression does. Typed but not equivalent to the line before →
  `line-not-equivalent`; equivalent but jumping to a later line → `line-skipped`.
- Typed line equivalent but neither this line nor a later one → `line-other`: valid algebra, just
  not the step this law gives here (many paths are valid).
- `LAW_NAMES` gives the chip wording, from the deck's own names: distributive covers both
  multiplying out and factoring; there is no consensus chip (the deck teaches it by expansion).
- **Authoring rule:** no distractor chip may also be a defensible name for that step.
- Content tests must check each line is equivalent to the one before (the Boolean module does it).
- Step vars: `lineNumber`, `lineCount`, `previous`, `lawName`, `stepNumber`.

## View (`ui.tsx`, `DerivationLines.tsx`)

- Numbered lines in mono with the law muted on the right (under the line on phones); line 1
  reads "Given". The line being worked on has the halo and an empty dashed "next line" slot with
  "Law: ?"; later lines show only "…".
- Goal 1 (law): the shared `MultipleChoice` with the line's law chips ("Check law"). Goal 2 (line):
  the line options (`lineOptions`) in choose mode, or a mono field in type mode ("Check line").
  The sub-expression a law applies to is not highlighted (hint rung 5, Pedagogy #245).
- Explain Slowly stages: `line` (1-based; omit for the whole derivation), `law` (show its law),
  `shown` (show the line too).
- Type mode uses a plain field for now; the expression kind's key row and overbar reading move to
  `kinds/shared` once both kinds have landed.

**Status:** spec, grading, tests and the view (UX §4); registered.
