# Content pack — ECET 111 Chapter 2: Boolean algebra and logic gates (#266)

Source: Ch.2 deck (PDF, 77 pages; Tier-1, not in the repo). References are PDF pages (`Ch2 p.N`).
Restated, never quoted. Every answer below was re-computed with `src/content/boolean/`
(truth tables, minterms, `equivalent` on every derivation line). Rows match the Ch.2 rows of
`docs/COVERAGE_ECET111.md`. Notation: this pack writes `'` for complement; the slides use both.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Row order | Binary counting, first variable = MSB (A, B, C or x, y, z); m0 = all 0s |
| Row count | 2^(number of inputs): 2 → 4, 3 → 8, 4 → 16 (p.19, p.68) |
| Complement | Overbar on gates/SOP/canonical slides (A̅); prime on textbook slides (x′, p.44–63); p.4 shows both (x′ = x̅) |
| AND | Dot (A.B) on gate slides; juxtaposition (AB, xy) elsewhere |
| Variable names | A, B, C (gates, SOP, canonical ex.1); x, y, z (textbook examples, canonical ex.2); w, x, y once (p.64) |
| Function names | z (p.4), F, X, F1/F2, F(A,B) with variable list |
| Answer form | Canonical: Σ(list) then the minterm sum (p.71, p.76) |
| Context pages | p.1–3 title/contents/textbook; p.5 circuit ↔ expression ↔ truth table triad; p.77 end |

## 1. AND, OR, NOT — p.4–6 — CORE
| Gate | Expression | Table (x y → z, rows 00,01,10,11) | Verified |
|---|---|---|---|
| AND | z = x.y | 0 0 0 1 | Σ(3) ✓ |
| OR | z = x + y | 0 1 1 1 | Σ(1,2,3) ✓ |
| NOT | z = x′ = x̅ | x=0 → 1, x=1 → 0 | ✓ |

Method: symbol, expression, table side by side. p.6 repeats p.4.

## 2. NAND, NOR (intermediate column) — p.7–10 — CORE
| Page | Content |
|---|---|
| p.7 | "Derived gates" built from AND/NOT tables |
| p.8 | NAND = AND followed by NOT, then the single NAND symbol (bubble); table columns **A, B, A.B, (A.B)′** |
| p.9–10 | NOR = OR followed by NOT; columns **A, B, A+B, (A+B)′** |

| Gate | Intermediate column | Output | Verified |
|---|---|---|---|
| NAND | A.B = 0 0 0 1 | 1 1 1 0 | Σ(0,1,2) ✓ |
| NOR | A+B = 0 1 1 1 | 1 0 0 0 | Σ(0) ✓ |

## 3. XOR as AB′+A′B, XNOR — p.11–18 — CORE (worked, filled column by column)
XOR circuit (p.12): two NOTs, AND(A, B′), AND(A′, B), OR. Labels on each gate output.
Table column order (p.13–15): **A, B, A′, B′, A.B′, A′.B, A.B′+A′.B = A⊕B**. p.16: compact
3-column table + rule (1 when exactly one input is 1).

| Column | Rows 00,01,10,11 | Verified |
|---|---|---|
| A′ | 1 1 0 0 | ✓ |
| B′ | 1 0 1 0 | ✓ |
| A.B′ | 0 0 1 0 | ✓ |
| A′.B | 0 1 0 0 | ✓ |
| A⊕B | 0 1 1 0 | Σ(1,2), equivalent to A⊕B ✓ |

XNOR (p.17–18): symbol = XOR + bubble, (A⊕B)′. Circuit AND(A,B), AND(A′,B′), OR.
Columns **A, B, A′, B′, A.B, A′.B′, A.B+A′.B′ = (A⊕B)′**.

| Column | Rows 00,01,10,11 | Verified |
|---|---|---|
| A.B | 0 0 0 1 | ✓ |
| A′.B′ | 1 0 0 0 | ✓ |
| XNOR | 1 0 0 1 | equivalent to (A⊕B)′ ✓ |

## 4. 3-input gates, rows = 2ⁿ — p.19–20 — CORE
| Item | Value | Verified |
|---|---|---|
| Example | 3-input AND, F = A.B.C | Σ(7): only row 111 is 1 ✓ |
| Row count | 2^3 = 8, columns A, B, C, F, rows 000…111 | ✓ |

p.20 repeats p.19. No 3-input OR/NAND example in the deck.

## 5. Expression → circuit (circuit → expression) — p.21–25 — CORE
| Page | Expression | Circuit as drawn | Verified F |
|---|---|---|---|
| p.21–22 | F = (A′+B)C | NOT A → OR with B → AND with C | Σ(1,3,7) |
| p.23–24 | F = (A′+BC)′ (bar over the whole sum) | NOT A; AND B,C; OR; NOT on output | Σ(4,5,6) |
| p.25 | same | second drawing: OR+NOT replaced by one NOR gate | equivalent ✓ |

Method: expression shown first, circuit built innermost operation first (NOT, then AND/OR,
then outer gate). No circuit → expression exercise on these pages; the reverse direction appears
only as labelled gate outputs (p.12, p.46).

## 6. SOP vs POS — p.26–30 — CORE (POS recognition only)
| Page | Content | Verified |
|---|---|---|
| p.26–27, 29 | X = A′B′C + A′BC′ + ABC; each term tagged "product", the + tagged "sum" → SOP | isSOP ✓ |
| p.28 | X = (A′+B′+C)(A′+B+C′)(A+B+C); each bracket "sum", joined by product → POS | isPOS ✓ (POS not practised) |
| p.30 | 2-variable table F = 0,1,0,1 (rows 00…11); 0-rows and 1-rows coloured differently; SOP from the 1-rows: F(A,B) = A′B + AB, labelled minterms | Σ(1,3) ✓ (= B) |

No maxterms, no POS from 0-rows (title mentions POS; only SOP is derived).

## 7. Expression ↔ truth table — p.31–36 — CORE
Expression → table (p.31–33), X = A′B′C + A′BC′ + ABC. Method: each product is colour-coded;
X = 1 when any one product = 1; columns **A, B, C, X**.

| Row ABC | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| X | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 1 |

Verified Σ(1,2,7) ✓ (A′B′C → 001, A′BC′ → 010, ABC → 111).

Table → SOP (p.34–36): same table given; one product per 1-row (0 input → complemented
literal), giving the same X. Verified ✓. See owner note (p.34).

## 8. Laws: commutative, associative, distributive — p.37–40 — CORE (recognition)
| Law | Form on slide (A, B, C, dot notation) | Verified |
|---|---|---|
| Commutative | A+B = B+A; A.B = B.A | ✓ |
| Associative | A+(B+C) = (A+B)+C = A+B+C; same with dot | ✓ |
| Distributive | A.(B+C) = AB+AC | ✓ |

p.38 adds that these match ordinary algebra. p.39–40: circuit AB+AC (2 AND + OR) redrawn as
A.(B+C) (OR + AND), labelled "check" (3 gates → 2). See owner note (p.39–40 figure).
Only the first distributive form is taught on these pages; x+yz = (x+y)(x+z) appears only in the
textbook table (p.42).

## 9. Rules and postulates — p.41–43 — CORE (recognition)
| Group (p.41 layout: 3 columns) | Rules | Verified |
|---|---|---|
| OR column | A+0 = A; A+1 = 1; A+A′ = 1; A+A = A | ✓ all |
| AND column | A.A′ = 0; A.1 = A; A.0 = 0; A.A = A | ✓ all |
| Third column | A″ = A; A+AB = A; A+A′B = A+B | ✓ all |

p.42: textbook Table 2.1 (postulates 2–5, theorems 1–6 incl. De Morgan, absorption, both
distributive forms) — CONTEXT, x/y notation, prime. p.43 repeats p.41 with A+A′B = A+B boxed.

## 10. Algebraic simplification (+ gate count) — p.44–54 — CORE (WORKED → CORE)
F2 (p.44–50), textbook pages 47–48:

| Step | Line | Law used (implicit on slide) | Verified |
|---|---|---|---|
| 0 | F2 = x′y′z + x′yz + xy′ | — | Σ(1,3,4,5) |
| 1 | = x′z(y′+y) + xy′ | factor x′z (distributive) | ✓ |
| 2 | = x′z + xy′ | y′+y = 1, A.1 = A | ✓ |
| p.48 | written as F2 = xy′ + x′z | commutative | minimal SOP ✓ |

| Circuit | Gates | Literals |
|---|---|---|
| Before (p.45–46, gate outputs labelled x′y′z, x′yz, xy′) | 2 NOT, 3 AND, 1 OR (3-input) = 6 | 8 |
| After (p.49) | 2 NOT, 2 AND, 1 OR = 5 | 4 |

p.50 shows both circuits with "before/after" labels.

Example 2.1 (p.51–54), textbook page 49:

| Input | Lines (each verified equivalent) | Answer |
|---|---|---|
| x(x′+y) | xx′ + xy → 0 + xy | xy ✓ |
| (x+y)(x+y′) | x + xy + xy′ + yy′ → x(1+y+y′) | x ✓ |
| xy + x′z + yz | xy + x′z + yz(x+x′) → xy + x′z + xyz + x′yz → xy(1+z) + x′z(1+y) | xy + x′z ✓ (consensus) |

Law names are not written on the slide lines.

## 11. De Morgan — p.55–63 — CORE
| Page | Identity (overbar, dot notation) | Verified |
|---|---|---|
| p.55 | (A.B)′ = A′ + B′ | ✓ |
| p.56 | + (A+B)′ = A′.B′ | ✓ |
| p.57, 59 | + 3-variable: (A.B.C)′ = A′+B′+C′; (A+B+C)′ = A′.B′.C′ | ✓ |

Example 2.2 (p.58, 60–63), "find the complement", textbook pages 49–50, prime notation:

| Input | Lines (each verified) | Answer |
|---|---|---|
| F1′ = (x′yz′ + x′y′z)′ | (x′yz′)′(x′y′z)′ | (x+y′+z)(x+y+z′) ✓ |
| F2′ = [x(y′z′ + yz)]′ (square brackets) | x′ + (y′z′+yz)′ → x′ + (y′z′)′(yz)′ → x′ + (y+z)(y′+z′) | x′ + yz′ + y′z ✓ |

Method: break the outer bar first (sum → product of complements, or product → sum), then
complement each inner term. Last step of F2′ multiplies out and drops yy′, zz′ (not shown).

## 12. Minterms; canonical form (two methods) — p.64–76 — CORE
| Page | Content | Verified |
|---|---|---|
| p.64 | heading SOP/POS with F(A,B,C) example; minterm = product containing every variable (plain or complemented) | see owner note |
| p.64–65 | spot the minterm: in F(A,B) = A + A′B → A′B; in F(w,x,y) = wx + w′y + wxy′ → wxy′ | ✓ (only terms with all variables) |
| p.66 | 2 variables → 4 minterms: A′B′, A′B, AB′, AB | ✓ |
| p.67 | 3 variables → 8 minterms, listed A′B′C′ … ABC in binary order | ✓ |
| p.68 | 4 variables → 16 (A′B′C′D′ … ABCD); rule 2^n | ✓ |
| p.69–70 | canonical = SOP whose terms are all minterms; classify: A′B + AB′ canonical; A′ + AB′ not; xy + x′yz not | ✓ (Σ(1,2), Σ(0,1,2), Σ(3,6,7)) |

Method 1 — replace each missing variable X by (X + X′) (p.71):

| Input | Lines | Answer | Verified |
|---|---|---|---|
| F(A,B) = A′ + AB′ | A′(B+B′) + AB′ → A′B + A′B′ + AB′ | Σ(0,1,2) | ✓ |
| F(x,y,z) = xy + x′yz (p.73–74, "Example 2") | xyz′ + xyz + x′yz | Σ(3,6,7) | ✓ |

Method 2 — truth table with intermediate columns, an **m column** (m0…m(2ⁿ−1)) and a
**tick column** marking 1-rows; answer Σ(ticked) = sum of those minterms.

p.72, F(A,B) = A′ + AB′, columns **A, B, A′, B′, AB′, F, m, ✓**:

| Row AB | A′ | B′ | AB′ | F | m | ✓ |
|---|---|---|---|---|---|---|
| 00 | 1 | 1 | 0 | 1 | m0 | ✓ |
| 01 | 1 | 0 | 0 | 1 | m1 | ✓ |
| 10 | 0 | 1 | 1 | 1 | m2 | ✓ |
| 11 | 0 | 0 | 0 | 0 | m3 | |

Answer Σ(0,1,2) = A′B + A′B′ + AB′ ✓ (term order as on slide, not index order).

p.75–76, F(x,y,z) = xy + x′yz, columns **x, y, z, xy, x′, x′yz, F, m, ✓** (no y or z complement
columns): xy = 00000011, x′ = 11110000, x′yz = 00010000, F = 00010011 (rows 000…111). Ticks
m3, m6, m7. Answer Σ(3,6,7) = xyz′ + xyz + x′yz ✓.

## Exercises (practice candidates)
| Page(s) | Student task | Verified answer |
|---|---|---|
| p.9–10 | fill NOR output column | 1 0 0 0 |
| p.13–15 | fill XOR columns A′, B′, AB′, A′B, F | see §3 |
| p.17–18 | fill XNOR product and output columns | see §3 |
| p.21–24 | draw circuit for (A′+B)C; (A′+BC)′ | see §5 |
| p.31–33 | fill X for A′B′C + A′BC′ + ABC | Σ(1,2,7) |
| p.34–36 | SOP from table | A′B′C + A′BC′ + ABC |
| p.44–48 | simplify F2 | xy′ + x′z |
| p.51–54 | Example 2.1 (three parts) | xy; x; xy + x′z |
| p.58–63 | Example 2.2 complements | (x+y′+z)(x+y+z′); x′ + yz′ + y′z |
| p.69–70 | canonical or not (3 functions) | yes; no; no |
| p.73–76 | canonical of xy + x′yz | Σ(3,6,7) |

No end-of-chapter exercise set in the deck.

## Terminology variants
Derived gates (NAND, NOR, XOR, XNOR); "Exclusive OR / Exclusive NOR"; "number of states" for row
count (p.19); "standard form" and "canonical form" used for the same thing (p.71 heading vs
p.69); "complement of a function" (Example 2.2); "Laws" (p.37) vs "Rules" (p.41) vs
"Postulates and Theorems" (p.42).
