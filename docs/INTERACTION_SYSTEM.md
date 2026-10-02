# Interaction System

`src/interactions/` is an internal component product. Every component ships with: a typed
props API, a `README.md`, keyboard and touch behaviour, reduced-motion behaviour, a unit test,
and a demo usage inside the demo course.

## Shared contract
```ts
interface InteractionProps<Answer> {
  id: string;                       // stable, used for progress + focus targets
  disabled?: boolean;               // after correct answer or during explanation
  onEvent: (e: LearningEvent) => void;   // see src/tutor/engine/events.ts
  onAnswer: (answer: Answer) => void;    // fires on explicit submit, not on every change
}
```
Components never grade themselves. They emit the answer; the `ActivityRunner` grades it against
`src/content/` and feeds the result to the tutor engine.

Any element that the tutor may point at carries `data-focus-target="<id>"`. `TutorFocus`
resolves these ids to apply focus / highlight / pulse styles.

## Component list and M1 status
| Component | M1 | Notes |
|-----------|----|-------|
| MultipleChoice | yes | single select, keyboard arrows + enter |
| NumericInput | yes | base-aware (bin/oct/dec/hex) input |
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
