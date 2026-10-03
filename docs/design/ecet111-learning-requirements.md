# ECET 111 learning requirements, Chapters 1–5 (#194)

Pedagogy input for epic #192, alongside the coverage matrix (#193) and the course map
(`course-map-ecet111.md`, which already fixes activities and kinds; this note does not repeat it).
Source: the owner's decks, read visually (figures, tables, shape layout). Slide content is
restated, never quoted. Apparent slide errors go to the owner privately, not here.

Legend: **Core** = practised and assessed · **Worked** = shown as a walked example, then practised
on new numbers · **Context** = shown once, not practised. Every procedure below follows the
step-as-goal and variant rules (`PEDAGOGY.md`).

## Cross-chapter rules
- **Follow the slide method and layout**, even where software could shortcut it (vertical division
  ladder; stacked complement rows; truth tables with intermediate columns; Σ answers).
- **Check back.** The slides close almost every example with a check (decimal value, truth table).
  Keep the check as the final goal of a practice where the slides have one.
- **Notation in, notation out.** Accept both complement notations the decks use (prime and
  overbar) and both AND notations (dot, juxtaposition); display in the deck's own notation per chapter.
- **No widening.** Topics absent from the decks (BCD, Gray, signed magnitude, overflow, maxterms,
  POS canonical, Mealy/Moore theory beyond the slides) are not practised.

## Chapter 1 — Digital systems and binary numbers
**Students must be able to:** read a number's place values in base 2, 8, 10, 16; convert any of
these to decimal; convert decimal to binary by repeated division; convert binary ↔ octal/hex
both ways; add in binary; form 1's and 2's complements; subtract by 2's complement and interpret
the end carry.

| Concept | Level | Scaffold / explanation | Likely mistakes (detectors) | Interaction |
|---|---|---|---|---|
| Place value, weight = power of the base (incl. negative powers after the point) | Core | Explain once: digit × base^position; then predict one weight | wrong power for a position; counting positions from the left; forgetting the point shifts to negative powers | numeric per term (new: weight-expansion walk, or numeric with `digit-row` context) |
| Base → decimal (2, 8, 16, with fractions) | Core — **missing today** | one goal per term, MSB first, then the total; hex letters as values | weights reversed; A–F read as 1x; fraction weights as positive powers | same walk as above |
| Decimal → binary, repeated division | Core (built) | vertical ladder, read bottom-up | swapped quotient/remainder; read top-down | existing |
| Octal/hex → binary by digit replacement | Core — **missing today** | one goal per digit (3 or 4 bits), then join and drop leading zeros, then check | too few bits per digit (e.g. 2 → "10" not "010"); hex letter as two digits | bit-grouping in reverse (digit → group) |
| Binary → octal/hex by grouping | Core (built) | groups from the right (from the point for fractions) | from-left; no padding | existing; fractions: Worked only (one slide example) |
| Combined chain with decimal check | Core (built as exercises) | the check is its own goal | — | existing |
| Binary addition | Core (built) | rules, then column by column | decimal total written; carry ignored | existing |
| 1's / 2's complement | Core (built) | flip, rule check, +1 | copied; gave the other complement | existing |
| Subtraction by 2's complement, both signs | Core (built) | end carry decides the sign; negative → re-complement | kept the carry; missed negative | existing |

**Method notes.** The decks write subtraction results as −(size) for a negative result; there is
no sign bit and no fixed word length, so do not introduce them. The binary-fraction grouping
appears once: Worked, not drilled. Admin/intro slides are Context.

## Chapter 2 — Boolean algebra and logic gates
**Students must be able to:** state and apply the rule of each gate (AND, OR, NOT, NAND, NOR,
XOR, XNOR); build a truth table with intermediate columns; go between circuit, expression and
truth table; write SOP from a truth table; apply the laws and De Morgan step by step; write the
canonical sum of minterms by expansion or by truth table.

| Concept | Level | Scaffold / explanation | Likely mistakes (detectors) | Interaction |
|---|---|---|---|---|
| Basic and derived gate rules | Core | predict one row before a full table (course map) | NAND/NOR as AND/OR; XOR as OR (1,1 → 1) | truth-table, circuit-predict (existing walk) |
| Truth table with intermediate columns (XOR as AB′+A′B) | Core | one column per goal, in the slide's column order (inputs A-first as MSB, complements, products, output) | rows not in binary order; complement column copied | truth-table |
| Expression ↔ circuit | Core | gate-by-gate walk (existing), label each gate's output expression | bubble/NOT dropped; precedence (AND before OR) | circuit-predict label mode; expression |
| Expression → truth table | Core | one product term at a time: which rows make it 1 | marks rows where only some literals hold | row-select |
| Truth table → SOP | Core | one product per 1-row | writes a 0-row; literal not complemented for a 0 input | row-select → expression |
| Laws and rules | Core (recognition) | match law to example before using it | — | multiple-choice |
| Algebraic simplification | Worked → Core on slide examples | per line: name the law, then the line (course map) | applies a law that doesn't match; drops a term | derivation |
| De Morgan | Core | one complement step per goal: break the bar, change the operator | changes operator but not literals, or the reverse | derivation |
| Minterms; canonical form by (X+X′) expansion and by truth table | Core | expansion one missing variable at a time; then Σ list | missed a variable; duplicate minterm kept | derivation, truth-table, row-select |
| SOP/POS vocabulary; textbook law table | Context | — | — | — |

**Method notes.** Canonical **POS** and maxterms are not taught: SOP only. Σ is the answer form;
accept terms in any order. The circuit-diagram figures linking the three representations are
Context.

## Chapter 3 — K-map simplification
**Students must be able to:** put a function in canonical form; draw and fill a 3- or 4-variable
map; group 1s in blocks of 8, 4, 2, 1 (with wrap and corners), as few and as large as possible;
read each group's term; write a minimal SOP; use don't-cares to enlarge groups.

| Concept | Level | Scaffold / explanation | Likely mistakes (detectors) | Interaction |
|---|---|---|---|---|
| Canonical form before the map (expansion or truth table) | Core | the slides require it as step 1: keep it as its own goal, not a shortcut | same as Chapter 2 expansion | derivation / truth-table (reuse Ch.2) |
| Map anatomy: Gray order, which cells are A, B′, … | Core | predict one cell's index before filling | binary order 00 01 10 11 instead of Gray; rows/columns swapped | kmap (select) |
| Fill the map from Σ (1s and explicit 0s) | Core | one goal (one rule applied per cell) | cell index misplaced by Gray order | kmap |
| Group: sizes 8/4/2/1, wrap, corners, overlap allowed | Core | per group: mark it, then write its term (course map); hints in the slides' words: "biggest block", "fewest groups", "edges touch" | non-power-of-two group; L-shapes; missing the wrap or corner; a smaller group where a larger fits | kmap |
| Read a group's term | Core | the variables that stay constant; the slides' size rule (4 ones → 1 variable on a 3-var map, etc.) | keeps a changing variable; wrong complement | kmap term / expression |
| Write F as the OR of the terms | Core | final goal | redundant group kept → "correct, but can be simpler" | expression with form check |
| Don't-cares | Core | an x is used only when it makes a group larger | every x forced to 1; x left as a lone group | kmap (x cells) |
| Map vs algebra on the same function; cell-shading walkthroughs | Context / Worked | — | — | — |

**Method notes.**
- **Any minimal cover is correct.** Several slide examples have more than one minimal answer while
  showing one. Grade by the final cover (same number of terms and literals), accept groups in any
  order, and never call the slide's cover "the" answer.
- **Don't introduce new theory.** The decks never name prime or essential implicants; hints must
  not either. "This 1 can only join one group" is acceptable plain-language guidance at rung 6+.
- **SOP only;** no grouping of 0s. Allow a 16-cell group (F = 1) even though the size list omits it.
- **Variable names vary** (A–D and w–z): use the deck's names per example.

## Chapter 4 — Combinational logic circuits
**Students must be able to:** build the half- and full-adder truth tables and derive their
equations; implement a function with a decoder and an OR gate; read a multiplexer's select table;
implement a function with a multiplexer by the row-pair method.

| Concept | Level | Scaffold / explanation | Likely mistakes (detectors) | Interaction |
|---|---|---|---|---|
| Half adder: table → S = A⊕B, C = AB (read off the table, **no K-map**) | Core | link to Ch.1 "1 + 1 = 0 carry 1" | S as OR; C as XOR | truth-table, expression |
| Full adder: table → Σ → K-map for Co → SOP; S stays SOP, A⊕B⊕Ci by algebra | Core (Co), Worked (S → XOR) | separate activities with saved progress (course map); S's four isolated 1s is a teaching moment: "no two 1s touch, so no grouping helps" | groups diagonal 1s for S; Co missing one of the three pairs | truth-table, kmap, derivation (optional challenge) |
| Decoder: one output active per input combination | Core | predict one output first | more than one output active | truth-table |
| Encoder (one active input assumed) | Context | — | — | — |
| Function with a decoder: OR the minterm lines | Core | one output function per goal: pick its D lines | picks 0-rows; misses one minterm | row-select |
| MUX select table | Core | predict which input reaches Y for one select value | select bits read in reverse order | circuit-predict (mux) / multiple-choice |
| Function with a MUX: first n−1 variables on the selects (MSB on the highest select), last variable decides each data input (z, z′, 0, 1) per row pair | Core | one row pair per goal, then the wiring | compares the pair with the wrong variable; z vs z′ swapped; 0/1 where z applies | row-select (choice per pair) |

**Method notes.** Default data variable is always the **last** one; choosing another (e.g. w on the
data inputs) appears only as an unanswered exercise: offer it later as a challenge, not the base
method. No full-adder circuit is drawn in the deck; gate walks for it are Worked at most.

## Chapter 5 — Sequential circuits (Parts I–III)
**Students must be able to:** give the next state of SR, JK, D and T flip-flops from their
characteristic tables and (JK, D, T) equations; draw Q on a timing diagram at each active edge;
analyse a clocked circuit (input equations → state equations → state table → state diagram);
design a small counter with D, T or JK flip-flops (state table → excitation columns → K-maps →
equations).

| Concept | Level | Scaffold / explanation | Likely mistakes (detectors) | Interaction |
|---|---|---|---|---|
| SR latch (NAND, active-low), gated latch | Context (internals); Core (invalid input) | — | treats 00 on a NAND latch as "hold" | truth-table (predict) |
| Edge-triggered SR, JK, D, T: characteristic tables | Core | predict one row before the table | JK 11 as invalid (that's SR); T as D | truth-table |
| Characteristic equations JK, D, T (SR has none in the deck) | Core | link to the table row by row | JQ′+K′Q written as JQ+KQ′ | expression |
| Timing diagrams at positive / negative edges | Core | circle each active edge, sample the inputs there, then draw Q; **always state the initial Q** | changes Q between edges; uses the wrong edge; samples after the edge | timing |
| Analysis: input equations → state equations → state table → state diagram | Core | separate activities per stage (course map); state table one column group per goal | next state from the wrong row; outputs on the wrong edge | expression, truth-table (column groups), state-diagram |
| Design: state table → excitation columns (X = don't care) → K-map per input → equations | Core | separate activities per stage; excitation table shown as a reminder before its columns | excitation read the wrong way (Qt → Qt+1); X written as 0 | truth-table, kmap, expression |

**Method notes.**
- **Column order differs and must be kept:** analysis tables put flip-flop inputs **before** the
  next state; design tables put the next state **before** the flip-flop inputs.
- **State diagrams:** binary state codes in circles; edges labelled input/output when there is an
  output, input only otherwise. Do not name Mealy or Moore (the deck never does).
- **Notation:** Q(t+1), A(t+1), Qt+1 and Q0 ("previous Q") all appear; accept them, display one per chapter.
- **Do better than the deck, within scope:** the T and JK designs stop at the table; completing them
  through K-maps is in scope (same method as D). Circuits for designs are Worked at most.

## For the owner (privately)
A short list of apparent slide errors found while reading (labels, a few wrong table cells, two
diagrams) is delivered to the owner directly, not stored in this public repository.
