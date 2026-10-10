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
- Base 10 only, both off by default: `signed` allows one leading minus (a typed "−" is stored as "-"); `decimals={n}` allows a point with up to n digits after it. With `signed`, the keyboard hint is `text` (phone number pads have no minus); with only `decimals`, it is `decimal`. The hint line names what is allowed.
