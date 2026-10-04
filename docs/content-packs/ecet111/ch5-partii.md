# Content pack — ECET 111 Chapter 5 Part II: Analysis of clocked sequential circuits (#286)

Source: Ch.5 Part II deck (pptx, 55 slides; Tier-1, not in the repo). References are slides
(`Ch5-II s.N`). Restated, never quoted. Every state table below was re-computed by simulating the
flip-flop input equations through the characteristic equations (own script); every state-equation
line was checked with `src/content/boolean/` (`equivalent`, `mintermsOf`). Rows match the Ch.5
Part II rows of `docs/COVERAGE_ECET111.md` (§1–5: "Analysis: D, JK, T, 3-flip-flop"; §6: "Analysis exercises"). Notation: this pack writes `'` for complement.

## Deck-wide conventions
| Item | As taught |
|---|---|
| Characteristic equations (s.4–7, repeated s.34–36) | D: Q(t+1) = D. T: Q(t+1) = T ⊕ Q = T′Q + TQ′ (T = 0 no change, 1 complement). JK: Q(t+1) = JQ′ + K′Q (00 no change, 10 → 1, 01 → 0, 11 toggle) |
| Clock | Positive edge (triangle at Clk, no bubble); s.5 shows the negative-edge symbol (bubble before the triangle) for contrast. Problems carry a "Positive Edge" tag |
| Stages, in order | 1 flip-flop input equations read from the circuit; 2 state equations by substituting them into the characteristic equation; 3 state table; 4 state diagram; (3-flip-flop example) 5 timing diagram |
| State-table column order | **Present State** (A B [C]) · **Input** (x) · **Flip-flop Inputs** (JA KA JB KB [JC KC] or TA TB) · **Next State** (A B [C]) · **Output** (y). D circuits have no flip-flop-input group |
| Row order | Present state then input counted in binary, input as LSB (000, 001, …) |
| Filling order | Present state + input first, then the flip-flop inputs (per flip-flop: J then K, or T), then the next state, the output last |
| Reduced table | After the full table, the JK examples repeat it with only Present State, Input, Next State (and Output) as the source of the diagram (s.23, s.49) |
| State diagram | One circle per state, labelled with its bits (00, 01 …); one arrow per table row from present to next state; self-loop when they are equal. Edge label **input/output** (x/y) when there is an output (s.13); input only when there is none (s.22) |
| Time notation | D example writes A(t+1) = A(t)x(t) + … with explicit (t); later examples drop it |
| Context slides | s.1–3 title, contents, part title; s.55 end |

## 1. Flip-flop recap — s.4–7, s.34–36 — CORE (recap of Part I)
| Slides | Flip-flop | Table as drawn | Equation |
|---|---|---|---|
| s.4–5, s.35 | D | columns D, CLK, Q: D = 0 → 0, 1 → 1 on the rising edge | Q(t+1) = D |
| s.6, s.36 | T | columns T, Q(t+1): 0 → Q(t) no change, 1 → Q′(t) complement | Q(t+1) = T ⊕ Q = TQ′ + T′Q |
| s.7, s.34 | JK | columns J, K, CLK, Q: 00 → Q0 no change, 10 → 1, 01 → 0, 11 → Q0′ toggles | Q(t+1) = JQ′ + K′Q |

## 2. Analysis with D flip-flops — s.8–13 — CORE (WORKED)
Circuit (s.8–9, textbook pp.205–208): input x; D of A = OR(AND(A, x), AND(B, x)); D of B =
AND(A′, x); output y = AND(OR(A, B), x′). Task: state table and state diagram.

| Stage | Result | Verified |
|---|---|---|
| State equations (s.10) | A(t+1) = Ax + Bx; B(t+1) = A′x; y = (A + B)x′ | Σ(A,B,x): A+ (3,5,7), B+ (1,3), y (2,4,6) ✓ |
| State table (s.11–12) | columns A B · x · A B · y | simulation = slide ✓ |
| State diagram (s.13) | edges below, labels x/y | = slide ✓ |

| A B x | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| Next A B | 00 | 01 | 00 | 11 | 00 | 10 | 00 | 10 |
| y | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 0 |

Edges: 00 –0/0→ 00, 00 –1/0→ 01; 01 –0/1→ 00, 01 –1/0→ 11; 10 –0/1→ 00, 10 –1/0→ 10;
11 –0/1→ 00, 11 –1/0→ 10.

## 3. Analysis with JK flip-flops — s.14–23 — CORE (WORKED)
s.14–15 pose the task (state equations, table, diagram) on a circuit with output z; s.16–23 solve
a different circuit (textbook pp.212–215) — see owner note. Both are given.

**Solved circuit (s.16–23):** input x, no output; JA = B, KA = AND(B, x′), JB = x′, KB = XOR(A, x).

| Stage | Result | Verified |
|---|---|---|
| Characteristic eqs (s.16) | A(t+1) = JA′ + K′A; B(t+1) = JB′ + K′B | — |
| Input equations (s.17) | JA = B, KA = Bx′, JB = x′, KB = A′x + Ax′ = A ⊕ x | ✓ |
| A(t+1) (s.17) | BA′ + (Bx′)′A = **A′B + AB′ + Ax** | equivalent ✓, Σ(2,3,4,5,7) |
| B(t+1) (s.17) | x′B′ + (A ⊕ x)′B = **B′x′ + ABx + A′Bx′** | equivalent ✓, Σ(0,2,4,7) |
| State table (s.18–21) | columns A B · x · JA KA JB KB · A B | simulation = slide ✓ |
| Reduced table, diagram (s.22–23) | states named S0 = 00, S1 = 01, S2 = 10, S3 = 11; labels x only | = slide ✓ |

| A B x | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| JA KA | 00 | 00 | 11 | 10 | 00 | 00 | 11 | 10 |
| JB KB | 10 | 01 | 10 | 01 | 11 | 00 | 11 | 00 |
| Next A B | 01 | 00 | 11 | 10 | 11 | 10 | 00 | 11 |

Edges: 00 –0→ 01, 00 –1→ 00; 01 –0→ 11, 01 –1→ 10; 10 –0→ 11, 10 –1→ 10; 11 –0→ 00, 11 –1→ 11.

**Posed circuit (s.14–15), no slide solution, machine-worked:** JA = AND(B, x), KA = B,
JB = XOR(x′, A), KB = A, z = OR(A′, x). A(t+1) = A′Bx + AB′ (Σ 3,4,5); B(t+1) = (x′ ⊕ A)B′ + A′B
(Σ 0,2,3,5). Edges (x/z): 00 –0/1→ 01, 00 –1/1→ 00; 01 –0/1→ 01, 01 –1/1→ 11; 10 –0/0→ 10,
10 –1/1→ 11; 11 –0/0→ 00, 11 –1/1→ 00.

## 4. Analysis with T flip-flops — s.24–30 — CORE (WORKED)
Circuit (s.24): input x; TA = AND(x, B), TB = x, output y = AND(A, B); both flip-flops have an
active-low reset R (CONTEXT). Characteristic equation boxed first (s.24).

| Stage | Result | Verified |
|---|---|---|
| Input/output equations (s.25) | TA = Bx, TB = x, y = AB | — |
| A(t+1) (s.25) | (Bx)′A + (Bx)A′ = **AB′ + Ax′ + A′Bx** | equivalent ✓, Σ(3,4,5,6) |
| B(t+1) (s.25) | **x ⊕ B** | ✓, Σ(1,2,5,6) |
| State table (s.26–30) | columns A B · x · TA TB · A B · Y | simulation = slide ✓ |
| State diagram | not on the slides | machine-worked below |

| A B x | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| TA TB | 00 | 01 | 00 | 11 | 00 | 01 | 00 | 11 |
| Next A B | 00 | 01 | 01 | 10 | 10 | 11 | 11 | 00 |
| Y | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |

Edges (x/Y): 00 –0/0→ 00, –1/0→ 01; 01 –0/0→ 01, –1/0→ 10; 10 –0/0→ 10, –1/0→ 11;
11 –0/1→ 11, –1/1→ 00. Y depends on the state only (counts up on x = 1, Y = 1 in state 11).

## 5. Three JK flip-flops — s.37–52 — CORE (WORKED)
Circuit (s.37): input x, flip-flops A, B, C, output y; JA = x′, KA = B, JB = AND(A, x), KB = C,
JC = A, KC = x, y = OR(B′, x). s.37 shows blank J/K/y lines to fill.

| Stage | Result | Verified |
|---|---|---|
| Input equations (s.38–39) | JA = x′, KA = B; JB = xA, KB = C; JC = A, KC = x; y = x + B′ | read from circuit ✓ |
| A(t+1) (s.39) | JA′ + K′A = **x′A′ + AB′** | ✓, Σ(A,B,C,x) 0,2,4,6,8,9,10,11 |
| B(t+1) (s.39) | JB′ + K′B = **xAB′ + BC′** | ✓, Σ 4,5,9,11,12,13 |
| C(t+1) (s.39) | JC′ + K′C = **AC′ + x′C** | ✓, Σ 2,6,8,9,10,12,13,14 |
| State table (s.40–48) | columns A B C · x · JA KA JB KB JC KC · A B C · y | simulation = slide ✓ |
| Reduced table (s.49) | A B C · x · A B C · y | ✓ |
| State diagram (s.51) | edges below | see owner note (s.51) |
| Timing diagram (s.52) | x at the rising edges: 0 1 1 1 1 0 0 0 1 1; A, B, C, y to draw | see owner note |

| A B C x | JA KA | JB KB | JC KC | Next A B C | y |
|---|---|---|---|---|---|
| 0000 | 10 | 00 | 00 | 100 | 1 |
| 0001 | 00 | 00 | 01 | 000 | 1 |
| 0010 | 10 | 01 | 00 | 101 | 1 |
| 0011 | 00 | 01 | 01 | 000 | 1 |
| 0100 | 11 | 00 | 00 | 110 | 0 |
| 0101 | 01 | 00 | 01 | 010 | 1 |
| 0110 | 11 | 01 | 00 | 101 | 0 |
| 0111 | 01 | 01 | 01 | 000 | 1 |
| 1000 | 10 | 00 | 10 | 101 | 1 |
| 1001 | 00 | 10 | 11 | 111 | 1 |
| 1010 | 10 | 01 | 10 | 101 | 1 |
| 1011 | 00 | 11 | 11 | 110 | 1 |
| 1100 | 11 | 00 | 10 | 011 | 0 |
| 1101 | 01 | 10 | 11 | 011 | 1 |
| 1110 | 11 | 01 | 10 | 001 | 0 |
| 1111 | 01 | 11 | 11 | 000 | 1 |

Edges (x/y, machine-worked): 000 –0/1→ 100, –1/1→ 000; 001 –0/1→ 101, –1/1→ 000;
010 –0/0→ 110, –1/1→ 010; 011 –0/0→ 101, –1/1→ 000; 100 –0/1→ 101, –1/1→ 111;
101 –0/1→ 101, –1/1→ 110; 110 –0/0→ 011, –1/1→ 011; 111 –0/0→ 001, –1/1→ 000.

Timing (machine-worked, assuming start 000): state before each of the 10 edges 000, 100, 111,
000, 000, 000, 100, 101, 101, 110; after the last edge 011. y = x + B′ stays 1 throughout (B = 1
only while x = 1).

## 6. Analysis exercises — s.31–33, s.53–54 — PRACTICE
No slide answers; all machine-worked (tables by simulation, equations ✓ with the module).

| Slide | Given | Asked | Answer |
|---|---|---|---|
| s.31 (textbook 5.6) | D flip-flops A, B; inputs x, y; A(t+1) = xy′ + xB, B(t+1) = xA + xB′, z = A | logic diagram, state table, diagram | DA = OR(AND(x, y′), AND(x, B)); DB = OR(AND(x, A), AND(x, B′)); z wired from A. Table and edges below |
| s.32–33 (textbook 5.9) | JK; JA = x, KA = B, JB = x, KB = A′; s.33 gives the empty table A B · x · JA KA JB KB · A B | state equations, diagram | A(t+1) = xA′ + AB′ (Σ 1,3,4,5); B(t+1) = xB′ + AB (Σ 1,5,6,7). Edges: 00 –0→ 00, –1→ 11; 01 –0→ 00, –1→ 10; 10 –0→ 10, –1→ 11; 11 –0→ 01, –1→ 01 |
| s.53 | T flip-flops A, B; input x; TA = xBA′, TB = x + A, Y = x ⊕ A | logic diagram, state equations, table, diagram | A(t+1) = A + xB (Σ 3,4,5,6,7); B(t+1) = (x + A) ⊕ B = A′Bx′ + AB′ + xB′ (Σ 1,2,4,5). Edges (x/Y): 00 –0/0→ 00, –1/1→ 01; 01 –0/0→ 01, –1/1→ 10; 10 –0/1→ 11, –1/0→ 11; 11 –0/1→ 10, –1/0→ 10 |
| s.54 (textbook 5.8) | Circuit, no input: TA = OR(A, B), TB = OR(A′, B); B′ unused | state table, diagram, function | A(t+1) = A′B, B(t+1) = A′B′. 00 → 01 → 10 → 00 (count 0, 1, 2 repeatedly: modulo-3 counter); unused 11 → 00 |

s.31 state table (A B x y → next A B; z = A): z = 0 for AB = 00, 01 and 1 for 10, 11.

| Present A B | xy = 00 | 01 | 10 | 11 |
|---|---|---|---|---|
| 00 | 00 | 00 | 11 | 01 |
| 01 | 00 | 00 | 10 | 10 |
| 10 | 00 | 00 | 11 | 01 |
| 11 | 00 | 00 | 11 | 11 |

s.32 table rows (A B x: JA KA JB KB → A B): 000: 0001 → 00; 001: 1011 → 11; 010: 0101 → 00;
011: 1111 → 10; 100: 0000 → 10; 101: 1010 → 11; 110: 0100 → 01; 111: 1110 → 01.

s.53 table rows (A B x: TA TB → A B, Y): 000: 00 → 00, 0; 001: 01 → 01, 1; 010: 00 → 01, 0;
011: 11 → 10, 1; 100: 01 → 11, 1; 101: 01 → 11, 0; 110: 01 → 10, 1; 111: 01 → 10, 0.

s.54 table (A B: TA TB → A B): 00: 01 → 01; 01: 11 → 10; 10: 10 → 00; 11: 11 → 00.

## Terminology variants
"State Equations" also "next-state equations" and "flip-flop input equations" (problems);
"Flip-flop Inputs" and "Flip-flops Inputs" headers; output named y, Y or z; complement as prime and
as overbar (s.53); "Drive" (slide spelling) for derive (s.53); S0–S3 state names (s.22–23);
gate symbols on s.14–15 and s.37–39 carry a hysteresis mark inside the inverter and AND gate and
are read as ordinary gates.
