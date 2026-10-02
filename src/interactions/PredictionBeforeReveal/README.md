# PredictionBeforeReveal

Ask → commit → reveal. The continuation text is hidden until the student commits to a prediction.

```tsx
<PredictionBeforeReveal id={step.id} prompt={step.ask.prompt} options={step.ask.options}
  onPredict={(i) => runner.dispatch({ type: "PREDICTION_MADE", correct: i === step.ask.correctIndex })}
  result={prediction} />
```

- Options are plain buttons (keyboard and touch friendly, 44 px targets).
- After commit, buttons lock; the chosen one gets `aria-pressed` and a colour + icon-free text reveal in a `role="status"` region.
- No penalty semantics here; the engine decides how to react.
