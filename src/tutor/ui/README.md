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

## Compact strip (below 1200 px)
`TutorPanel` becomes a strip capped at `--tutor-strip-h`: 32 px avatar, message clamped to two
lines. Tap the strip or use the toggle button (`aria-expanded`) to read the whole message; Escape
collapses it; a new message starts collapsed. The stage makes the strip sticky under the top bar
(`--topbar-h`), except when the viewport is under 500 px tall, where it scrolls away.
`html { scroll-padding-top: var(--sticky-offset) }` keeps focus/highlight scrolling clear of it.
