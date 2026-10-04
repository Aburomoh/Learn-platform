# Content pack — ECET 111 Chapter 5 Part I: Latches and flip-flops (#285)

Source: Ch.5 Part I deck (pptx, 38 slides; Tier-1, not in the repo). References are slides
(`Ch5-I s.N`). Restated, never quoted. Characteristic equations were checked against their tables
with `src/content/boolean/` (`mintermsOf`, `equivalent`, `minimalSOP`); latch tables by gate-level
simulation; every timing diagram was decoded from the slide's drawing data (waveforms are drawn as
table borders) and Q simulated edge by edge. Rows match the Ch.5 Part I rows of
`docs/COVERAGE_ECET111.md`. Notation: this pack writes `'` for complement (see conventions).

## Deck-wide conventions
| Item | As taught |
|---|---|
| Previous state | **Q0** (subscript zero) in the SR and JK tables: output level before the active edge (s.13, s.16) |
| Next state | **Q(t + 1)**; present state Q or Q(t) (s.26, s.30, s.35) |
| Complement | Prime in equations (JQ′ + K′Q, Q′(t)); overbar on symbols and in the JK table (Q̄0) |
| Clock names | En on the gated latch (s.11–13); CLK on symbols and tables; Clk on the timing exercises |
| Edge marks | ↑ positive edge, ↓ negative edge in the CLK column; symbol: triangle = edge-triggered, bubble + triangle = negative edge (s.23, s.31) |
| Edge colours | Positive-edge slides: red label, red circles on active edges; negative-edge: green |
| Table column order | Inputs (S R / J K / D / T), then CLK, then a shaded separator, then Q |
| Timing exercise layout | Rows: inputs, Clk, Q, Q′; dotted grid, one column per half clock period; Q, Q′ rows blank |
| Context slides | s.1–3 title/contents; s.38 end |

## 1. Sequential model, intro — s.4–7 — CONTEXT
Sequential circuit = combinational circuit + storage elements in a feedback path; specified by a
time sequence of inputs, outputs and internal states (s.4). s.5: general system = combinational
gates + memory elements. s.6–7: the flip-flop is the main memory element, built from gates; block
diagram combinational circuit → flip-flops (clock pulses) → feedback (textbook p.192).

## 2. NAND SR latch, gated SR — s.8–13 — CORE (outputs); internals CONTEXT
NAND latch (s.8–9), inputs SET, RESET (active low), table columns **Set, Reset | Output**, slide row order:

| Set | Reset | Output | Verified |
|---|---|---|---|
| 1 | 1 | No change | holds Q = 0 or 1 ✓ |
| 0 | 1 | Q = 1 | ✓ |
| 1 | 0 | Q = 0 | ✓ |
| 0 | 0 | Invalid (gives Q = Q̄ = 1) | ✓ |

s.8 annotates the circuit with SET = 1, RESET = 1, Q = 1, Q̄ = 0 (a held state) ✓.
s.10: same NAND pair, inputs labelled S, R. s.11: two front NAND gates (inputs S·En, R·En, boxed)
feed the latch. s.12–13: gated SR circuit with S, En, R and Q, Q′; s.13 adds the SR table below
(section 3). Verified by simulation: En = 0 holds; En = 1: SR 00 hold, 10 → Q = 1, 01 → Q = 0,
11 → Q = Q′ = 1 ✓. s.13 table shows CLK ↑ beside the En circuit — see owner note.

## 3. Clock edges; SR, JK, D, T tables and equations — s.14–37 — CORE
s.14–15: clock 0 → 1 = **positive edge**, 1 → 0 = **negative edge**; s.15 two clock waveforms
(narrow pulses; square wave with period T) with both edges marked.

| Slides | Type, edge | Columns (slide row order) → Q | Equation | Verified |
|---|---|---|---|---|
| s.13, s.16 | SR, ↑ | S R CLK: 00 → Q0 (no change); 10 → 1; 01 → 0; 11 → Ambiguous. Notes: Q0 = level before ↑; ↓ changes nothing | none in Part I | — |
| s.23 | SR, ↓ | same rows with ↓; symbol with clock bubble ("triggers on negative edge") | none | — |
| s.26 | JK, ↑ | J K CLK: 00 → Q0 (no change); 10 → 1; 01 → 0; 11 → Q̄0 (toggles) | **Q(t + 1) = JQ′ + K′Q** | table = Σ(1,4,5,6) over J,K,Q; equation equal, already minimal ✓ |
| s.30, s.32 | D, ↑ | D CLK: 0 → 0; 1 → 1 | **Q(t + 1) = D** | ✓ |
| s.31 | D symbols | (a) positive-edge, (a) negative-edge (bubble at Clk); output bubble = Q′ | — | see owner note |
| s.35 | T (triangle symbol) | T → Q(t + 1): 0 → Q(t) No change; 1 → Q′(t) Complement | **Q(t + 1) = T ⊕ Q = TQ′ + T′Q** | table = Σ(1,2) over T,Q; both forms equal ✓ |

No SR characteristic equation and no JK ↓ table are shown in Part I.

## 4. Timing diagrams — s.17–37 — WORKED / PRACTICE
Method (s.18–19, s.22): circle every active edge on Clk; at each one read the inputs just before
the edge, apply the table, hold Q until the next active edge; inactive edges change nothing.

### Worked (answers on the slide)
| Slides | Type, edge | Initial Q | Inputs at active edges | Q after each edge | Verified |
|---|---|---|---|---|---|
| s.17–20 | SR, ↑ (edges a, c, e, g, i; b, d, f, h, j inactive) | 0 | SR: 00, 10, 01, 10, 10 | 0, 1, 0, 1, 1 (labels No change, Set, Reset, Set, Set) | = slide ✓ |
| s.32–33 | D, ↑ (edges a–g) | 1 | D: 0, 1, 0, 1, 1, 0, 0 | 0, 1, 0, 1, 1, 0, 0 | = slide ✓ |

### Exercises (Q, Q′ rows blank; no slide answer)
Grid: 34 half-period columns; Clk low in odd columns, high in even ones (17 periods). Positive edge
k starts column 2k (k = 1…17); negative edge k starts column 2k + 1 (k = 1…16). Inputs below are
the level per column, 1…34. Q′ is the complement of Q. Initial Q is not given on any exercise —
see owner note; both starts are listed where they differ.

| Slides | Type, edge | Input levels per column | Circled edges |
|---|---|---|---|
| s.21–22 | SR, ↑ | S: cols 3–8, 17–26 high; R: 11–14, 29–34 high | 1–16 of 17 |
| s.24–25 | SR, ↓ | S: 4–9, 16–25; R: 12–13, 28–34 | 1–13 of 16 |
| s.27 | JK, ↑ (no circles) | J: 3–8, 17–26, 29–34; K: 11–14, 29–34 | — see owner note |
| s.29 | JK, ↑ | J: 3–8, 17–26; K: 11–14, 29–34 | 1–16 of 17 |
| s.28 | JK, ↓ | J: 3–8, 17–26; K: 11–14, 29–34 | 1–13 of 16; see owner note |
| s.34 | D, ↓ | D: 4–9, 16–25 | 1–13 of 16 |
| s.36 | T, ↓ | T: 4–9, 16–25 | 1–13 of 16 |
| s.37 | T, ↑ | T: 4–10, 17–26 | 1–13 of 17; see owner note |

Inputs at each active edge and resulting Q (machine-worked; edges numbered left to right):

| Slides | Inputs per edge | Q from Q = 0 | Q from Q = 1 |
|---|---|---|---|
| s.21–22 SR ↑ | SR: 00 10 10 10 00 01 01 00 10 10 10 10 10 00 01 01 01 | 0 1 1 1 1 0 0 0 1 1 1 1 1 1 0 0 0 | 1, then same as Q = 0 |
| s.24–25 SR ↓ | SR: 00 10 10 10 00 01 00 10 10 10 10 10 00 01 01 01 | 0 1 1 1 1 0 0 1 1 1 1 1 1 0 0 0 | 1, then same |
| s.27 JK ↑ | JK: 00 10 10 10 00 01 01 00 10 10 10 10 10 00 11 11 11 | 0 1 1 1 1 0 0 0 1 1 1 1 1 1 0 1 0 | 1, then same |
| s.29 JK ↑ | JK: 00 10 10 10 00 01 01 00 10 10 10 10 10 00 01 01 01 | 0 1 1 1 1 0 0 0 1 1 1 1 1 1 0 0 0 | 1, then same |
| s.28 JK ↓ (values before the edge) | JK: 00 10 10 10 00 01 01 00 10 10 10 10 10 00 01 01 | 0 1 1 1 1 0 0 0 1 1 1 1 1 1 0 0 | 1, then same |
| s.34 D ↓ | D: 0 1 1 1 0 0 0 1 1 1 1 1 0 0 0 0 | 0 1 1 1 0 0 0 1 1 1 1 1 0 0 0 0 | same |
| s.36 T ↓ | T: 0 1 1 1 0 0 0 1 1 1 1 1 0 0 0 0 | 0 1 0 1 1 1 1 0 1 0 1 0 0 0 0 0 | 1 0 1 0 0 0 0 1 0 1 0 1 1 1 1 1 |
| s.37 T ↑ (values before the edge) | T: 0 0 1 1 1 0 0 0 1 1 1 1 1 0 0 0 0 | 0 0 1 0 1 1 1 1 0 1 0 1 0 0 0 0 0 | 1 1 0 1 0 0 0 0 1 0 1 0 1 1 1 1 1 |

No exercise has S = R = 1 at an active edge.

## Terminology variants
"Latch" (s.8) and "Clocked SR flip-flop" for the gated circuit (s.10–13); "SET/RESET" and "S/R";
"Positive Edge clock" / "Negative Edge clock" (s.14) and "positive-edge" / "negative-edge" (s.31);
"Ambiguous" (edge tables) vs "Invalid" (latch table); "toggles" (JK) vs "Complement" (T);
"No change" with Q0 or Q(t).
