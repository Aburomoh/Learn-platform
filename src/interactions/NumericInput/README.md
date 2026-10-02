# NumericInput

Base-aware text entry (binary, octal, decimal, hexadecimal) with explicit submit.

```tsx
<NumericInput id="ns.q.to-hex" prompt="Write 45 in hexadecimal." base={16}
  onAnswer={(text) => runner.submit({ kind: "numeric", text })}
  state={last ? (last.correct ? "correct" : "incorrect") : "idle"} submittedText={last?.text} />
```

- Characters outside the base are rejected as typed; hex is upper-cased.
- Enter or the Check button submits. The input carries `data-focus-target="numeric-input"`.
- `aria-invalid` is set on incorrect state; a visible hint names the allowed digits.
- Mobile: numeric keyboard for bases 2/8/10, text keyboard for hex.
