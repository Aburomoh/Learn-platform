# R1 redesign proposal (UX, #113)

Epic: #110 (owner directive; problem numbers below refer to it). Inputs: Product IA, PR #126
(`docs/design/information-architecture.md`); Pedagogy report on #112. This document uses their names
(Course · Chapter · Topic · Practice · Challenge) and their primary-action table and does not repeat them.
Status: **proposal**. Frontend starts only after the Technical Lead accepts it on #110.

- Before: `before/{home,course,topic,activity}-{1280,390}-{light,dark}.png` (captured from `main`, dev server).
- After: `after/{home,course,topic,activity}-{1280,390}.png`, `after/topic-dark-1280.png`.
- Mock-ups: `mockups/*.html` + `mockups/r1.css` (static HTML with the proposed tokens; open in a browser).
  Mock-up states: home = returning student, course = mixed statuses, topic = first visit, activity = challenge 2.

## 1. Hierarchy: one question per band (#110 items 1–3, 10)
Every page reads top to bottom as **Where am I → What am I learning → What do I do next**. Everything
else is quieter or lower.

| Band | Treatment |
|---|---|
| Where | Eyebrow line (13 px, bold, uppercase, `--brand`): "ECET 111 · Chapter 1". Breadcrumb trail removed from the top bar on phones. |
| What | Display title (`--text-display`), then **one** route line ("Today: Decimal → Binary → Octal → Hex"), then the learning preview. |
| Next | **One** filled primary button per view (48 px tall, full width on phones). Effort cue below it in muted 15 px. |
| Then | Challenge steps; "What you'll practise" collapsed; footer facts. |

There is one filled button per view. Every other action is a quiet text action with an arrow ("Open course →",
"Start →" on a secondary row, "Hint"). Cards are never the button: the row is a plain surface and the
button inside it is the only target (item 1).

## 2. Page layouts
**Home.** A returning student sees one elevated "pick up" panel: topic, preview, steps, **Continue**, and the
tutor's one line. Below it, "Your course" as a plain row with "Open course →". A first-time student sees the same
panel with **Start practice** on the first topic, and the heading "Start here".
**Course.** Title band, then one section per chapter. Each topic is a plain row with a small visual on the left,
the title and route, a status line, and one button: filled for the next topic, quiet for the rest. The tutor's one
line sits in the right rail on desktop and is hidden on phones.
**Topic.** This follows the epic's sketch and Pedagogy's order: eyebrow, title, Today line, preview board,
tutor line, **Start practice / Continue / Next topic**, the effort cue, steps, and collapsed objectives.
On desktop the tutor gets the right column with a large avatar. On phones it becomes one row under the preview.
**Activity.** There's no introduction. A back link to the topic and the challenge steps sit on one line, then the
stage panel. The tutor sits beside the stage at `lg` and above it in the compact strip below `lg`, as shipped in #87.
Stage internals are unchanged.

**Wide screens (item 13).** Content max is 1120 px, with a 320 px right column for the tutor (and later the
progress summary). Nothing stretches to fill space: the main column keeps a readable width and the empty
area stays empty.

## 3. Learning preview (item 5)
Topics carry an optional `preview` (Product #116). It renders as a **preview board**, a sunken surface
holding tactile tiles. Number systems: `45₁₀ → 101101₂ → 55₈ → 2D₁₆` in mono tiles, with the base as `<sub>`
and a muted base label. Logic gates: one small static gate glyph with 0/1 values. Each later topic adds its own
glyph set (registers, memory, packets, timelines) to the same board. Guard (Pedagogy): preview numbers never
come from the practice itself. The board has `role="img"` and an `aria-label` that reads the chain in words.

## 4. Progress (item 12)
- **Steps:** one marker per challenge with its short `label` (Divide · Read off · Octal · Hex). The states are
  *done* (filled `--success` with a check), *current* (`--brand` ring, bold label) and *not started* (hairline
  ring). Each state also has visually hidden text. Colour is never the only signal.
- **Status lines:** "2 of 4 challenges done", "Completed" with a check, or the effort cue for new topics.
- **Buttons** follow Product's table. Data: `completedQuestions` (#117). No scores, no mastery labels.

## 5. Identity (item 7), configurable
- **Mark:** four rounded "bit tiles" in a 2×2 grid, two filled (`--brand` top-left, `--accent` bottom-right) and
  two outlined. It reads as bits and as a workbench, with no letters, so it survives a rename. It ships as
  `public/brand/mark.svg`, referenced from `config/product.ts` (`brand.markSrc`). The name still comes only
  from `product.name`.
- **Shape language:** 10 px radius tiles and controls, 16 px radius surfaces; pills only for tiny status
  chips, if ever. The tile motif repeats in the preview board, bit cells, ladder and grouping.
- **Typography personality** with the system stack (no font download): heavy display weight (750),
  tight tracking (−0.015 em), uppercase eyebrows with wide tracking, mono for every number in a base.
- **Icons:** 1.8 px stroke, round caps, 20 px, `currentColor`, inline SVG. Used sparingly: profile, arrow,
  back, check.

## 6. Palette and theme (items 8, 11)
Warm paper neutrals, ink-blue action, terracotta identity accent. No gradients, no purple. **Light by default.**
Dark only when the student chooses it in Settings (Appearance: Light · Dark · Match device). It is applied as
`data-theme` on `<html>` by a tiny inline head script reading prefs, so the page doesn't flash.
Security/Performance should glance at that script, but it adds no network request and no dependency.
All text pairs below meet 4.5:1 (body and muted text on `--bg` and `--surface`, in both themes).

## 7. Fewer rectangles (item 9)
Remove the borders on cards, meta pills, the DEMO badge and the footer separator. Hierarchy comes from spacing
(the `--space-5` to `--space-7` rhythm between bands), from surfaces (`--bg` page, `--surface` rows,
`--surface-sunk` wells) and from **one** elevated element per page (`--shadow-2`). Hairline borders stay only
on inputs and where a control needs an edge.

## 8. Metadata and dev indicators (items 10, 11)
"Guest · Settings" becomes a profile button (an icon, plus "Guest" from 641 px up) that opens a menu: Guest
explanation, Settings, Appearance. DEMO becomes a small amber dot with "Demo content" in the footer line, next
to "Optional practice, not graded" and "Progress stays in this browser". Owner indicators stay visible in dev
builds through the same footer line. Turn off the Next dev indicator (`devIndicators: false`, Technical
Lead's note on #110).

## 9. Tutor presence (item 6)
The placeholder is a warm monogram disc (`--brand-soft` fill, `--brand` initials taken from
`product.owner.shortName`) with the name label under it. It is never a stock face. The bubble is a soft
`--surface-2` shape with a squared top-left corner pointing at the avatar. Sizes: 88 px on the topic page
(desktop), 56 px on home and course, 40 px in the activity strip. The photo replaces the disc later through
`brand.tutorPortrait` in config. Copy on the topic page is Pedagogy's line, with no method hints.

## 10. Design-system changes for Frontend (#121–#125)
**Tokens** (`src/styles/tokens.css`, light default plus `:root[data-theme="dark"]`. Drop the automatic
`prefers-color-scheme` block and keep it only under `[data-theme="system"]`):

| Token | Light | Dark | Note |
|---|---|---|---|
| `--bg` | `#f6f3ee` | `#1c1a17` | was cold `#f6f7f9` |
| `--surface` | `#fffdfa` | `#25221e` | |
| `--surface-2` | `#efe9e0` | `#2f2b26` | tiles, bubble |
| `--surface-sunk` | `#f1ece4` | `#211e1b` | new: preview board, stage wells |
| `--text` / `--text-muted` | `#2a251f` / `#6a6157` | `#f1ece4` / `#b3a99c` | |
| `--border` | `#e2dacd` | `#3a352f` | inputs only |
| `--accent` / `-hover` / `-soft` | `#1d4f7a` / `#163d5f` / `#e4ecf3` | `#8fb8e0` / `#a9c9e8` / `#24313d` | primary action |
| `--brand` / `--brand-soft` | `#b5522b` / `#f6e4da` | `#e08a62` / `#3a2a21` | new: identity, eyebrow, current step |
| `--success` / `--success-soft` | `#2e7d4f` / `#e3f0e7` | `#74c495` / `#1f3327` | |
| `--shadow-1` / `--shadow-2` | warm, low | darker | `--shadow` renamed `--shadow-1` |
| `--text-xs` / `--text-display` | 13 px / `clamp(1.875rem, 1.35rem + 1.6vw, 2.5rem)` | | new |
| `--tracking-tight` / `--tracking-eyebrow` | −0.015 em / 0.08 em | | new |
| `--radius-md` / `--radius-lg` | 10 px / 16 px | | were 8 / 12 |
| `--content-max` | 1120 px | | top bar, main and footer share it (fixes #56) |

The existing `--highlight`, `--signal-*`, `--focus-halo`, `--diagram-text-min` and motion tokens stay, re-checked
against the warm surfaces.

**Shared components** (in `src/shell/` unless noted, no page-specific CSS):
`TopBar` (mark + name + profile menu) · `Footer` (facts line with DEMO dot) · `PageHeading` (eyebrow,
display title, route line) · `PrimaryAction` (driven by #118's resolver) · `ChallengeSteps` · `PreviewBoard`
(renders the content `preview`) · `TopicRow` · `TutorCard` (in `src/tutor/ui`; sizes sm/md/lg; the existing
`TutorAvatar` placeholder becomes the monogram disc) · `ProfileMenu`.

## 11. Not changed
Stage, interactions, tutor engine, grading and the step contract (ADR-0007). The 12 px diagram floor, touch
targets, reduced motion and focus rings still apply. No new dependency, no font download, no new network request.

## Open points for the Technical Lead
1. The inline theme script in `<head>` (needed to avoid a flash of the wrong theme).
2. Should "Match device" be offered at all, or only Light and Dark? UX prefers offering it, with Light as the default.
3. The `config/product.ts` additions: `brand.markSrc` and `brand.tutorPortrait`.
