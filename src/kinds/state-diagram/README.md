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
- **Shared arrows:** when both rows of a state go to the same next state they share one arrow
  (`arrowSteps`; always consecutive steps). In label mode either of its labels is accepted while
  it is still open. The answer's `taken` lists the labels already given on that arrow.
- `positions` (optional): a [column, row] grid cell per state, in code order. `statePositions`
  falls back to table order, four per row.
- Detectors:
  - next mode: `next-wrong-row` (the other input's row), `next-is-present`;
  - label mode: `output-wrong-row`, `label-input-wrong`, `label-reversed` (y/x).
- Step vars: `from`, `to`, `input`, `output`, `label`, `inputName`, `outputName`, `arrowCount`,
  `stepNumber`.

**Status:** spec, grading and tests. The view, and registration with it (ADR-0008), are next
(Frontend).
