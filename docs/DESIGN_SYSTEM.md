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

## Proposed token changes (UX review 2026-10-03, not yet in `tokens.css`)
Evidence: `docs/design/review-2026-10-03/`. Each row is adopted by the issue that implements it.

| Token | Value (light / dark) | Use |
|---|---|---|
| `--signal-high` | `#0f766e` / `#5eead4` | Wire, junction and value label carrying logic 1. Frees `--accent` to mean only "where you are / what to do". |
| `--signal-low` | `var(--text-muted)` | Wire carrying logic 0 (once its value is known). |
| `--pending-opacity` | `0.45` | Circuit gates and wires not yet reached in a gate walk. |
| `--focus-halo` | `var(--highlight-soft)` | Rounded halo behind the active gate or active cell group. |
| `--sub-size` | `0.7em` | Base subscript in number notation, e.g. (26)<sub>10</sub>. |
| `--topbar-h` | `52px` | Height of the sticky top bar; replaces literal `52px` / `68px` offsets. |
| `--tutor-strip-h` | `64px` | Max height of the compact sticky tutor strip below `lg`. |
| `--sticky-offset` | `calc(var(--topbar-h) + var(--tutor-strip-h))` | `scroll-padding-top` so focus/highlight scrolling never lands under sticky UI. |
| `--content-wide` | `1400px` | Activity pages; top bar and footer use the same width so edges align. |

### Rules that come with them
- **Accent means attention, not value.** Logic levels use `--signal-*` plus a printed 0/1; the active gate gets `--focus-halo`, a 3.5 px `--accent` outline and a `?` at its output. Gates after it use `--pending-opacity`.
- **Sticky tutor below `lg`:** a one- or two-line strip (avatar 32 px, text clamped, tap to expand) capped at `--tutor-strip-h`. When the viewport is under 500 px tall the tutor is not sticky at all.
- **Horizontal steppers on phones** (DivisionChain, future bit rows): the active column is always scrolled into view, and a fade edge shows there is more content.
- **Diagrams must fit at 390 px** down to 0.6× scale before horizontal scrolling is allowed; the output (Y) must always be visible.
- **Base notation** is marked up as `<sub>` with `--sub-size`, never Unicode subscript digits, so screen readers and fallback fonts read it correctly.
