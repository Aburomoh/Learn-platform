# BitRow

A binary number in aligned cells with one answer cell under each bit, as the Chapter 1 slides draw
a bit-by-bit operation (1's complement). Rendered for a `numeric` question whose context is
`bit-row` (#35). The whole row is one answer (Pedagogy, #35): fill every cell, check once.

```tsx
<BitRow id="q" bits="100101" state={state} wrongBit={last?.result.wrongBit}
  onAnswer={(text) => submit({ kind: "numeric", text })} />
<BitRow id="q" bits="100101" answer="011010" revealed={2} attention={2} />   // explanation
<BitRow id="q" bits="100101" sourceOnly />                                   // context above another question
```

- Source and answer cells share one grid, so they line up at every width (2–8 bits; cells shrink
  from 44 px to 24 px, 8 bits fit a 320 px phone with no page overflow).
- Typing a 0 or 1 moves to the next cell; ArrowLeft / ArrowRight move between cells; Backspace in
  an empty cell clears the one before it. Enter or "Check" submits once every cell is filled.
- After a wrong check, `wrongBit` (from the `first-wrong-bit` detector) marks that one cell with
  `aria-invalid`, an error border and focus; the other cells keep what was typed.
- Each input is labelled "Bit 3 of 6, under 0". The component never grades.
- Read-only with `answer` (+ `revealed` cells from the left, `?` for the rest); `attention`
  outlines a column.
- Focus targets: `bit-row`, `bit-source-<i>`, `bit-cell-<i>` (0-based from the left).
