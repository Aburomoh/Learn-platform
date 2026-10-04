# Content pack — ECET 111 Chapter 5 Part III: Design of clocked sequential circuits (#287)

Source: Ch.5 Part III deck (pptx, 35 slides; Tier-1, not in the repo). References are slides
(`Ch5-III s.N`). Restated, never quoted. Every state table, excitation column, K-map (minterms,
don't-cares, **all** minimal covers via `minimalCovers`) and equation below was re-computed with
`src/content/boolean/`; each designed circuit was then simulated (flip-flop characteristic
equation applied to every used row, for every combination of minimal covers) and reproduces its
state table. Rows match the Ch.5 Part III rows of `docs/COVERAGE_ECET111.md`. Notation: this pack
writes `'` for complement and `X` for the input x_in.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Analysis vs design (s.4) | Analysis: given circuit or state equations, find state table / diagram (state table). Design: given state diagram or state table, find state equations / circuit (**excitation table**) |
| Counts (s.4) | states = 2^(flip-flops); rows = 2^(flip-flops + inputs) |
| Table column order | **Present state** (A, B[, C]) → **Input** (X_in) → **Next state** (A, B[, C]) → [**Output** Y_out] → **flip-flop inputs** (T_A, T_B… or J_A, K_A, J_B, K_B…) |
| Row order | Present state and input counted in binary from 0…0; A is the MSB, input last; m-index = bits A B (C) X |
| Excitation tables | Shown beside the design table. T: Q_t, Q_t+1, T = 00→0, 01→1, 10→1, 11→0. JK: 00→0 X, 01→1 X, 10→X 1, 11→X 0. D: none shown; next-state columns are mapped directly |
| Don't-care | Upper-case **X** in JK columns and for unused states; s.33 uses lower-case x in the next-state columns of unused rows |
| Unused states (s.28–33) | Both input rows of each unused state: next state, output and all flip-flop inputs = X |
| K-map (s.9) | 3-variable map, rows A (0, 1), columns B X_in in Gray order 00, 01, 11, 10; brackets B over 11, 10, X_in under 01, 11 (same map as Ch.3) |
| Equation names (s.9) | Written as "A = …", "B = …" (the D input / next state); complement as overbar |
| Context slides | s.1–3 title, contents, section; s.35 end |

## 1. Design: state table → excitation → K-maps → equations (D, T, JK) — s.4–27 — CORE
Specification, same for all three flip-flop types (s.5, s.11, s.15, s.26): two flip-flops A, B,
one input X. X = 0 → state holds; X = 1 → 00 → 01 → 11 → 10 → 00, repeating.

State table (s.6–8, repeated on every later slide):

| A B X | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| next A B | 00 | 01 | 01 | 11 | 10 | 00 | 11 | 10 |

Excitation columns, K-maps and equations (all ✓ against the slide tables; every cover unique):

| Type | Slides | Column (m0…m7) | Minterms | Don't-cares | Minimal cover | Source |
|---|---|---|---|---|---|---|
| D | s.9–10 | D_A = next A: 0 0 0 1 1 0 1 1 | 3, 4, 6, 7 | — | **BX + AX'** | slide: groups m3,m7 → BX, m4,m6 (wrap) → AX' ✓ |
| D | s.9–10 | D_B = next B: 0 1 1 1 0 0 1 0 | 1, 2, 3, 6 | — | **A'X + BX'** | slide: groups m1,m3 → A'X, m2,m6 → BX' ✓ |
| T | s.12–14, 27 | T_A: 0 0 0 1 0 1 0 0 | 3, 5 | — | **A'BX + AB'X** (= X(A ⊕ B)) | computed, not on the slides |
| T | s.12–14, 27 | T_B: 0 1 0 0 0 0 0 1 | 1, 7 | — | **A'B'X + ABX** (= X(A ⊕ B)') | computed, not on the slides |
| JK | s.16–25 | J_A: 0 0 0 1 X X X X | 3 | 4–7 | **BX** | computed, not on the slides |
| JK | s.16–25 | K_A: X X X X 0 1 0 0 | 5 | 0–3 | **B'X** | computed, not on the slides |
| JK | s.16–25 | J_B: 0 1 X X 0 0 X X | 1 | 2, 3, 6, 7 | **A'X** | computed, not on the slides |
| JK | s.16–25 | K_B: X X 0 0 X X 0 1 | 7 | 0, 1, 4, 5 | **AX** | computed, not on the slides |

Method notes: D design maps the next-state columns directly (s.9). T and JK add the flip-flop input
columns right of the next state, filled row by row from the excitation table (Q_t = present bit,
Q_t+1 = next bit); JK is filled one flip-flop at a time, A first (s.21), then B (s.23). s.26–27
repeat the T example with the header "Flip-flops Input".

## 2. Design problems (3 flip-flops) — s.28–34 — PRACTICE
Problem (s.28 D, s.30 JK, s.32 T): three positive-edge flip-flops A, B, C; input X; output Y; state
diagram given; unused states 101 and 111 are don't-cares. Tasks: (a) state table, (b) K-maps for
the flip-flop input equations, (c) circuit diagram, (d) timing diagram.

State diagram (s.28, arcs X/Y) and state table (s.29), identical and ✓:

| Present A B C | X = 0: next / Y | X = 1: next / Y |
|---|---|---|
| 000 | 000 / 1 | 010 / 1 |
| 001 | 001 / 1 | 100 / 1 |
| 010 | 011 / 1 | 100 / 1 |
| 011 | 001 / 0 | 110 / 0 |
| 100 | 000 / 0 | 011 / 1 |
| 110 | 110 / 1 | 001 / 0 |
| 101, 111 | X | X |

K-maps: 4 variables A B C X (m-index ABCX, 0…15), don't-cares **10, 11, 14, 15** in every map
(JK maps add the excitation X's). Map layout is not drawn on the slides.

| FF | Slides | Input | Minterms | Don't-cares (besides 10, 11, 14, 15) | All minimal covers | Source |
|---|---|---|---|---|---|---|
| D | s.29 | D_A | 3, 5, 7, 12 | — | ABX' + A'BX + CX | computed, not on the slides |
| D | s.29 | D_B | 1, 4, 7, 9, 12 | — | BCX + BC'X' + B'C'X | computed, not on the slides |
| D | s.29 | D_C | 2, 4, 6, 9, 13 | — | AX + A'BX' + CX' | computed, not on the slides |
| JK | s.31 | J_A | 3, 5, 7 | 8, 9, 12, 13 | BX + CX | column ✓ slide; cover computed |
| JK | s.31 | K_A | 8, 9, 13 | 0–7 | B' + X | column ✓ slide; cover computed |
| JK | s.31 | J_B | 1, 9 | 4–7, 12, 13 | C'X | computed, not on the slides (columns blank) |
| JK | s.31 | K_B | 5, 6, 13 | 0–3, 8, 9 | CX' + C'X | computed, not on the slides |
| JK | s.31 | J_C | 4, 9, 13 | 2, 3, 6, 7 | AX + A'BX' | computed, not on the slides |
| JK | s.31 | K_C | 3, 7 | all others except 2, 6 | X | computed, not on the slides |
| T | s.33 | T_A | 3, 5, 7, 8, 9, 13 | — | AB' + BX + CX | column ✓ slide; cover computed |
| T | s.33 | T_B | 1, 5, 6, 9, 13 | — | BCX' + C'X | column ✓ slide; cover computed |
| T | s.33 | T_C | 3, 4, 7, 9, 13 | — | AX + A'BC'X' + CX | column ✓ slide; cover computed |
| all | s.29 | Y | 0, 1, 2, 3, 4, 5, 9, 12 | — | **four**, 4 terms / 9 literals: A'B' + A'C' + BC'X' + B'X; ABX' + A'B' + A'C' + B'X; A'C' + BC'X' + B'C + B'X; ABX' + A'C' + B'C + B'X | computed, not on the slides |

Excitation columns (computed, ✓ where the slide fills them): J_B 0 1 0 0 X X X X 0 1 X X X X X X;
K_B X X X X 0 1 1 0 X X X X 0 1 X X; J_C 0 0 X X 1 0 X X 0 1 X X 0 1 X X;
K_C X X 0 1 X X 0 1 X X X X X X X X. Simulation: D, JK and T circuits each reproduce all 12 used
rows ✓.

Timing (s.34, part d): X sampled at the rising edges is 0, 1, 1, 1, 1, 0, 0, 0, 1 (then 1 at the
last edge). Start state not given — see owner note. From 000 (computed): states after each edge
000, 010, 100, 011, 110, 110, 110, 110, 001, (100); Y at each edge 1, 1, 1, 1, 0, 1, 1, 1, 0.
Y is a Mealy output (depends on X), so it also changes when X changes between edges.
s.34 diagram: see owner note.

## Terminology variants
"Design of clocked sequential circuits"; "Flip-flops Problems" (s.4); "Excitation Table" with
headings Q_t, Q_t+1; input written X_in / x_in, output Y_out; column groups "A Flip-flop",
"B Flip-flop", "Flip-flops Input", "JK FF Inputs", "T Flipflop"; "unused states as don't care
conditions".
