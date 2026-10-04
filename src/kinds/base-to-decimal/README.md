# base-to-decimal

A binary, octal, decimal or hex number (with an optional point) to decimal by place value (#208),
in the three lines the Chapter 1 slides write (content pack ch1 §1–3, §7):

1. **weights**: the power under each digit, left to right (2, 1, 0, −1, −2, −3). Answer `powers`.
2. **terms**: each digit × weight as a decimal, a hex letter by its value (A = 10). Answer `terms`.
3. **sum**: the decimal value. Answer `sum`.

- Exact: terms and sums are computed with BigInt (bases 2, 8, 10, 16 always terminate), and student
  decimals are compared after `normaliseDecimal` ("05.50" = "5.5", ".5" = "0.5").
- Spec: `base` 2 | 8 | 10 | 16 and `number` (≤ 6 digits before the point, ≤ 3 after, uppercase hex).
- Detectors: `weights-reversed`, `negative-powers-wrong`, `hex-letter-as-digit` (A as 1 … F as 6, or 0).
- Wrong weights or terms set `wrongCells` (first wrong position, count), as in the truth table.
- Step vars: `number`, `base`, `digitCount`, `terms` ("(1 × 2^2) + …"), `values`, `value`, `stepNumber`.

**Status:** spec, grading, step contract and tests. The view (weight diagram: arrows from each digit
to its weight, then the expansion and value lines) and the three registry lines come from Frontend.
