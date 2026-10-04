# Content pack — ECET 111 Chapter 3: K-map simplification (#270)

Source: Ch.3 deck (pptx, 112 slides; Tier-1, not in the repo). References are slides (`Ch3 s.N`).
Restated, never quoted. Every map below was re-computed with `src/content/boolean/`
(`minimalCovers`; `equivalent` on every algebra line). Where a map has **several minimal covers,
all are listed and all must be accepted**. Rows match the Ch.3 rows of `docs/COVERAGE_ECET111.md`.
Notation: this pack writes `'` for complement; the slides use both (see conventions).

## Deck-wide conventions
| Item | As taught |
|---|---|
| 3-variable map (s.12) | 2 rows × 4 columns. Row variable A (row 0, row 1); column pair BC, columns in Gray order **00, 01, 11, 10**. Diagonal corner label: row variable below-left, pair above-right |
| 3-variable cell indices | row 0: m0 m1 m3 m2; row 1: m4 m5 m7 m6 |
| 3-variable axis brackets | B over columns 11, 10; C under columns 01, 11; A beside row 1 |
| 4-variable map (s.43, s.49–50) | 4 × 4. Rows AB, columns CD, both Gray order 00, 01, 11, 10 |
| 4-variable cell indices | m0 m1 m3 m2 / m4 m5 m7 m6 / m12 m13 m15 m14 / m8 m9 m11 m10 |
| 4-variable axis brackets | C over columns 11, 10; D under columns 01, 11; B right of rows 01, 11; A left of rows 11, 10 |
| Index rule | m-index = binary of the variables in order, first variable MSB (row bits, then column bits) |
| Variable names | A, B, C(, D) or x, y, z / w, x, y, z (rows wx, columns yz on s.45, s.65, s.108–109) |
| Complement | Overbar on map, group and answer slides; prime on s.33–34, s.76–80 and s.88–91 |
| Cell entries | 1, 0, and lower-case italic **x** for don't-care (also on maps whose variables include x: s.103) |
| Group sizes | 8, 4, 2 or 1 adjacent ones; largest groups, fewest groups (s.22, s.41) |
| Adjacency | Includes wrap-around: end columns are adjacent (s.24); four corners form one group (s.53, s.66, s.83) |
| Reading a term | Keep only the variables constant over the group: 1 → plain, 0 → complemented; read from the axis brackets (s.13–18, s.54–61) |
| Answer form | One coloured term box per group, then F(…) = sum of the terms (s.25, s.31, s.38, s.75, s.87) |
| Context slides | s.1–2 title/contents; s.42–43, s.62 empty map templates; s.112 end |

## 1. Canonical recap — s.3–10 — WORKED (via Ch.2)
Same content and examples as `ch2.md` §12 (Ch2 p.69–76): canonical = SOP of minterms; classify
A′B + AB′ (yes), A′ + AB′ (no), xy + x′yz (no); method 1 (X + X′) and method 2 (truth table with
m column and ticks). Verified: A′ + AB′ = Σ(0,1,2); xy + x′yz = Σ(3,6,7) ✓. s.11: K-map minimises
a function; it needs canonical form first.

## 2. Map anatomy, minterm ↔ bits ↔ index — s.11–19, 49–66 — CORE
| Slides | Content | Verified |
|---|---|---|
| s.12, s.19 | 3-variable table (A, B, C, minterm, m) beside the map; each cell shows m-index and minterm | indices as in conventions ✓ |
| s.13–18 | region of one literal: A = row 1 (m4,5,7,6); B = cols 11,10 (m3,2,7,6); C = cols 01,11 (m1,3,5,7); C′ = cols 00,10; B′ = cols 00,01; A′ = row 0 | ✓ |
| s.50–53 | 4-variable table + map with minterms; single cells located: m15, m8; the four corners m0,2,8,10 and the pair m7,m15 | ✓ see owner note (s.50–62 table) |
| s.54–61 | literal regions: A = rows 11,10; A′ = rows 00,01; B = rows 01,11; B′ = rows 00,10; C = cols 11,10; C′ = cols 00,01; D = cols 01,11; D′ = cols 00,10 | ✓ see owner note (s.58) |

Group pictures (s.63–66), rule "group size ↔ variables left", each re-computed:

| Slide | Rule | Groups (minterms → term) |
|---|---|---|
| s.63 | 3-var: 4 ones → 1 variable | 4–7 → A; 0–3 → A′; 2,3,6,7 → B; 0,1,4,5 → B′; 0,2,4,6 (wrap) → C′ |
| s.64 | 3-var: 2 ones → 2 variables | 0,2 → A′C′; 5,7 → AC; 4,6 → AC′; 1,5 → B′C |
| s.65 (wx/yz) | 4-var: 8 ones → 1 variable | cols 00,01 → y′; rows 00,10 → x′; cols 00,10 → z′; rows 01,11 → x; rows 00,01 → w′; rows 11,10 → w |
| s.66 | 4-var: 4 ones → 2 variables | 0,1,4,5 → A′C′; corners 0,2,8,10 → B′D′; 0,2,4,6 → A′D′; 12–15 → AB; 0,1,8,9 → B′C′; 1,3,9,11 → B′D |

## 3. 3-variable maps and the procedure — s.20–41 — CORE
Procedure (s.22): 1 put F in canonical form; 2 draw the map; 3 write all ones and zeros;
4 group the most adjacent ones, sizes 8, 4, 2, 1; 5 write the expression. s.41: largest groups,
fewest groups.

| Slides | Input | Groups as drawn (order) | Answer | All minimal covers |
|---|---|---|---|---|
| s.20–25 Ex.1 | F(A,B,C) = Σ(3,4,6,7) | m3,m7 → BC; m4,m6 wrap → AC′ | BC + AC′ | unique ✓ |
| s.26–31 Ex.2 | F(x,y,z) = Σ(0,2,3,4,6) | m3,m2 → x′y; m0,m4,m2,m6 wrap quad → z′ | z′ + x′y | unique ✓ |
| s.32 | map only (no title): ones at m0,2,3,4,6,7 | — | not given | y + z′ (unique) |
| s.33–39 Ex.3 | F(x,y,z) = xy + x′y′z′ + x′yz′ | m0,m2 wrap → x′z′; m6,m7 → xy | x′z′ + xy | unique ✓ |
| s.40 | map only: ones at m1,2,3,4,6 | — | not given | x′z + xz′ + x′y; x′z + xz′ + yz′ |

Ex.3 expansion (s.34): xy(z + z′) + x′y′z′ + x′yz′ → xyz + xyz′ + x′y′z′ + x′yz′ → each term
written as bits 111, 110, 000, 010 → Σ(0,2,6,7) ✓.

## 4. Exercises 3-variable — s.44–48, 92–95 — PRACTICE
No slide answer unless stated; answers machine-worked. s.44, s.45, s.48 are 4-variable maps.

| Slide | Map (variables) | Minterms | All minimal covers |
|---|---|---|---|
| s.44 | AB/CD | Σ(3,5,8,9,10,11,12,13,14,15) | A + BC′D + B′CD |
| s.45 | wx/yz | Σ(1,3,5,8,9,10,11,12,13,14) | wz′ + x′z + y′z |
| s.46 | xyz, handwritten solution | Σ(0,1,2,4,6,7) | z′ + x′y′ + xy (= slide ✓) |
| s.47 | xyz, handwritten solution | Σ(0,1,4,6,7) | x′y′ + xy + y′z′ (= slide ✓); x′y′ + xy + xz′ |
| s.48 | AB/CD, handwritten solution | Σ(0,1,5,7,10,11,13,14,15) | BD + AC + A′B′C′ (= slide ✓) |
| s.92 | ABC | Σ(0,2,4,5,6,7) | A + C′ |
| s.93 | ABC | Σ(2,4,6,7) | AB + AC′ + BC′ |
| s.94 | xyz | Σ(0,1,3,5,7) | z + x′y′ |
| s.95 | xyz | empty map, no data | see owner note |

s.48 also writes the group sizes 8, 4, 2, 1 next to the Σ.

## 5. 4-variable maps — s.67–75 — CORE
Input F(A,B,C,D) = Σ(0,2,3,5,7,8,9,10,11,13,15) (s.67). Method: truth table A, B, C, D, F
(s.68), m column added and 1-rows marked (s.69), each F value copied into its cell (s.70), then
four quads.

| Groups as drawn (order) | Term |
|---|---|
| row 10 (m8,9,11,10) | AB′ |
| m5,7,13,15 | BD |
| column 11 (m3,7,15,11) | CD |
| corners m0,2,8,10 | B′D′ |

Answer F = AB′ + BD + CD + B′D′ ✓. **Four** minimal covers (all 4 terms, 8 literals):
AB′ + BD + B′D′ + CD; AB′ + BD + B′D′ + B′C; AD + BD + B′D′ + CD; AD + BD + B′D′ + B′C.

## 6. Expression → map — s.76–87 — CORE
| Step | Content | Verified |
|---|---|---|
| s.76 | F(A,B,C,D) = A′B′C′ + B′CD′ + A′BCD′ + AB′C′ (not canonical) | — |
| s.77–79 | each missing variable X multiplied by (X + X′), colour per term; 7 minterm products | each line ✓ |
| s.80 | Σ(0,1,2,6,8,9,10) | ✓ |
| s.81–82 | map filled from the Σ | ✓ |
| s.83–87 | groups: corners → B′D′; m0,1,8,9 → B′C′; m2,m6 → A′CD′ | |

Answer F = B′C′ + A′CD′ + B′D′ ✓, unique minimal cover.

## 7. Same function by algebra — s.88–91 — WORKED
Same F as §6. Lines (each verified equivalent to the input):

| Line | Step (implicit on slide) |
|---|---|
| B′(A′C′ + CD′ + AC′) + A′BCD′ | factor B′ |
| B′(CD′ + C′(A + A′)) + A′BCD′ | factor C′ |
| B′(CD′ + C′) + A′BCD′ | A + A′ = 1 |
| B′(C′ + D′) + A′BCD′ | C′ + CD′ = C′ + D′ |
| B′C′ + B′D′ + A′BCD′ | distribute |
| B′C′ + D′(B′ + A′BC) | factor D′ |
| B′C′ + D′(B′ + A′C) | B′ + BX = B′ + X |
| **B′C′ + B′D′ + A′CD′** | distribute; same as the map ✓ |

## 8. Don't-cares and exercises — s.96–111 — CORE / PRACTICE
Method (s.97–101): x cells may be grouped as 1 or left as 0, whichever makes larger/fewer
groups; the slide marks each x as taken (1) or not (0). Example (s.96–97):
F(A,B,C) = (1,5,7), d(A,B,C) = (0,3,6) — see owner note (s.96).

| Slide | Map | Minterms | Don't-cares | All minimal covers |
|---|---|---|---|---|
| s.97–101 | ABC | 1, 5, 7 | 0, 3, 6 | **C** (m3 used as 1; m0, m6 as 0) = slide ✓, unique |
| s.102 | ABC | 2, 4, 6, 7 | 1, 5 | A + BC′ |
| s.103 | xyz | 1, 4, 5, 6, 7 | 3 | x + z |
| s.104 | xyz | empty map | — | see owner note |
| s.105 | AB/CD | 1, 3, 8, 9, 10, 11, 12, 14, 15 | 0, 6, 7, 13 | A + B′D |
| s.106 | AB/CD | 1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14 | 0, 13 | **six**, all 4 terms / 9 literals: AB′ + AD′ + A′BC + A′D; AD′ + A′BC + A′D + B′D; AB′ + AC′ + A′D + BCD′; AB′ + AD′ + A′D + BCD′; AD′ + A′D + BCD′ + B′D; AD′ + A′BC + B′D + C′D |
| s.107 | AB/CD | 3, 4, 6, 7, 8, 9, 11, 12, 14, 15 | 0, 1, 5 | BC + B′D + C′D′; BD′ + B′C′ + CD |
| s.108 | wx/yz | 0, 1, 2, 3, 5, 8, 9, 10, 11, 12, 14 | 6 | x′ + wz′ + w′y′z (see owner note; same answer either way) |
| s.109 | wx/yz, handwritten solution | 0, 2, 4, 6, 8, 10, 11, 13, 14, 15 | — | x′z′ + w′z′ + wxz + wy (= slide groups ✓), unique |
| s.110, s.111 | xyz; AB/CD | empty maps | — | see owner note |

## Terminology variants
"Karnaugh map (K-Map)"; "Canonical Form" and "Standard Form" for the same thing (s.5); "Don't Care
Condition", d(…) list, x in cells; group sizes said as "number of ones"; "adjacent" includes
squares that do not touch (s.24); answer boxes coloured like their groups.
