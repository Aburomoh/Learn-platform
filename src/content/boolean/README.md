# Boolean module (`src/content/boolean/`)

Course truth for Chapters 2–5 (#197): every truth table, minterm list and simplified form is
computed from an expression, never typed in by hand. Pure functions, no dependency.

| Need | Function |
|---|---|
| Read an expression | `parseBool("AB' + C")`; extra names such as `Ci`: `parseBool(text, ["Ci"])` |
| Value / table | `evaluate(e, env)`, `truthTable(e, vars)` (first variable = MSB, so m0 = A'B'C') |
| Minterms | `mintermsOf(e, vars)`, `sigma([..], dc)` → `Σ(1, 5, 7) + d(0, 3, 6)`, `parseSigma(text)` |
| Same function? | `equivalent(a, b)` over the union of variables |
| Form and size | `isSOP`, `isPOS`, `literalCount`, `formatBool` |
| Simplest SOP | `minimalCovers(n, minterms, dc)` (all minimal covers), `minimalSOP(vars, minterms, dc)` |

Notation: `'` complement, implicit AND or `·`, `⊕`, `+`, `0`/`1`, parentheses. Precedence, tightest
first: `'` → AND → `⊕` → `+`.

Minimal means fewest terms, then fewest literals. A K-map can have several minimal groupings, so
grade a student's answer against `minimalCovers`, never one authored answer (#131 review).

Tests: every 2-variable function with every don't-care pattern, every 3-variable function, and
sampled 3- and 4-variable functions are checked against an independent brute-force search; the
Chapter 2–3 examples are restated (not quoted) and pinned.
