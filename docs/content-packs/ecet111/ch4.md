# Content pack — ECET 111 Chapter 4: Combinational logic circuits (#275)

Source: Ch.4 deck (pptx, 62 slides; Tier-1, not in the repo). References are slides (`Ch4 s.N`).
Restated, never quoted. Every truth table, Σ list, simplified form and mux input assignment below
was re-computed with `src/content/boolean/` (`mintermsOf`, `minimalCovers`, `equivalent`; mux
inputs by evaluating each selector pair and rebuilding the Σ). Rows match the Ch.4 rows of
`docs/COVERAGE_ECET111.md`. Notation: this pack writes `'` for complement (see conventions).

## Deck-wide conventions
| Item | As taught |
|---|---|
| Truth-table columns | Inputs left, outputs right, inputs counted in binary from 00…0; first input is the MSB |
| Block symbols | Inputs enter on the left, outputs leave on the right; adders are a box with Σ (s.3, s.9) |
| Carry names | Half adder: S, C. Full adder: inputs A, B, Ci (input carry), outputs S, Co (output carry) |
| m column | Decoder table (s.28) and 4-variable mux table (s.53–55) carry a row label m0…m7 / 0…15 |
| K-map | Same 3-variable map as Ch.3: rows A, columns BCi in Gray order 00, 01, 11, 10; brackets B over 11, 10, Ci under 01, 11, A beside row 1 (s.13–22) |
| Complement | Overbar on the full-adder and 3-variable mux slides; prime (z′, D′) on s.49, s.51, s.55–61 |
| Mux select bits | S1 is the MSB: S1 S0 = 00 → I0 … 11 → I3; first function variable goes to the highest S |
| Mux drawing | Trapezoid (narrow side to the output) or rectangle; selects enter from below or as extra left inputs (s.46) |
| Context slides | s.1–2 title/contents; s.24, s.41 title only; s.62 end |

## 1. Half adder — s.3–8 — CORE
Symbol (s.3): A, B in; S, C out. Table columns **A, B, S, C** (s.4), filled in s.5.

| A | B | S | C |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

s.7: S read as an XOR gate, C as an AND gate (gates drawn beside the table). s.8: equations
**S = A ⊕ B** (XOR), **C = A·B** (AND), and the logic diagram with A, B shared by both gates.
Verified: S = Σ(1,2), C = Σ(3), each row = binary sum of A + B ✓.

## 2. Full adder — s.9–22, 33–36 — CORE (S algebra: WORKED)
Symbol (s.9): A, B, Ci in; S, Co out. Table columns **A, B, Ci, S, Co** (s.10), filled in s.11.

| A B Ci | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| S | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 1 |
| Co | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 1 |

Four activities, each verified:

| Slides | Activity | Result | Verified |
|---|---|---|---|
| s.13–14 | Co as Σ, copied into the map | Co(A, B, Ci) = Σ(3, 5, 6, 7) | ✓ see owner note (s.13) |
| s.15 | Co groups, in box order: m6,m7 → AB; m3,m7 → BCi; m5,m7 → ACi | **Co = AB + BCi + ACi** | unique minimal cover ✓ |
| s.16 | S as Σ, copied into the map | S(A, B, Ci) = Σ(1, 2, 4, 7) | ✓ |
| s.17–22 | S: no two ones adjacent, four single cells; boxes in order m4 → AB′Ci′, m1 → A′B′Ci, m7 → ABCi, m2 → A′BCi′ | S = sum of the four minterms | unique minimal cover (4 terms, 12 literals) ✓ |

S by algebra (s.22), each line equivalent to Σ(1, 2, 4, 7):

| Line | Step (implicit on slide) |
|---|---|
| AB′Ci′ + A′B′Ci + ABCi + A′BCi′ | the four boxes |
| A′(B′Ci + BCi′) + A(BCi + B′Ci′) | factor A′ and A |
| A′(Ci ⊕ B) + A(Ci ⊕ B)′ | XOR and its complement (XNOR) |
| **A ⊕ B ⊕ Ci** | XOR of A with (Ci ⊕ B) |

s.33–36 repeat the symbol and table as the lead-in to §4.

## 3. Decoder, encoder — s.23–32 — CORE
| Slides | Content | Verified |
|---|---|---|
| s.23–27 | Decoder: N inputs, M outputs, M ≤ 2^N; for each input combination exactly one output is active. Blocks 1-to-2, 2-to-4, 3-to-8 DEC built up one per slide | — |
| s.28 | 3-to-8 table: label column m0…m7, inputs **x, y, z** (x MSB), outputs **D0…D7**; row mk has Dk = 1, all others 0 | Dk = minterm k (D0 = x′y′z′ … D7 = xyz) ✓ |
| s.29–31 | Encoder: M inputs, N outputs, M ≤ 2^N; the one active input is represented by the output code. Blocks 2-to-1, 4-to-2, 8-to-3 | — |
| s.32 | 8-to-3 table: inputs **I0…I7** (one 1 per row), outputs **x, y, z**; input Ik → xyz = binary of k. Block drawn with outputs listed z, y, x top to bottom | x = I4+I5+I6+I7, y = I2+I3+I6+I7, z = I1+I3+I5+I7 ✓ |

Prediction facts (all ✓): decoder input xyz = 101 → only D5 = 1; encoder input I6 = 1 → xyz = 110.

## 4. Functions with a decoder — s.37 — CORE
Method: a 3-to-8 decoder with inputs A, B, Ci (top to bottom; A is the MSB as in the Σ) produces every minterm; each function
is one OR gate fed by the decoder outputs listed in its Σ. D0 stays unconnected; D7 feeds both ORs.

| Function | Σ | OR inputs | Verified |
|---|---|---|---|
| S(A, B, Ci) | (1, 2, 4, 7) | D1, D2, D4, D7 | = full-adder S ✓ |
| Co(A, B, Ci) | (3, 5, 6, 7) | D3, D5, D6, D7 | = full-adder Co ✓ |

## 5. Multiplexer — s.38–46 — CORE
| Slides | Content | Verified |
|---|---|---|
| s.38–39 | Mux: many inputs, one output; the select state connects one input to the output. 2-to-1: I0, I1, select S0; S0 = 0 shows I0 routed to Y | — |
| s.40 | 4-to-1: inputs I0…I3, selects **S1, S0**, output Y. Select table columns **S1, S0, Y**: 00 → I0, 01 → I1, 10 → I2, 11 → I3 | Y = S1′S0′I0 + S1′S0I1 + S1S0′I2 + S1S0I3 ✓ |
| s.42–45 | One select row per slide: the bits are written at the select pins, the routed input and the row are highlighted (00 → I0, 01 → I1, 10 → I2, 11 → I3) | ✓ see owner note (s.42) |
| s.46 | Three equivalent mux shapes (trapezoid, rectangle with selects below, rectangle with S1, S0 as extra left inputs) | — |

## 6. Functions with a MUX — s.47–61 — CORE / PRACTICE
Method (s.47, s.49, s.52): n variables → n−1 of them on the selects (mux 2^(n−1)-to-1), the first
variable on the highest select; the remaining variable, its complement, 0 or 1 on each data input,
read from the function table. The table is split into **pairs of rows** that share the select bits
(boxes around the last-variable column and F); per pair: F = 0,0 → 0; 1,1 → 1; F equals the
variable → v; F is its complement → v′. The pair's value goes to the input numbered by the
select bits.

| Slides | Function | Selects (MSB first) | Data input | I0 … I(last) | Verified |
|---|---|---|---|---|---|
| s.48–51 | F(x,y,z) = Σ(1,2,6,7), 4-to-1 | x → S1, y → S0 | z | z, z′, 0, 1 | rebuild = Σ ✓ |
| s.52–55 | F(w,x,y,z) = Σ(1,2,5,11,13), 8-to-1; table with index column 0–15 | w → S2, x → S1, y → S0 | z | z, z′, z, 0, 0, z, z, 0 | rebuild = Σ ✓ see owner note (s.54) |
| s.56 | Same F; question only, no slide answer | x → S2, y → S1, z → S0 | w | 0, w′, w′, w, 0, 1, 0, 0 (machine-worked) | rebuild = Σ ✓ |
| s.57–61 | F(A,B,C,D) = Σ(1,3,4,11,12,13,14,15), textbook example (p.161), 8×1 mux | A → S2, B → S1, C → S0 | D | D, D, D′, 0, 0, D, 1, 1 | rebuild = Σ ✓ |

s.56 pairs: with w as the data input, each pair is minterm k and k + 8 (w = 0, w = 1), selects
xyz = binary of k. s.58/s.61 draw the inverter for D′ and tie inputs that share a value to one line;
s.57, s.59 show the question alone, s.60 the table alone.

## Terminology variants
"Multiplixers" (slide spelling) = multiplexer = MUX; "DEC"; "selection (S)" / "selectors";
"function table" for the mux truth table; "8 To 1 MUX" and "8 × 1 MUX" (textbook) for the same
size; Ci / Co written C with subscript i / o; zeros on the s.55 mux inputs drawn as a letter-like
"o"; mux data inputs labelled I0… on the slides, 0…7 on the textbook figure (s.58).
