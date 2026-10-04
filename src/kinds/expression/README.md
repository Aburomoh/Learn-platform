# expression

A Boolean expression typed by the student (#219), graded by meaning with the Boolean module.

- The function: `target` (an expression) or `minterms` + `dontCares`, over `vars` (first variable =
  most significant bit, as in Σ notation). Letters match `vars` in any case (#258).
- Right when the answer gives the function on every row that is not a don't-care, has the asked
  `form` (`sop`, `pos` or `any`) and at most `maxLiterals` literals.
- The right function in the wrong form or not simplified is **not** counted as correct, and gets its
  own nudge: `expression-wrong-form`, `expression-not-simplified`.
- Wrong answers: `expression-complement` (F′ written for F), `expression-and-or-swapped`; text that
  does not parse or uses another variable: `expression-unreadable` (never throws).
- Answer `{ kind: "expression", text }`; `normalized` is the answer in course notation. Single goal.

**Status:** spec, grading and tests. The view (field + key row, "Reads as" preview, UX §3) and the
three registry lines come from Frontend.
