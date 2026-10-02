# Design System

Tokens live in `src/styles/tokens.css` (CSS custom properties). Components use CSS Modules.
No UI framework, no animation library, no web-font request.

## Tone
Workbench/classroom: calm, legible, instrument-like. Light game influence at most (clear
states, satisfying confirmation). No confetti, coins, XP, mascots.

## Typography
System font stack. Scale 14 / 16 / 18 / 22 / 28 px, line height 1.5. Monospace for code, bits, hex.

## Spacing and layout
4 px base: `--space-1 … --space-8`. Breakpoints `sm 640`, `md 900`, `lg 1200`.
Shell: top bar + content column (max 1100 px). Stage layout: at `lg` the tutor panel sits beside
the stage; below `md` it stacks under the stage (bubble stays visible, avatar shrinks).

## Colour tokens (semantic, not brand)
`--bg --surface --surface-2 --text --text-muted --border --accent --accent-contrast --focus
--success --error --warning --highlight`. Light and dark via `prefers-color-scheme`.
Text contrast at least 4.5:1.

## States
- Question: idle / answering / checking / correct / incorrect / explaining.
- Option: default / hover / selected / correct / incorrect / disabled.
- Hint: locked / available / revealed.
- Drop target: idle / can-drop / over / filled / wrong. Draggable: idle / grabbed / placed.
- Stage target: focused (outline) / highlighted (fill) / pulsing (two scale cycles).

## Motion
`--dur-fast 120ms`, `--dur-base 200ms`, `--dur-slow 400ms`, standard easing.
Every animation carries meaning (state change, attention, progression).
Under `prefers-reduced-motion: reduce`: transitions instant, pulse becomes a static outline,
typewriter renders full text at once.

## Accessibility
Visible 2 px focus ring. All interactions keyboard operable; drag has a select-then-place
keyboard path. Touch targets at least 44 px. A live region announces feedback. Colour is never
the only carrier of state.

## Tutor area
Avatar (placeholder expression set until photographs arrive), speech bubble with skippable
typewriter, small and quiet by default.
