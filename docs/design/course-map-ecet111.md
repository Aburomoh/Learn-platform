# ECET 111 course map, Chapters 1–5 (#115)

Planning only. Content work waits for the owner's M1.1 acceptance and the R1 order (#110).
Source: the owner's local decks (git-ignored; read, never committed or quoted). Examples below are
restated in our own notation; `'` = complement. Each activity is one walked procedure, every step
its own goal (PEDAGOGY.md, ADR-0007), with at least two variants (walk one, retry another).

Interaction codes: existing **E-** kinds, new **N-** kinds (see the last section).

## Chapter 1 — Digital systems and binary numbers (in progress: M1.1, M1.2)
| Topic | Activities | Interactions |
|---|---|---|
| Number-base conversions | decimal → binary (ladder), read-off, octal, hex; exercise 88/73 | E-repeated-division, E-numeric, E-bit-grouping |
| Binary arithmetic | addition; 1's and 2's complement; subtraction (positive, negative) | E-column-addition, E-numeric `bit-row`, E-multiple-choice |

## Chapter 2 — Boolean algebra and logic gates (replaces the demo "Logic gates" topic)
| Topic | Activities (walked procedure) | Interactions |
|---|---|---|
| Basic gates | AND/OR/NOT truth tables; gate-by-gate walk of a small circuit | N-truth-table, E-circuit-predict |
| Derived gates | NAND/NOR with the intermediate column; XOR as AB'+A'B filled column by column (A', B', products, F); XNOR | N-truth-table |
| Circuit ↔ expression | write F for a drawn circuit, one gate output at a time (e.g. (A'+B)C); expression → pick the matching circuit | E-circuit-predict (label mode), N-expression, E-multiple-choice |
| SOP and POS | tag product/sum parts; expression → truth-table 1-rows; 1-rows → SOP | E-multiple-choice, N-row-select, N-expression |
| Laws and rules | match a rule to an example (A+A'B = A+B, …) | E-multiple-choice |
| Simplification | one derivation line per step, choosing the law (x'y'z+x'yz+xy' → x'z+xy'; xy+x'z+yz → xy+x'z); compare gate counts before/after | N-derivation |
| De Morgan | complement a product/sum one step at a time ((x'yz'+x'y'z)' → (x+y'+z)(x+y+z')) | N-derivation |
| Minterms and canonical form | spot minterms; canonical by (X+X') expansion; by truth table with an m column (A'+AB' = Σ(0,1,2); xy+x'yz = Σ(3,6,7)) | N-derivation, N-truth-table, N-row-select |

## Chapter 3 — K-map simplification
Layout from shape positions: 3-var map is 2×4, A on rows (0, 1), BC on columns in Gray order 00, 01,
11, 10 (cells m0 m1 m3 m2 / m4 m5 m7 m6); 4-var map AB rows × CD columns, both Gray. Braces mark B, C
(and A, D on 4-var); minterm index small in each cell's top-left. Groups are coloured rounded
rectangles, half-ovals when they wrap; the term for each group is written beside the map in order.
| Topic | Activities | Interactions |
|---|---|---|
| Reading the map | which cells form A, B', C'… (anatomy); minterm ↔ bits ↔ index | N-kmap (select), E-numeric |
| Three-variable maps | fill from Σ, then group one group per step, write its term, then F (Σ(3,4,6,7) → BC+AC'; Σ(0,2,3,4,6) → z'+x'y) | N-kmap |
| Expression → map | expand to canonical first (xy+x'y'z'+x'yz' → Σ(0,2,6,7) → x'z'+xy) | N-derivation, N-kmap |
| Four-variable maps | Σ(0,2,3,5,7,8,9,10,11,13,15) → AB'+BD+CD+B'D'; corners and wraps | N-kmap |
| Map vs algebra | same function both ways (→ B'C'+B'D'+A'CD') | N-kmap, N-derivation |
| Don't-cares | choose which x's to use (Σ(1,5,7), d(0,3,6) → C) | N-kmap (x cells) |

## Chapter 4 — Combinational logic circuits
| Topic | Activities | Interactions |
|---|---|---|
| Half adder | fill table A,B → S,C; write S = A⊕B, C = AB; walk the circuit | N-truth-table, N-expression, E-circuit-predict |
| Full adder | separate activities, progress kept between them: 8-row table; Σ for S and Co; K-map for Co; S → A⊕B⊕Ci by algebra (optional challenge). Link to Ch1 column addition | N-truth-table, N-kmap, N-derivation |
| Decoders and encoders | predict one output first; then the 3→8 one-hot table; 8→3 encoder table | N-truth-table |
| Functions with a decoder | pick the decoder outputs each OR gate needs (S: D1,D2,D4,D7; Co: D3,D5,D6,D7) | N-row-select |
| Multiplexers | predict one output first: which input reaches Y for each select value | E-circuit-predict (mux mode) or E-multiple-choice |
| Functions with a MUX | n−1 selectors; per row pair choose 0 / 1 / z / z' (Σ(1,2,6,7) → z, z', 0, 1) | N-row-select (choice per row) |

## Chapter 5 — Sequential circuits
| Topic | Activities | Interactions |
|---|---|---|
| Latches | predict one output first; then NAND SR latch outputs per input pair | N-truth-table |
| Flip-flops (SR, JK, D, T) | characteristic table → characteristic equation (Q⁺ = JQ'+K'Q, D, T⊕Q) → next state on one clock edge | N-truth-table, N-expression |
| Timing diagrams | place Q edge by edge, positive and negative edge versions (initial Q stated) | N-timing |
| Analysis | separate activities per stage: input equations → state equations → state table one column group per step → state diagram (D: A⁺=Ax+Bx, B⁺=A'x; JK; T; 3-flip-flop JK) | N-expression, N-truth-table (column groups), N-state-diagram |
| Design | separate activities per stage: spec → state table → excitation columns (with X) → one K-map per input → equations (counter 00→01→11→10 with D, T, JK) | N-truth-table, N-kmap, N-expression |

## New interactions, in build order
0. **Boolean module** (Backend, no dependency) in `src/content/`: parse our notation (`'`, implicit
   AND, `+`, `⊕`), evaluate, truth table, minterms, equivalence, minimal SOP up to 4 variables. Every
   kind below computes its truth from it; expressions are strings checked at load.
1. **N-truth-table** — fill one column at a time (intermediate columns, column groups, X entries). Ch2, 4, 5.
2. **N-expression** — Boolean expression entry, graded by equivalence plus a form check (`form: sop | pos | any`, optional `maxLiterals`); a correct but unsimplified answer gets its own nudge. Ch2–5.
3. **N-derivation** — two goals per line, in order: name the law, then give or choose the line it produces. Authored lines and law ids; a content test checks each line is equivalent to the one before. Ch2, 3, 4.
4. **N-row-select** (a mode of N-truth-table, not a separate kind) — tick rows / outputs, or choose a value per row. Ch2, 4.
5. **N-kmap** — fill from Σ (one goal); then per group two goals: mark the group, write its term; F is the last goal. Groups are checked as wrapping 2^k rectangles covering only 1s and X cells, and F for minimality — any minimal grouping is accepted. Step count is fixed per spec from the minimal cover. Ch3, 4, 5.
6. **N-timing** — place Q at each active clock edge. Ch5.
7. **N-state-diagram** — label edges / complete a pre-drawn diagram (no free drawing at first). Ch5.
Free-form circuit building is out of scope; use "pick the matching circuit" and gate-by-gate walks.

## Rules for all chapters (Pedagogy review, #131)
- A long chain (table → Σ → K-map → expression; flip-flop analysis and design) is several activities
  with progress kept between them, never one activity.
- When a device is new (mux, decoder, latch), start with one "predict one output" step before the full table.

## For the owner
- Slide exercises without printed answers (Ch3 slides 44, 45, 92–95, 102–108) have answers worked
  by machine; the instructor must confirm them before they become content.
- Three slide details need the instructor's confirmation; the list was given to the owner directly.
- Blank timing exercises do not state the initial Q; we will state it.
