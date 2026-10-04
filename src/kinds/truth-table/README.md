# truth-table

Truth tables for Chapters 2–5 (#217). Inputs on the left in ascending binary order, then the
columns in order, as on the slides (UX: docs/design/ecet111-representations.md §2).

- **fill** (default): one goal per column the student writes, left to right. With `fillInputs`
  the input columns come first. Answer `{ step, values }`, one cell per row (0, 1 or X).
- **row-select**: one goal, pick the rows where `target` is 1. Answer `{ step: 0, rows }`.
- Truth is computed from each column's `expr` with the Boolean module; `values` (with X) is for
  columns an expression cannot state, such as excitation tables. `given` columns are shown filled;
  `group` gives state tables their two-level header; `mintermColumn` places m0…m15.
- After a wrong check, `wrongCells` gives the first wrong row and the count; mark only that one.
- Detectors: `and-or-swapped`, `not-missing` (column of the expression without its complements),
  `rows-out-of-order` (another input's column written), `rows-inverted` (0-rows picked).
- Step vars: `columnLabel`, `columnExpr`, `stepNumber`, `columnCount`, `rowCount`, `inputCount`.

**Status:** spec, grading, step contract and tests. The view (`ui.tsx`) and the three registry
lines come from Frontend; until then the kind is not registered and content cannot use it.
