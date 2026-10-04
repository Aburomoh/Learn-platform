# PlaceValueDiagram

Binary place-value row built on `DragToTarget`. Practice mode: drag a "1" into a slot, tap a
set slot to clear it, Check submits. Explanation mode (`lit` given): slots are read-only and the
diagram shows the lit places plus `remainder` and an `attention` outline.

```tsx
<PlaceValueDiagram id="bits" slots={6} digits={digits} onChange={setDigits} onSubmit={check} state={state} />
<PlaceValueDiagram id="bits" slots={6} digits={digits} lit={[32, 8]} attention={4} remainder={5} />
```

Focus targets: `slot-<place>`, `total`, `remainder`. Keyboard and touch behaviour inherit from
DragToTarget. The running total is a polite live region so screen-reader users hear changes.
