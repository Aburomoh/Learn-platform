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

## View (`ui.tsx`, `../shared/ExpressionEntry.tsx`, also used by the K-map)

- A text field in mono; students type the prime (`'`), which any keyboard has. `.` and `*` work
  for AND. Under it, "Reads as" draws the expression as on the slides: an overbar for each
  complement, AND as juxtaposition (`renderBool`). Text that does not parse yet shows "…".
- A key row (48 px): the question's variables, then `'` `+` `⊕` `(` `)` and delete, as operator
  keys with names ("complement (NOT)", "OR"…). Keys insert at the cursor. Shown on desktop too.
- Check sends the text; grading is by meaning (`logic.ts`). The last text stays in the field.
- Explain Slowly stage: `expression` = the line shown so far, read-only with its reading.

**Status:** spec, grading, tests and the view (UX §3); registered.
