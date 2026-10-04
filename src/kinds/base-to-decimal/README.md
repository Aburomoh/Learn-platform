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

## View (`ui.tsx`, `WeightDiagram.tsx`)

- The slides' weight diagram: the digits boxed in a row around the point; under each digit its
  weight (base with the power as a superscript) and its term; then the sum line.
- One goal at a time: the powers (a small field in the superscript; the true minus sign is
  accepted), then the terms, then the sum. Done rows show their values, the current row has
  the halo, later rows are dim. After a wrong check only `wrongCells.first` is marked and focused.
- Finished: (number)<sub>base</sub> = (value)<sub>10</sub>.
- Explain Slowly stage: `revealed` = goals shown done (0 to 3).
- A long number scrolls inside its well with a fade edge.

**Status:** spec, grading, tests and the view; registered.
