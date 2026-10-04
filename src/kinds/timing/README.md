# timing

Timing diagrams (#237, ECET 111 Chapter 5 Part I; representations §6; pack ch5-parti §4).
**One goal per active clock edge:** Q just after it. Answer `q` (0 / 1).

- Spec:
  - `flipFlop`: SR, JK, D or T, with its inputs in slide order;
  - `edge`: rising or falling;
  - `initialQ`: always stated;
  - `inputs`: one level per column;
  - `edgeCount`: optional, ask only the first n edges, as the slides circle 1–16 of 17.
- Columns are half clock periods, as on the exercise grids. Clk is low in the first column and
  alternates after that (`clockLevels`). Rising edges start the high columns, falling edges the
  later low ones. **Inputs are read in the column just before the edge.** S = R = 1 at an asked
  edge is refused (no defined next state).
- Truth comes from the characteristic equations through the Boolean module (`nextQ`): D, T ⊕ Q,
  JQ′ + K′Q, and S + R′Q.
- Helpers for the view:
  - `activeEdges`: column, plus levels before and after the edge;
  - `qAfterEdges`;
  - `qLevels`: Q per column, changing only at active edges.
- Detectors: `input-after-edge`, `jk-toggle-missed`, `t-as-d`, `inputs-swapped`,
  `held-not-applied`, `changed-on-hold`. The most specific one that explains the answer wins.
- Step vars: `edgeNumber`, `edgeCount`, `edgeName`, `flipFlop`, `inputsAtEdge` ("J = 1, K = 0"),
  `qBefore`, `qAfter`, `stepNumber`.

**Status:** spec, grading and tests. The view, and registration with it (ADR-0008), are next
(Frontend).
