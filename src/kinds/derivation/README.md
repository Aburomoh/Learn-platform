# derivation

A Boolean derivation, one law per line (#221). From `start`, each line is two goals (ADR-0007):
name the law (chips from `lawOptions`), then give the line.

- `lineMode: choose` (default): the right line and `wrongLines` as options (`lineOptions` rotates
  them); a wrong line may carry its own `misconceptionId`.
- `lineMode: type`: graded by structure (`canonical`): term and factor order and nesting do not
  matter, a different expression does. Typed but not equivalent to the line before →
  `line-not-equivalent`; equivalent but jumping to a later line → `line-skipped`.
- `LAW_NAMES` gives the chip wording, from the Chapter 2 rule set.
- Content tests must check each line is equivalent to the one before (the Boolean module does it).
- Step vars: `lineNumber`, `lineCount`, `previous`, `lawName`, `stepNumber`.

**Status:** spec, grading, step contract and tests. The view (UX §4: numbered lines, law chips,
dashed slot for the next line) and the three registry lines come from Frontend.
