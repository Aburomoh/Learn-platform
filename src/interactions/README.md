# Interactions

Reusable, accessible interaction components (contract: `docs/INTERACTION_SYSTEM.md`). Each folder
has its own README with props and focus targets. Components never grade: they report what the
student did and render the feedback state the stage passes back.

## Step components and the `key={stepIndex}` remount contract

`DivisionChain`, `BitGrouping`, `ColumnAddition` (and the gate walk's answer form) show one step
of a multi-step question at a time. They keep the inputs of the *current* step in local state
and expect to be **remounted when the step advances**:

```tsx
<DivisionChain key={stepIndex} stepIndex={stepIndex} ... />
```

- A new `key` clears the step's inputs, so the stage never has to reset them.
- On mount for `stepIndex > 0` the component moves keyboard focus to the new step's first input
  (never on the first step, so a page load does not steal focus).
- A wrong answer does **not** change `stepIndex`, so the component stays mounted and the student's
  typing is kept for the retry.
- The step's truth (what to show for completed steps) is passed in as props from the step contract
  (`src/content/steps.ts`); the component only draws it.
