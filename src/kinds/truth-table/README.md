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

## View (`ui.tsx`, `TruthTable.tsx`)

- Inputs (given unless `fillInputs`), the optional `m` column, then the columns; the last is the
  output. 2 px rules after the inputs and before the output; alternate rows banded; `group`
  gives a header row with one soft band per group.
- Fill: the active column is one ARIA grid stop. Arrows / Home / End move; Space or Enter
  cycles empty → 0 → 1 (→ X when the column's truth has X); 0, 1, x type and move down.
  Done columns show values; later ones are dim and announced as "later".
- Row-select: a pick column (`aria-selected`), toggled by tap, Space or Enter; Check sends the rows.
- After a wrong Check only `wrongCells.first` is marked (✕, border, background) and focused;
  the student's entries stay. Cells are 36 × 44 px; a wide table scrolls inside its well with a
  fade edge.
- Explain Slowly stages: `step` (goal shown; omit for the finished table) and `revealed` (rows
  filled so far); row-select: `rows` (shown as picked).
