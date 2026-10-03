# DivisionChain

Repeated division by 2, one checked step at a time, as the vertical ladder drawn in class (ECET 111
Chapter 1): numbers go down the page with `2 |` on the left, each remainder sits beside its number
(first remainder = LSB at the top, last = MSB at the bottom).

```tsx
<DivisionChain id="q" steps={spec.steps} stepIndex={done}
  onStep={(q, r) => submit({ kind: "repeated-division", step: done, quotient: q, remainder: r })}
  state={lastWrong ? "incorrect" : "idle"} />
<DivisionChain id="q" steps={steps} stepIndex={steps.length} showOrder />   // completed, read-off
<DivisionChain id="q" steps={steps} stepIndex={2} attention={2} />          // explanation, read-only
```

- Rows appear one at a time, so the chain length is never given away.
- The student types the result in the next row down and the remainder beside the current number,
  then "Check step" or Enter. Tab order: result, remainder, Check. Digits only; the remainder is a single digit.
- Remount (change `key`) when `stepIndex` advances to clear the inputs; on remount focus moves to
  the new result input (not on the first step).
- Focus targets: `div-active`, `div-col-<j>`, `div-quotient`, `div-remainder`, `div-remainders`,
  `div-zero`, `div-read`.
- `div-remainders` is the whole remainder column. With `showOrder`, an upward arrow shows the
  reading direction (MSB at the bottom to LSB at the top).
- No horizontal scrolling at any width (cells 52 px, 44 px below 640 px). A new row fades in over
  `--dur-base` (instant under reduced motion).
