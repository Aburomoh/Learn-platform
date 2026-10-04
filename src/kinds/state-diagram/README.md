# state-diagram

State diagrams (#239, ECET 111 Chapter 5 Part II; representations §7; pack ch5-partii). The
diagram is **pre-drawn, never free-drawn**:
- one circle per state, holding its bits;
- one arrow per state-table row (present state, then input as LSB);
- a self-loop when the state stays.

**One goal per arrow**, in table order. The mode decides what the student picks:
- `label` (default): the arrow's label from chips. That is input/output ("1/0") when there is an
  output, input only ("1") otherwise (`labelOptions`). Answer `label`.
- `next`: the state the arrow goes to (`nextOptions`). With up to four states the chips are every
  state. With eight there are four chips: the right state, the other input's next state, the
  present state and one more, in code order. Answer `next`.

- Spec:
  - `stateVars`: first = MSB of the code;
  - `input`: x;
  - `next`: the state equations, A(t+1) = …;
  - `output`: optional, `{ name, expr }`;
  - `mode`.
- Truth comes from the equations through the Boolean module (`transitions`), never authored.
  The deck's D, JK and three-JK examples reproduce exactly.
- Detectors:
  - next mode: `next-wrong-row` (the other input's row), `next-is-present`;
  - label mode: `output-wrong-row`, `label-input-wrong`, `label-reversed` (y/x).
- Step vars: `from`, `to`, `input`, `output`, `label`, `inputName`, `outputName`, `arrowCount`,
  `stepNumber`.

## View (`ui.tsx`, `StateDiagram.tsx`; representations §7 and §13.3)

- **Layout:** computed by the view (`statePositions`): two states side by side, four as 2 × 2,
  eight as two rows of four, in table order. Circles are 30 units with 16-unit mono codes; the SVG
  never renders below 0.75× (12 px text, 45 px circles) and scrolls inside its well beyond that.
- **Arrows** (`arrowGeometry`): a curve bent to its right-hand side, so the two directions between
  a pair never overlap; a loop above the circle (below it for the bottom row); transitions that
  share an arrow stack their labels. An arrow that skips a neighbour bends more to clear it.
- **Label mode:** every arrow is drawn. Active = accent, 3.5 units, with a haloed "?/?" slot;
  done = solid with its label; later = dashed and dim. The label is picked from chips (a
  `radiogroup`), then **Check arrow**.
- **Next mode:** only answered arrows are drawn. The source circle has the halo; the destination
  is picked on the circles (one `radiogroup`: arrows move, Space/Enter picks; the pick gets an
  accent ring), then **Check arrow**.
- **State table** beside the diagram (below it on phones), read-only; its rows are focus targets
  `row-<n>` for hint rung 5.
- **Screen reader:** `role="img"` with the arrows done so far (a `<title>` in next mode, where the
  circles are the controls).
- **Focus targets:** `state-diagram`, `state-<code>`, `label-<option>`, `row-<n>`.
- **Explain Slowly stage:** `revealed` = arrows shown done.

**Status:** spec, grading, tests and the view; registered.
