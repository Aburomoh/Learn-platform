# HintReveal

Ladder-aware hint list and request button. The tutor engine decides what is granted; this
component only renders `revealed` and asks for more.

```tsx
<HintReveal revealed={tutor.hints} canRequest={tutor.canRequestHint}
  lockedReason="Try once first" onRequest={() => runner.dispatch({ type: "HINT_REQUESTED" })}
  onExplainSlowly={() => runner.dispatch({ type: "EXPLAIN_SLOWLY_REQUESTED" })} />
```

- Rung labels follow docs/PEDAGOGY.md (Nudge, Concept, Question, Look here, …).
- Locked state is a disabled button with a visible, `aria-describedby` reason.
- No animation; new hints simply appear in document order.
