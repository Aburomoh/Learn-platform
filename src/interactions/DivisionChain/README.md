# DivisionChain

Repeated division by 2, one checked step at a time, in the classroom layout: a row of numbers,
a row of remainders beneath (first remainder = LSB, last = MSB).

```tsx
<DivisionChain id="q" steps={spec.steps} stepIndex={done}
  onStep={(q, r) => submit({ kind: "repeated-division", step: done, quotient: q, remainder: r })}
  state={lastWrong ? "incorrect" : "idle"} />
<DivisionChain id="q" steps={steps} stepIndex={steps.length} showOrder />   // completed, read-off
<DivisionChain id="q" steps={steps} stepIndex={2} attention={2} />          // explanation, read-only
```

- Columns appear one at a time, so the chain length is never given away.
- The student types the next number (top) and the remainder (underneath), then "Check step"
  or Enter. Digits only; the remainder is a single digit.
- Remount (change `key`) when `stepIndex` advances to clear the inputs.
- Focus targets: `div-active`, `div-col-<j>`, `div-quotient`, `div-remainder`, `div-remainders`,
  `div-zero`, `div-read`.
- Scrolls horizontally inside its own box on narrow screens; no animation.
