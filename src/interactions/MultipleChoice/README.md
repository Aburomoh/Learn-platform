# MultipleChoice

Single-select question with explicit submit.

```tsx
<MultipleChoice
  id="lg.q.identify"
  prompt="Which gate outputs 1 only when both inputs are 1?"
  options={[{ id: "and", text: "AND" }, { id: "or", text: "OR" }]}
  onAnswer={(optionId) => runner.submit({ kind: "multiple-choice", optionId })}
  submittedOptionId={last?.optionId}
  state={last?.correct ? "correct" : "incorrect"}
  disabled={locked}
/>
```

- Selection never submits; `onAnswer` fires on the Check button or Enter.
- Keyboard: Tab to the group, arrows move and select, Enter submits.
- Each option carries `data-focus-target="option-<id>"` for tutor FOCUS/HIGHLIGHT.
- Reduced motion: only colour transitions, which collapse to 0 ms via tokens.
- Does not grade; pass `state` and `submittedOptionId` back from the runner.
