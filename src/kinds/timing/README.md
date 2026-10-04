# timing

Timing diagrams (#237, ECET 111 Chapter 5; representations §6 and §13.2; packs ch5-parti §4 and
ch5-partii §5). **One goal per active clock edge:** every output just after it, asked together
with one Check. Answer `q`: one bit per output, in `outputNames` order.

- Two shapes:
  - **One flip-flop**: `flipFlop` (SR, JK, D or T, inputs in slide order) and `initialQ`. The
    output is Q.
  - **A circuit**: `machine` holds `stateVars` (A, B, C), `next` (state equations over the
    flip-flops and inputs) and `initial`. The outputs are the flip-flops (#316).
- Common fields: `edge` (rising or falling), `inputs` (one level per column), and optional
  `edgeCount` (ask only the first n edges, as the slides circle 1–16 of 17).
- Columns are half clock periods, as on the exercise grids. Clk is low in the first column and
  alternates after that (`clockLevels`). The inputs are read in the column just before the edge.
- The spec refuses:
  - an input that changes **on** an asked edge (§13.2), so the value to read is never ambiguous;
  - S = R = 1 at an asked edge.
- Truth comes from the characteristic equations (D, T ⊕ Q, JQ′ + K′Q, S + R′Q) or from the state
  equations, evaluated with the Boolean module. Helpers:
  - `nextQ`, `nextState`;
  - `activeEdges`, the inputs read at each edge;
  - `statesAfterEdges`;
  - `outputLevels`, each output per column for drawing.
- After a wrong check, `wrongCells` gives the first wrong output and how many are wrong.
- Detectors: `wrong-edge` (inputs read at the other kind of edge just before), `jk-toggle-missed`,
  `t-as-d`, `inputs-swapped`, `held-not-applied`, `changed-on-hold`. The most specific one that
  explains the answer wins.
- Step vars: `edgeNumber`, `edgeCount`, `edgeName`, `flipFlop`, `outputList`, `inputsAtEdge`,
  `stateBefore`, `stateAfter`, `stepNumber`. Per #255 the goal names the edge only: inputs are for
  hint rung 5, outputs for rung 9.

## View (`ui.tsx`, `TimingDiagram.tsx`; representations §6 and §13.2)

- **Layout:** inputs on top, Clk in the middle, outputs at the bottom. A column is half a period
  (32 units); rows are 28 with a 20 swing, 16 apart. The names column (italic bold, with each
  output's initial value) is outside the scrolling SVG, so it stays put.
- **Active edges:** a dotted guide through all rows, a triangle on the clock (up for rising, down
  for falling) and the edge number under the diagram. The edge being asked has the halo and a "?"
  on every output row.
- **Answering:** one 0/1 segmented control (48 px) per output, each a `radiogroup` named
  "Q after edge 3", then **Check edge** (Enter confirms). A right answer draws the outputs (3 px,
  `--signal-high`) up to the next active edge; a wrong one draws nothing and marks only the first
  wrong output (`wrongCells.first`).
- **Hint rung 5:** focus target `inputs-at-edge` (a dot and the value on each input row at the
  active edge) is hidden until the tutor highlights or focuses it.
- **Scrolling:** the diagram scrolls inside its well with a fade; the active edge is kept at least
  one period from the right edge.
- **Screen reader:** the SVG is `role="img"` with a summary (trigger edge, given signals, initial
  values, edges answered).
- **Focus targets:** `timing`, `inputs-at-edge`, `q-<output>-<bit>`.
- **Explain Slowly stage:** `revealed` = edges whose outputs are drawn (the next one has the halo).

**Status:** spec, grading, tests and the view; registered.
