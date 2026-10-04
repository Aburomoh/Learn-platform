# truth-table

Truth tables for Chapters 2–5 (#217). Inputs on the left in ascending binary order, then the
columns in order, as on the slides (UX: docs/design/ecet111-representations.md §2).

- **fill** (default): one goal per column the student writes, left to right. With `fillInputs`
  the input columns come first. Answer `{ step, values }`, one cell per row (0, 1 or X).
- **row-select**: one goal, pick the rows where `target` is 1. Answer `{ step: 0, rows }`.
- **mux-pairs** (#308, function with a MUX): the last input is the data variable v; rows 2p and
  2p + 1 share the select bits p. One goal per pair: what data input Ip gets, from `target` (F):
  0 0 → 0, 1 1 → 1, 0 1 → v, 1 0 → v′. Answer `{ step, choice: "0" | "1" | "v" | "v'" }`.
  `muxPairs` lists the pairs for the view.
- Truth is computed from each column's `expr` with the Boolean module; `values` (with X) is for
  columns an expression cannot state, such as excitation tables. `given` columns are shown filled;
  `group` gives state tables their two-level header; `inputGroups` (label and span, left to
  right) does the same over the input columns, e.g. "Present state" over A B and "Input" over x
  (#440); `mintermColumn` places m0…m15.
- After a wrong check, `wrongCells` gives the first wrong row and the count; mark only that one.
- Detectors: `and-or-swapped`, `not-missing` (column of the expression without its complements),
  `rows-out-of-order` (another input's column written), `rows-inverted` (0-rows picked);
  mux-pairs: `pair-complement-swapped` (v for v′), `pair-constant-for-variable` (0/1 where v
  applies), `pair-variable-for-constant`.
- Step vars: `columnLabel`, `columnExpr`, `stepNumber`, `columnCount`, `rowCount`, `inputCount`;
  mux-pairs: `pairNumber`, `pairCount`, `inputName` (I3), `dataVar`, `selectBits`, `pairValues`
  (F on the pair, "0 1"), `pairChoice`.

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

### Mux-pairs view (#308)

The table is given. A last column "MUX input" has one cell per pair of rows (`pairs` prop of
`TruthTable`): done pairs show their input, the active pair shows "?" and its rows carry the halo.
The answer is four chips (0, 1, v, v′ named by the data variable) in one `radiogroup`, then
Check input. Focus targets: `pair-<n>`. Explain Slowly stage: `pairs` = pairs shown done.
