# ColumnAddition

Binary addition written the school way and done one column at a time, right to left. Operand
rows, a line and the sum row follow the ECET 111 Chapter 1 example; the carry row above is a
scaffold we add (the slide does not draw it).

```tsx
<ColumnAddition key={step} id="q" a="1101" b="0111" columns={columns} stepIndex={step}
  onStep={(sum, carry) => submit({ kind: "column-addition", step, sum, carry })}
  state={lastWrong ? "incorrect" : "idle"} />
<ColumnAddition id="q" a={a} b={b} columns={columns} stepIndex={columns.length} />   // completed
<ColumnAddition id="q" a={a} b={b} columns={columns} stepIndex={2} attention={2} />  // explanation
```

- `columns` is every step from the step contract (`src/content/steps.ts`): rightmost column first,
  the final carry step last. The component never grades.
- Active column: the student types the sum bit under the line and the carry above the next column,
  then "Check step" or Enter. Tab order: sum, carry, Check. The sum accepts 0–3 (so "wrote 2" can
  be recognised), the carry 0 or 1.
- Final step: only the bit to bring down, in the extra leftmost column.
- No final step in `columns` (the end carry is dropped, e.g. the +1 of a 2's complement): the grid
  is exactly as wide as the operands; the leftmost column's carry out is typed above the "+" sign
  and then shown struck through as dropped (`add-carry-dropped`).
- Completed columns keep their sum bit and the carry that went into the next column; columns not
  reached yet show only the given operand bits.
- Remount (change `key`) when `stepIndex` advances; focus then moves to the new sum input (not
  on the first step).
- Without `onStep` it is read-only (`?` at the active sum); `attention` outlines a column.
- Focus targets: `add-sum` / `add-carry` (inputs), `add-sum-<step>`, `add-carry-<step>` (carry
  written above step `<step>`), `add-result`.
- Cells are 44 px (28 px below 480 px). 4-bit additions fit a 320 px phone; wider ones scroll
  inside their own box with a faded edge and the active column in view.
