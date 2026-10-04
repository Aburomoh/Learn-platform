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
- Detectors: `wrong-edge` (inputs read at the other kind of edge just before), `input-after-edge`
  (inputs read in the column after the edge), `jk-toggle-missed`, `t-as-d` (Q equals T),
  `inputs-swapped`, `held-not-applied`, `changed-on-hold`. The most specific one that
  explains the answer wins.
- Step vars: `edgeNumber`, `edgeCount`, `edgeName`, `flipFlop`, `outputList`, `inputsAtEdge`,
  `stateBefore`, `stateAfter`, `stepNumber`. Per #255 the goal names the edge only: inputs are for
  hint rung 5, outputs for rung 9.

**Status:** spec, grading and tests. The view, and registration with it (ADR-0008), are next
(Frontend).
