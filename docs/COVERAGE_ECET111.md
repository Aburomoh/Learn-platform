# ECET 111 coverage matrix (#192, #193)

Execution checklist, updated at every merge. Content packs (verified answers, layouts): `docs/content-packs/ecet111/` (Ch.2 #269, Ch.3 #274, Ch.5 Part III #288).
Source: the owner's decks in `ECET111 materials/` (read
visually, never committed or quoted). Walked procedures: `docs/design/course-map-ecet111.md`.
Scaffolds, likely mistakes (= detectors) and slide-method constraints per subtopic:
`docs/design/ecet111-learning-requirements.md` (#253); every kind and content task follows it.

**Class:** CORE (assessed skill) · WORKED (worked example, used as the walked variant) · CONTEXT (not
assessed) · PRACTICE (slide exercise). Conservative when unclear.
**Covered:** COMPLETE · PARTIAL · MISSING · N/A (context). **Status:** the task that closes the row.
**Plan approved by the Director with conditions (#244):**
1. Every content question has three variants, sometimes four (owner, #192); Chapter 1 backfill #247 lands before C1 closes.
2. A chapter is COMPLETE only after its quality gate passes; gates exist before content merges (#216, #233, #250, #251, #252).
3. The demo Logic gates topic stays live until its replacement #224 has merged and passed QA.
4. Performance checks the 200 kB activity budget and a phone when each new kind lands (ADR-0008).
5. Preview only: ECET 111 completing does not trigger production (owner bar: at least three courses).
6. Slide errors and ambiguities go to the owner privately, never into issues or PRs.
Order: C1 → C5, then the C6 audit.

Chapter epics: C1 #201 · C2 #202 · C3 #203 · C4 #204 · C5 #205 · C6 #206. Gates: #216 (C1), #233 (C2), #250 (C3), #251 (C4), #252 (C5).
Prerequisites for new kinds: registry #196 (ADR-0008), Boolean module #197, UX representations #198.

## Chapter 1 — Digital systems and binary numbers (Ch.1 deck, 76 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Course intro, rules, textbook | 1–7, 48, 76 | CONTEXT | N/A | — | — | — |
| Decimal place value (543.451) | 8–10 | CORE | COVERED (Place value: Decimal weights) | weights concept check | place-value kind | #213 |
| Binary → decimal, with fraction (101.101) | 11–13 | CORE | COVERED (Place value: Binary → decimal) | weights → terms → sum | place-value kind | #208, #209, #213 |
| Decimal → binary by ÷2 (ladder) | 14–15, 31–44 | CORE | COMPLETE | — | repeated-division | `decimal-to-binary` KEEP |
| Octal → decimal, with fraction (124.160) | 16–19 | CORE | COVERED (Place value: Octal → decimal) | as binary | place-value kind | #213 |
| Octal → binary by digit replacement (246) | 21 | CORE | COMPLETE (digit replacement) | one digit per goal | bit-grouping reverse | #210, #211, #214 |
| Binary → octal, groups of 3, binary point | 22 | CORE (whole); WORKED + one practice (point) | COMPLETE (whole and fractions) | group outward from the point, once | bit-grouping + point | #210, #211, #214 |
| Hex digits and 0–15 table | 23–25 | CORE | COVERED (practice "Hex digits: 0 to 15") | small table checks | multiple-choice | #215 |
| Hex → decimal (1A3) | 26 | CORE | COVERED (Place value: Hex → decimal) | weights → terms → sum | place-value kind | #213 |
| Hex → binary by digit replacement | 27–28 | CORE | COMPLETE (digit replacement) | one digit per goal | bit-grouping reverse | #214 |
| Binary → hex, groups of 4 (16-bit) | 29–30 | CORE | COMPLETE (16-bit conversion) | longer inputs | bit-grouping | #214 |
| Check octal/hex answer in decimal | 38, 44 | CORE | COVERED (Octal check, Hex check steps) | own checked step | numeric base 10 | #215 |
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
| AND, OR, NOT symbols and truth tables | 4–6 | CORE | COVERED (Basic gates: tables + gate walk) | fill per column; gate walk | truth-table, circuit-predict | #224 |
| NAND, NOR (intermediate column) | 7–10 | CORE | COVERED (Derived gates) | column by column | truth-table | #225 |
| XOR as AB'+A'B, XNOR | 11–18 | CORE | COVERED (Derived gates, column by column) | A', B', products, F | truth-table | #225 |
| 3-input gates, rows = 2ⁿ | 19–20 | CORE | COVERED (Rows = 2ⁿ check; 3-input AND/OR tables in #224) | row count, fill | truth-table | #225 |
| Expression → circuit, circuit → expression | 21–25 | CORE | COMPLETE (circuit wiring and read-back) | one gate output per goal | expression, MC | #226 |
| SOP vs POS | 26–30 | CORE (POS recognition only) | COVERED (SOP or POS check) | tag parts; no 0-rows → POS, no maxterms | MC | #227 |
| Expression ↔ truth table | 31–36 | CORE | COVERED (SOP → table; 1-rows → SOP) | 1-rows; rows → SOP | truth-table row-select, expression | #227 |
| Laws (commutative, associative, distributive) | 37–40 | CORE | COVERED (Laws and rules: Name the law) | match law to example | MC | #228 |
| Rules and postulates | 41–43 | CORE | COVERED (Match the rule, Simplify) | match rule to example | MC | #228 |
| Algebraic simplification (+ gate count) | 44–54 | CORE | COVERED (law then line; gates saved) | law, then line | derivation | #229 |
| De Morgan | 55–63 | CORE | COVERED (identities; complement one law per line) | one step at a time | derivation | #230 |
| Minterms; canonical form (two methods) | 64–76 | CORE | COVERED (spot; expansion + Σ; table with m column) | expansion; table with m column | derivation, truth-table | #231 |

## Chapter 3 — K-map simplification (Ch.3 deck, 112 slides)
All K-map rows grade **any** minimal cover: several slide examples have more than one.

| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Canonical recap | 3–10 | WORKED | via Ch.2 | — | — | #231 |
| Map anatomy, minterm ↔ bits ↔ index | 11–19, 49–66 | CORE | COMPLETE (minterm indexing) | select cells; index | K-map select, numeric | #276 |
| 3-variable maps and the procedure | 20–41 | CORE | COMPLETE (fill, group, term) | fill; group + term per goal; F | K-map | #277 |
| Exercises 3-variable | 44–48, 92–95 | PRACTICE | COMPLETE (exercise mode) | exercise mode | K-map | #278 |
| 4-variable maps | 67–75 | CORE | COMPLETE (4-variable procedure) | as 3-var | K-map | #279 |
| Expression → map | 76–87 | CORE | COMPLETE (expansion to map) | expand, then map | derivation, K-map | #280 |
| Same function by algebra | 88–91 | WORKED | COMPLETE (algebraic equivalence) | compare | derivation | #281 |
| Don't-cares and exercises | 96–111 | CORE / PRACTICE | COMPLETE (don't-care selection) | choose which X | K-map | #282 |

## Chapter 4 — Combinational logic circuits (Ch.4 deck, 62 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Half adder | 3–8 | CORE | COMPLETE (table, S/C expressions, circuit) | table; S, C; walk | truth-table, expression, circuit-predict | #300 |
| Full adder, activity 1: 8-row table | 9–22, 33–36 | CORE | COMPLETE (8-row table) | table | truth-table | #301 |
| Full adder, activity 2: Σ for S and Co | 9–22, 33–36 | CORE | COMPLETE (minterm lists) | minterm lists | truth-table | #302 |
| Full adder, activity 3: K-map for Co | 9–22, 33–36 | CORE | COMPLETE (K-map simplification) | map, groups, expression | K-map | #303 |
| Full adder, optional: S → A⊕B⊕Ci by algebra | 9–22, 33–36 | WORKED | COMPLETE (algebraic proof) | derivation | derivation | #304 |
| Decoder, encoder | 23–32 | CORE | COMPLETE (3→8 and 8→3 tables) | predict one output; table | truth-table | #305 |
| Functions with a decoder | 37 | CORE | COMPLETE (OR function selection) | pick outputs for each OR | truth-table row-select | #306 |
| Multiplexer | 38–46 | CORE | COMPLETE (selection prediction) | predict one output; select table | MC / truth-table | #307 |
| Functions with a MUX | 47–61 | CORE / PRACTICE | COMPLETE (data selection with don't-cares) | choose 0/1/z/z' per pair | row-select (value per row) | #308 |

## Chapter 5 — Sequential circuits (Parts I–III, 38 + 55 + 35 slides)
| Subtopic | Slides | Class | Covered | Training | Interaction | Status |
|---|---|---|---|---|---|---|
| Sequential model, intro | I 4–7 | CONTEXT | N/A | — | — | — |
| NAND SR latch, gated SR | I 8–13 | CORE (outputs per input pair, incl. invalid); internals CONTEXT | MISSING | predict one output; table | truth-table | #295 |
| Clock edges; SR, JK, D, T characteristic tables | I 14–37 | CORE | MISSING | one edge at a time | truth-table | #296 |
| Characteristic equations and next state on one edge | I 14–37 | CORE | MISSING | equation; next state | expression | #297 |
| Timing diagrams (all types, both edges) | I 17–37 | WORKED / PRACTICE | MISSING | Q per active edge | timing | #298 |
| Analysis stage 1: input equations and output from a circuit | II 4–30 | CORE | MISSING | read equations | expression | #312 |
| Analysis stage 2: state equations | II 4–30 | CORE | MISSING | substitute into characteristic equation | expression | #313 |
| Analysis stage 3: state table by column group | II 4–30 | CORE | MISSING | one column group at a time | truth-table | #314 |
| Analysis stage 4: state diagram | II 4–30 | CORE | MISSING | table → diagram | state-diagram | #315 |
| Three JK flip-flops: 16-row table, diagram, timing | II 37–52 | WORKED | MISSING | column by column | truth-table, state-diagram, timing | #316 |
| Analysis exercises | II 31–33, 53–54 | PRACTICE | MISSING | exercise mode; owner confirms machine-worked answers | as above | #317 |
| Design: spec → state table | III 4–27 | CORE | MISSING | stage 1 | truth-table | #290 |
| Design: excitation columns (D, T, JK, with X) | III 4–27 | CORE | MISSING | stage 2 | truth-table (X) | #291 |
| Design: K-map per input → equations (don't-cares) | III 4–27 | CORE | MISSING | stage 3 | K-map, expression | #292 |
| Design problems (3 flip-flops) | III 28–34 | PRACTICE | MISSING | exercise mode | as above | #293 |

## Course-level
| Item | Status |
|---|---|
| Three variants per question, sometimes four (owner, #192): Chapter 1 backfill | #247 |
| Curated random numbers per attempt (later stage) | #248 backlog |
| Five-chapter navigation with Not started / In progress / Completed | #232 |
| Per-chapter quality gates (#192 item 11) | #216, #233, #250, #251, #252 |
| Final audit and owner report | #242 |
| Slide details needing the instructor | sent to the owner privately |
