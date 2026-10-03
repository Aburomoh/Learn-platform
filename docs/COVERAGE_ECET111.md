# ECET 111 coverage matrix (#192, #193)

Execution checklist, updated at every merge. Source: the owner's decks in `ECET111 materials/` (read
visually, never committed or quoted). Walked procedures: `docs/design/course-map-ecet111.md`.

**Class:** CORE (assessed skill) · WORKED (worked example, used as the walked variant) · CONTEXT (not
assessed) · PRACTICE (slide exercise). Conservative when unclear.
**Covered:** COMPLETE · PARTIAL · MISSING · N/A (context). **Status:** the task that closes the row.
Chapter epics: C1 #201 · C2 #202 · C3 #203 · C4 #204 · C5 #205 · C6 #206. Gates: #216 (C1), #233 (C2).
Prerequisites for new kinds: registry #196 (ADR-0008), Boolean module #197, UX representations #198.

## Chapter 1 — Digital systems and binary numbers (Ch.1 deck, 76 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Course intro, rules, textbook | 1–7, 48, 76 | CONTEXT | N/A | — | — | — |
| Decimal place value (543.451) | 8–10 | CORE | MISSING | weights concept check | place-value kind | #213 |
| Binary → decimal, with fraction (101.101) | 11–13 | CORE | MISSING | weights → terms → sum | place-value kind | #208, #209, #213 |
| Decimal → binary by ÷2 (ladder) | 14–15, 31–44 | CORE | COMPLETE | — | repeated-division | `decimal-to-binary` KEEP |
| Octal → decimal, with fraction (124.160) | 16–19 | CORE | MISSING | as binary | place-value kind | #213 |
| Octal → binary by digit replacement (246) | 21 | CORE | MISSING | one digit per goal | bit-grouping reverse | #210, #211, #214 |
| Binary → octal, groups of 3, binary point | 22 | CORE | PARTIAL (whole numbers only) | group outward from the point | bit-grouping + point | #210, #211, #214 |
| Hex digits and 0–15 table | 23–25 | CORE | PARTIAL (hints only) | small table checks | multiple-choice | #215 |
| Hex → decimal (1A3) | 26 | CORE | MISSING | weights → terms → sum | place-value kind | #213 |
| Hex → binary by digit replacement | 27–28 | CORE | MISSING | one digit per goal | bit-grouping reverse | #214 |
| Binary → hex, groups of 4 (16-bit) | 29–30 | CORE | PARTIAL (short inputs) | longer inputs | bit-grouping | #214 |
| Check octal/hex answer in decimal | 38, 44 | CORE | MISSING (explanation only) | own checked step | numeric base 10 | #215 |
| Binary addition | 45–47 | CORE | COMPLETE | — | column-addition | `binary-addition` KEEP |
| Subtraction as A + 2's complement | 49–51 | CORE | COMPLETE | — | — | `subtraction-positive` KEEP |
| 1's and 2's complement | 52–55 | CORE | COMPLETE | — | numeric bit-row, column-addition | `complements` KEEP |
| Subtraction, positive result | 56–67 | CORE | COMPLETE | — | column-addition, MC | KEEP |
| Exercise 88 / 73 chain | 68–69 | PRACTICE | COMPLETE | — | existing | `conversion-exercise` KEEP |
| Exercise 15−4, 10−14 | 70–75 | PRACTICE | COMPLETE | — | existing | both exercises KEEP |
| Decimal fraction → binary | not in deck | — | N/A | out of scope | — | — |

Audit: number-systems topic **EXTEND**; all other Chapter 1 activities **KEEP**; demo Logic gates topic
**REPLACE** by Chapter 2 (#207 moves it out of Chapter 1, #224 replaces it).

## Chapter 2 — Boolean algebra and logic gates (Ch.2 deck, 77 pages)
| Subtopic | Pages | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| AND, OR, NOT symbols and truth tables | 4–6 | CORE | PARTIAL (demo topic) | fill per column; gate walk | truth-table, circuit-predict | #224 |
| NAND, NOR (intermediate column) | 7–10 | CORE | MISSING | column by column | truth-table | #225 |
| XOR as AB'+A'B, XNOR | 11–18 | CORE | MISSING | A', B', products, F | truth-table | #225 |
| 3-input gates, rows = 2ⁿ | 19–20 | CORE | MISSING | row count, fill | truth-table | #225 |
| Expression → circuit, circuit → expression | 21–25 | CORE | MISSING | one gate output per goal | expression, MC | #226 |
| SOP vs POS | 26–30 | CORE | MISSING | tag parts | MC | #227 |
| Expression ↔ truth table | 31–36 | CORE | MISSING | 1-rows; rows → SOP | truth-table row-select, expression | #227 |
| Laws (commutative, associative, distributive) | 37–40 | CORE | MISSING | match law to example | MC | #228 |
| Rules and postulates | 41–43 | CORE | MISSING | match rule to example | MC | #228 |
| Algebraic simplification (+ gate count) | 44–54 | CORE | MISSING | law, then line | derivation | #229 |
| De Morgan | 55–63 | CORE | MISSING | one step at a time | derivation | #230 |
| Minterms; canonical form (two methods) | 64–76 | CORE | MISSING | expansion; table with m column | derivation, truth-table | #231 |

## Chapter 3 — K-map simplification (Ch.3 deck, 112 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Canonical recap | 3–10 | WORKED | via Ch.2 | — | — | #231 |
| Map anatomy, minterm ↔ bits ↔ index | 11–19, 49–66 | CORE | MISSING | select cells; index | K-map select, numeric | #234, #235 (content filed on merge) |
| 3-variable maps and the procedure | 20–41 | CORE | MISSING | fill; group + term per goal; F | K-map | content on #203 |
| Exercises 3-variable | 44–48, 92–95 | PRACTICE | MISSING | exercise mode | K-map | content on #203 |
| 4-variable maps | 67–75 | CORE | MISSING | as 3-var | K-map | content on #203 |
| Expression → map | 76–87 | CORE | MISSING | expand, then map | derivation, K-map | content on #203 |
| Same function by algebra | 88–91 | WORKED | MISSING | compare | derivation | content on #203 |
| Don't-cares and exercises | 96–111 | CORE / PRACTICE | MISSING | choose which X | K-map | content on #203 |

## Chapter 4 — Combinational logic circuits (Ch.4 deck, 62 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Half adder | 3–8 | CORE | MISSING | table; S, C; walk | truth-table, expression, circuit-predict | #204 |
| Full adder (four activities) | 9–22, 33–36 | CORE | MISSING | table; Σ; K-map; S by algebra (optional) | truth-table, K-map, derivation | #204 |
| Decoder, encoder | 23–32 | CORE | MISSING | predict one output; table | truth-table | #204 |
| Functions with a decoder | 37 | CORE | MISSING | pick outputs for each OR | truth-table row-select | #204 |
| Multiplexer | 38–46 | CORE | MISSING | predict one output; select table | MC / truth-table | #204 |
| Functions with a MUX | 47–61 | CORE / PRACTICE | MISSING | choose 0/1/z/z' per pair | row-select (value per row) | #204 |

## Chapter 5 — Sequential circuits (Parts I–III, 38 + 55 + 35 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Sequential model, intro | I 4–7 | CONTEXT | N/A | — | — | — |
| NAND SR latch, gated SR | I 8–13 | CORE | MISSING | predict one output; table | truth-table | #205 |
| Clock edges; SR, JK, D, T characteristic tables and equations | I 14–37 | CORE | MISSING | table; equation; one edge | truth-table, expression | #205 |
| Timing diagrams (all types, both edges) | I 18–37 | CORE / PRACTICE | MISSING | Q per active edge | timing | #237, #238 |
| Analysis: D, JK, T, 3-flip-flop | II 4–52 | CORE | MISSING | stages as separate activities | expression, truth-table groups, state diagram, timing | #205 |
| Analysis exercises | II 31–33, 53–54 | PRACTICE | MISSING | exercise mode | as above | #205 |
| Design: state table → excitation → K-maps → equations (D, T, JK) | III 4–27 | CORE | MISSING | stages as separate activities | truth-table (X), K-map, expression | #205 |
| Design problems (3 flip-flops) | III 28–34 | PRACTICE | MISSING | exercise mode | as above | #205 |

## Course-level
| Item | Status |
|---|---|
| Three variants per question, sometimes four (owner, #192): Chapter 1 backfill | #247 |
| Curated random numbers per attempt (later stage) | #248 backlog |
| Five-chapter navigation with Not started / In progress / Completed | #232 |
| Per-chapter quality gates (#192 item 11) | #216, #233; C3–C5 gates filed with their content |
| Final audit and owner report | #242 |
| Slide details needing the instructor | sent to the owner privately |
