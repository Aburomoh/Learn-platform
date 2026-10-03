# Interaction System

`src/interactions/` is an internal component product. Every component ships with: a typed
props API, a `README.md`, keyboard and touch behaviour, reduced-motion behaviour, a unit test,
and a demo usage inside the demo course.

## Shared contract
```ts
interface InteractionBaseProps {
  id: string;                 // stable, used for progress keys + focus targets
  disabled?: boolean;         // after a correct answer or during explanation
  state?: "idle" | "correct" | "incorrect";   // feedback passed back by the runner
}
// Each component adds one explicit callback, e.g. onAnswer(optionId), onAnswer(text),
// onRequest(), onPredict(index). Callbacks fire on explicit submit, never on every change.
```
Components never grade themselves. They emit the answer; the `ActivityRunner` grades it against
`src/content/` (`grade()`) and feeds the result to the tutor engine.

Any element that the tutor may point at carries `data-focus-target="<id>"` (helper
`focusTarget(id)` in `src/interactions/shared/types.ts`). `TutorFocus` resolves these ids to
apply focus / highlight / pulse styles.

## Component list and M1 status
| Component | M1 | Notes |
|-----------|----|-------|
| MultipleChoice | yes | single select, keyboard arrows + enter |
| NumericInput | yes | base-aware (bin/oct/dec/hex) input |
| DivisionChain | yes (M1.1) | repeated division by 2, one checked step at a time, classroom layout |
| DragToTarget | yes | native pointer events + select-then-place keyboard path |
| ClickableDiagram / Hotspot | yes | SVG with toggleable hotspots (gate inputs) |
| InteractiveDiagram | yes | place-value row, gate circuit |
| HintReveal | yes | ladder-aware, locked until engine allows |
| PredictionBeforeReveal | yes | ask → commit → reveal |
| SlowReveal | yes | step container for Explain Slowly |
| TutorBubble / TutorExpression / TutorFocus | yes | in `src/tutor/ui` |
| Sortable, Matching, SequenceBuilder, CodeStepper, MemoryVisualizer, Timeline, CircuitInteraction, HighlightRegion | later | add when a real activity needs them |

## Drag and drop
Native Pointer Events (ADR-0004). Keyboard: focus a draggable, press Space/Enter to grab, use
arrows/Tab to move between targets, Space/Enter to place, Escape to cancel. Screen readers get
`aria-grabbed`-free plain announcements via a live region.
