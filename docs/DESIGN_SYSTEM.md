# Design System

> **Redesign R1 proposed:** `docs/design/redesign-r1/README.md` (#113). Until it is accepted on #110, this document is current.

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

## Theme and palette (R1 redesign, #133)
`src/styles/tokens.css` holds the R1 values (`docs/design/redesign-r1/README.md` §10): warm paper
neutrals, ink-blue `--accent` for the primary action, terracotta `--brand` for identity (as text
only at 13 px bold or larger). New: `--surface-sunk`, `--accent-hover/-soft`, `--brand/-soft`,
`--success-soft`, `--shadow-1/-2` (`--shadow` is an alias of `--shadow-1` while modules migrate),
`--text-xs`, `--text-display`, `--tracking-*`, `--radius-pill`; `--content-max` is 1120 px.

**Light is the default.** Dark applies only when the student chooses it in Settings → Appearance
(Light · Dark · Match device). The choice is stored in the prefs record and applied as `data-theme`
on `<html>`: `dark` always, `system` under `prefers-color-scheme: dark`. A tiny inline script in
`<head>` (`src/shell/theme.ts`) sets the attribute before first paint; by rule it only reads the
prefs key and sets `data-theme`. The two dark blocks in `tokens.css` must stay identical
(`tokens.test.ts` checks this and the WCAG AA contrast pairs in both themes).

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
Speech bubble with skippable typewriter, small and quiet by default. The photographic pose set
(#354, `config/product.ts` → `brand.tutorPortrait`) replaces the monogram; the monogram stays as the
fallback.
- **Where the tutor has its own column** (stage ≥ 1200 px, course/topic rails and home card ≥ 900 px):
  the waist-up pose in a fixed 168 × 224 px box above the bubble. Poses differ mainly in the hands, so
  only the waist-up carries the expression. The fixed box means a pose change never shifts layout.
- **Phones and the strip above the stage:** the 40 px head crop. The bubble text carries the meaning.
- **Pointing toward the stage:** `point_left` at ≥ 1200 px (stage is to the viewer's left). Below that
  the strip sits above the stage, so use `explaining`. `attention-left/right` keep their own poses.
- **Motion and loading:** 120 ms crossfade, none under reduced motion. Only the current pose is fetched,
  with neutral preloaded at the size the layout uses. Phones never fetch the waist-up files.
- **Welcome:** first visit only, on home and the course/topic intro rails.

## Proposed token changes (UX review 2026-10-03, not yet in `tokens.css`)
Evidence: `docs/design/review-2026-10-03/`. Each row is adopted by the issue that implements it.

| Token | Value (light / dark) | Use |
|---|---|---|
| `--signal-high` | `#0f766e` / `#5eead4` | Wire, junction and value label carrying logic 1. Frees `--accent` to mean only "where you are / what to do". Adopted in #32. |
| `--signal-low` | `var(--text-muted)` | Wire carrying logic 0 (once its value is known). Adopted in #32. |
| `--pending-opacity` | `0.45` | Circuit gates and wires not yet reached in a gate walk. Adopted in #32. |
| `--focus-halo` | `var(--highlight-soft)` | Rounded halo behind the active gate or active cell group. Adopted in #32. |
| `--sub-size` | `max(0.7em, 12px)` | Base subscript in number notation, e.g. (26)<sub>10</sub>. Never below 12 px (#155). |
| `--diagram-text-min` | `12px` | Floor for labels and values inside SVG diagrams at any width. Adopted in #88. |
| `--topbar-h` | `52px` | Height of the sticky top bar; replaces literal `52px` / `68px` offsets. Adopted in #54. |
| `--tutor-strip-h` | `64px` | Height cap of the *collapsed* (stale-message) tutor strip below `lg`. Adopted in #54. |
| `--sticky-offset` | `calc(var(--topbar-h) + var(--tutor-live-h, var(--tutor-strip-h)) + var(--space-2))` | `scroll-padding-top` so focus/highlight scrolling never lands under sticky UI; `--tutor-live-h` is the strip's live height. Adopted in #54. |
| `--content-wide` | `1400px` | Activity pages; top bar and footer use the same width so edges align. |

### Rules that come with them
- **Accent means attention, not value.** Logic levels use `--signal-*` plus a printed 0/1; the active gate gets `--focus-halo`, a 3.5 px `--accent` outline and a `?` at its output. Gates after it use `--pending-opacity`.
- **Sticky tutor below `lg`: never clamp unread text.** A new tutor message (feedback, hint, Explain Slowly step) shows in full: the strip grows to fit, up to 40svh, and scrolls inside itself beyond that, never with an ellipsis. It collapses to the 2-line strip (`--tutor-strip-h`) only once the message is stale: the student's next input, Continue, or a page scroll. Height changes use `--dur-base` (instant under reduced motion). `scroll-padding-top` follows the strip's live height, not the collapsed cap, so focused inputs and Continue are never covered. When the viewport is under 500 px tall the tutor is not sticky at all.
- **DivisionChain is a vertical ladder at all widths** (matches the Chapter 1 slide; #53). Each row has `2 |`, the number and its remainder; the quotient is typed into the next row down. The `--focus-halo` covers both cells the student is filling: the current remainder and the quotient cell below it. LSB/MSB labels and the upward read-off arrow beside the remainders, which runs from MSB (bottom) to LSB (top), appear only at the read-off: in its Explain Slowly or after the read-off question is answered. They never show while the student is working out the bit order, and never during the division (#97, Pedagogy).
- **Horizontal steppers on phones** (future bit rows): the active column is always scrolled into view, and a fade edge shows there is more content.
- **Diagram text never renders below 12 px** (`--diagram-text-min`), measured as computed on-screen size at 320 and 390 px. Diagrams fit narrow screens by compacting the layout, not by scaling the text: shorter wire runs, narrower column spacing, smaller input boxes, and the gate name under the symbol if needed. If a diagram still does not fit, it scrolls inside its box with a fade edge. The active gate must be fully visible without scrolling at 390 px, Y must be reachable, and the page never scrolls sideways (#88).
- **Base notation** is marked up as `<sub>` with `--sub-size`, never Unicode subscript digits, so screen readers and fallback fonts read it correctly.
