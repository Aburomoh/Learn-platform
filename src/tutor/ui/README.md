# Tutor UI

The instructor beside the whiteboard. Small, quiet, reacts in short messages.

| Piece | Purpose |
|-------|---------|
| `TutorAvatar` | One avatar for every width (DESIGN_SYSTEM.md, Tutor area): from 1200 px the waist-up pose in a fixed 168 × 224 box above the bubble; in the strip the 40 px head crop. Pose from `portrait` (`product.brand.tutorPortrait`, see `poses.ts`), else the monogram (56 / 40 px); also the monogram if a file fails. Alt text is the expression label; a new pose crossfades in `--dur-fast` once loaded, none under reduced motion. |
| `PosePicture` | One pose as `<picture>`: a media-conditioned waist-up `<source>` and the head crop as `<img>`, so only the selected file is fetched (phones never fetch waist-up). |
| `TutorPosePreload` | Activity pages: preloads neutral only, waist-up from 1200 px and the head crop below (media-conditioned `<link rel="preload">`). |
| `poses.ts` | `TutorPoseTable` type, `poseFor` / `poseSrc` per place (`column` = 480 px `-waist`, `compact` = 168 px crop; `pointing` is `explaining` when compact), `COLUMN_MEDIA`. Files come from `scripts/tutor-assets.py` (#354). |
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

## Strip below 1200 px: never clamp unread text
`TutorPanel` is a strip above the stage (32 px avatar). A new message — feedback, hint or Explain
Slowly step — always shows in full: the strip grows to fit, up to 40svh, then scrolls inside
itself. It collapses to two lines (`--tutor-strip-h`) only once the message is stale: the student
types, clicks elsewhere (Check, Continue) or scrolls the page themselves (wheel, touch, PageUp/Down;
programmatic focus scrolling does not count). Tap the strip or use the toggle (`aria-expanded`) to
reopen; Escape collapses. Pass `messageSeq` so a repeated text still counts as a new message.
The stage makes the strip sticky under the top bar (`--topbar-h`), except when the viewport is
under 500 px tall. The panel publishes its live height as `--tutor-live-h`, which
`--sticky-offset` (`scroll-padding-top`) uses, and it scrolls the focused element clear if a
grown strip would cover it.
