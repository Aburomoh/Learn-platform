# Tutor UI

The instructor beside the whiteboard. Small, quiet, reacts in short messages.

| Piece | Purpose |
|-------|---------|
| `TutorAvatar` | Placeholder line-drawn face per expression (`data-expression`). Swap the SVG per expression for approved artwork later; the API stays. |
| `TutorBubble` | Typewriter bubble. Click/Enter reveals all; reduced motion or `speed=0` renders instantly; full text goes to a polite live region at once. |
| `TutorPanel` | Avatar + bubble; shrinks the avatar below 900 px. |
| `useFocusEffects` | Executes FOCUS / HIGHLIGHT / PULSE on `data-focus-target` elements inside a container; clears on RESET_INTERACTION, ADVANCE_EXPLANATION, COMPLETE. Styles in `tutor-effects.css` (import once globally). |
| `useReducedMotion` | `prefers-reduced-motion` as a hook. |

```tsx
const { apply } = useFocusEffects(stageRef);
for (const a of actions) { if (a.type === "SAY") setMessage(a.text); else if (a.type === "CHANGE_EXPRESSION") setExpression(a.expression); else apply(a); }
<TutorPanel name={product.owner.shortName} expression={expression} message={message} />
```

No audio, no voice, no forced animation.
