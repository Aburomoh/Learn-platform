# Content pack — ECET 111 Chapter 1: gaps only (#311)

Source: Ch.1 deck (pptx, 76 slides; Tier-1, not in the repo). References are slides (`Ch1 s.N`).
Restated, never quoted. Scope: the Chapter 1 rows of `docs/COVERAGE_ECET111.md` marked MISSING or
PARTIAL; the COMPLETE rows (decimal → binary, addition, complements, subtraction, exercises) are
not repeated. Every slide answer and every fresh set below was re-computed by script (weights
summed exactly; groupings rebuilt and checked back to decimal). Fresh sets avoid the slide numbers,
the numbers in `src/content/ecet111/chapter1/`, and 45 / 53 (owner rule: three, sometimes four
sets per question).

## Deck-wide conventions
| Item | As taught |
|---|---|
| Base mark | Parentheses with the base as subscript: ( 101.101 )2, ( 1A3 )16; the answer also carries it, ( 5.625 )10 |
| Weight diagram | Digits written as X X X • X X X; an arrow drops from each digit to its weight, longer arrows further from the point; the digit sits boxed beside its arrow (s.9, s.12, s.18, s.26) |
| Expansion line | Terms MSB first, each in its own parentheses: ( d × base^power ), joined by +; powers count down through 0 to −1, −2, −3 |
| Value line | Second line lists each term's value in the same order (zero terms kept as 0), third line the sum; s.26 skips the value line |
| Point name | "Decimal Point" (s.9), "Binary Point" (s.12); octal/hex slides do not name it |
| Digit tables | Octal 0–7 with 3-bit binary (s.21, beside the rule); hex table Decimal / Hexadecimal / Binary, 0–15, 4-bit binary (s.24–25) |
| Rule box | Each conversion slide states a one-line "Rule :" then one "Example :" |
| Check-back | A decimal check value under the binary answer (s.21, s.28); the s.38 / s.44 checks write terms LSB first: d0 × b^0 + d1 × b^1 |
| Context slides | s.16 title only; s.20 see owner note |

## 1. Decimal place value — s.8–10 — CORE
s.8: digits 0–9, weight = power of 10. s.9: (543.451)10 on the weight diagram, 10^2 … 10^−3.
s.10: (5 × 10^2) + (4 × 10^1) + (3 × 10^0) + (4 × 10^−1) + (5 × 10^−2) + (1 × 10^−3)
= 500 + 40 + 3 + 0.4 + 0.05 + 0.001 = 543.451 ✓.

Fresh sets (3 integer + 3 fraction digits, as on the slide):

| Number | Term values (MSB → LSB) | Sum |
|---|---|---|
| 276.384 | 200 + 70 + 6 + 0.3 + 0.08 + 0.004 | 276.384 ✓ |
| 908.125 | 900 + 0 + 8 + 0.1 + 0.02 + 0.005 | 908.125 ✓ |
| 731.062 | 700 + 30 + 1 + 0 + 0.06 + 0.002 | 731.062 ✓ |
| 615.907 | 600 + 10 + 5 + 0.9 + 0 + 0.007 | 615.907 ✓ |

## 2. Binary → decimal, with fraction — s.11–13 — CORE
s.11: digits 0, 1; weight = power of 2. s.12: (101.101)2 on the diagram, 2^2 … 2^−3.
s.13: (1 × 2^2) + (0 × 2^1) + (1 × 2^0) + (1 × 2^−1) + (0 × 2^−2) + (1 × 2^−3)
= 4 + 0 + 1 + 0.5 + 0 + 0.125 = (5.625)10 ✓.

| Number | Term values | Answer |
|---|---|---|
| (110.011)2 | 4 + 2 + 0 + 0 + 0.25 + 0.125 | (6.375)10 ✓ |
| (111.001)2 | 4 + 2 + 1 + 0 + 0 + 0.125 | (7.125)10 ✓ |
| (100.110)2 | 4 + 0 + 0 + 0.5 + 0.25 + 0 | (4.75)10 ✓ |
| (110.101)2 | 4 + 2 + 0 + 0.5 + 0 + 0.125 | (6.625)10 ✓ |

## 3. Octal → decimal, with fraction — s.16–19 — CORE
s.17: digits 0–7; weight = power of 8. s.18: (124.160)8 on the diagram. s.19:
(1 × 8^2) + (2 × 8^1) + (4 × 8^0) + (1 × 8^−1) + (6 × 8^−2) + (0 × 8^−3)
= 64 + 16 + 4 + 0.125 + 0.09375 + 0 = (84.21875)10 ✓. The trailing 0 digit is kept as a term.

| Number | Term values | Answer |
|---|---|---|
| (263.540)8 | 128 + 48 + 3 + 0.625 + 0.0625 + 0 | (179.6875)10 ✓ |
| (317.420)8 | 192 + 8 + 7 + 0.5 + 0.03125 + 0 | (207.53125)10 ✓ |
| (106.350)8 | 64 + 0 + 6 + 0.375 + 0.078125 + 0 | (70.453125)10 ✓ |
| (452.610)8 | 256 + 40 + 2 + 0.75 + 0.015625 + 0 | (298.765625)10 ✓ |

## 4. Octal → binary by digit replacement — s.21 — CORE
Rule: replace each octal digit by its 3-bit binary (table 0–7 beside the rule). Example
(246)8 = ( 010 100 110 )2 = (10100110)2: groups written spaced and in full, then joined with the
leading 0 dropped; check (10100110)2 = 166 ✓.

| Octal | Groups | Answer | Check |
|---|---|---|---|
| (351)8 | 011 101 001 | (11101001)2 | 233 ✓ |
| (172)8 | 001 111 010 | (1111010)2 | 122 ✓ |
| (605)8 | 110 000 101 | (110000101)2 | 389 ✓ |
| (437)8 | 100 011 111 | (100011111)2 | 287 ✓ |

## 5. Binary → octal, groups of 3, binary point — s.22 — CORE (point: WORKED)
Rule: each 3-bit group is replaced by its octal digit. Groups are formed outward from the point:
leftward for the whole part (pad zeros on the far left), rightward for the fraction (pad zeros on
the far right). Example (10101011.1)2 = ( 010 101 011 . 100 )2 = (253.4)8 ✓ (both 171.5).
Layout: brace under each group, arrow down to its digit, point kept in line.

| Binary | Groups | Answer | Check (decimal) |
|---|---|---|---|
| (11010110.1)2 | 011 010 110 . 100 | (326.4)8 | 214.5 ✓ |
| (1110001.11)2 | 001 110 001 . 110 | (161.6)8 | 113.75 ✓ |
| (10011101.01)2 | 010 011 101 . 010 | (235.2)8 | 157.25 ✓ |
| (110111.101)2 | 110 111 . 101 (no padding) | (67.5)8 | 55.625 ✓ |

## 6. Hex digits and 0–15 table — s.23–25 — CORE
s.23: digits 0–9, A–F; weight = power of 16. s.24: table Decimal / Hexadecimal / Binary, 0–15,
binary always 4 bits. s.25: same table with the row 10 / A / 1010 highlighted (A = 10).

| Hex | Decimal | 4-bit binary |
|---|---|---|
| B | 11 ✓ | 1011 ✓ |
| E | 14 ✓ | 1110 ✓ |
| C | 12 ✓ | 1100 ✓ |
| 9 | 9 ✓ | 1001 ✓ (digit, not letter) |

## 7. Hex → decimal — s.26 — CORE
(1A3)16 on the diagram, 16^2 … 16^0. The letter is written as its value inside the term:
(1 × 16^2) + (10 × 16^1) + (3 × 16^0) = (419)10 ✓ (256 + 160 + 3; value line not shown).

| Hex | Term values | Answer |
|---|---|---|
| (2C5)16 | 512 + 192 + 5 | (709)10 ✓ |
| (3E1)16 | 768 + 224 + 1 | (993)10 ✓ |
| (1B7)16 | 256 + 176 + 7 | (439)10 ✓ |
| (2F4)16 | 512 + 240 + 4 | (756)10 ✓ |

## 8. Hex → binary by digit replacement — s.27–28 — CORE
Rule: replace each hex digit by its 4-bit binary. s.28: (1A3)16 = ( 0001 1010 0011 )2, each digit
written under its group (the 1 → 0001 pair boxed), then (110100011)2 with leading zeros dropped;
check = 419 ✓.

| Hex | Groups | Answer | Check |
|---|---|---|---|
| (2D6)16 | 0010 1101 0110 | (1011010110)2 | 726 ✓ |
| (1E9)16 | 0001 1110 1001 | (111101001)2 | 489 ✓ |
| (3B4)16 | 0011 1011 0100 | (1110110100)2 | 948 ✓ |
| (5C1)16 | 0101 1100 0001 | (10111000001)2 | 1473 ✓ |

## 9. Binary → hex, groups of 4 (16-bit) — s.29–30 — CORE
Rule: each 4-bit group is replaced by its hex digit. Example input is 16 bits already spaced in
fours: (1101 0111 1111 1000)2 = (D7F8)16 ✓ (55288). Same brace-and-arrow layout as s.22. Grouping
from the right with left padding is shown in the chain s.37 / s.43 (padding zeros in red).

| Binary | Answer | Check |
|---|---|---|
| 1011 0110 1110 0011 | (B6E3)16 | 46819 ✓ |
| 1110 1001 0101 1100 | (E95C)16 | 59740 ✓ |
| 1001 1111 0010 1011 | (9F2B)16 | 40747 ✓ |
| 0111 1100 1010 0110 | (7CA6)16 | 31910 ✓ |

## 10. Check an octal/hex answer in decimal — s.38, s.44 — CORE
After the chain decimal → binary → octal → hex, a "Check" box rebuilds the decimal from each
answer, terms LSB first: (24)16 = 4 × 16^0 + 2 × 16^1 = 4 + 32 = (36)10; (44)8 = 4 × 8^0 + 4 × 8^1
= 4 + 32 = (36)10 (s.38). s.44: (2A)16 = A × 16^0 + 2 × 16^1 = 10 + 32 = (42)10; (52)8 = 2 × 8^0
+ 5 × 8^1 = 2 + 40 = (42)10. All ✓. The letter stays a letter in the term (A × 16^0), unlike s.26.

| Decimal | Binary | Octal check | Hex check |
|---|---|---|---|
| 58 | 111010 | (72)8 = 2 + 56 = 58 ✓ | (3A)16 = 10 + 48 = 58 ✓ |
| 61 | 111101 | (75)8 = 5 + 56 = 61 ✓ | (3D)16 = 13 + 48 = 61 ✓ |
| 46 | 101110 | (56)8 = 6 + 40 = 46 ✓ | (2E)16 = 14 + 32 = 46 ✓ |
| 57 | 111001 | (71)8 = 1 + 56 = 57 ✓ | (39)16 = 9 + 48 = 57 ✓ |

## Terminology variants
Weight (power of the base); "Base 10" with the base also as subscript; "3-bits" / "4-bits" binary;
"Hexadecimal" (never "hex" on the slides); "Number-Base Conversions" (chain slides); MSB / LSB
spelled out on s.15; "Check" (s.21, s.28, s.38, s.44).
