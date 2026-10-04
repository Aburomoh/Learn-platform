# kmap

The K-map (#234, ECET 111 Chapter 3; representations §5; content pack ch3). From Σ, in the
slides' order:

1. **fill** (unless `fill: false`): one value per cell, 1 / 0 / X. Answer `cells`, indexed by
   minterm number.
2. For each group of a minimal cover, two goals:
   - **group**: tap its cells. Answer `group` (minterm numbers) and `previous` (the groups
     accepted so far).
   - **term**: write its product. Answer `group` again and `term`.
3. **answer**: F. Answer `expr`.

- Layout (`kmapLayout`): 2 × 2 (A | B), 2 × 4 (A | BC) or 4 × 4 (AB | CD), with two-bit axes in
  Gray order 00 01 11 10. `grid` holds the minterm number of each cell in display order.
- Truth is computed: `minimalCovers` from the Boolean module. **Any minimal cover is accepted.**
  A group is right when it is a wrapping rectangle of 2^k cells (`cubeOf`) over 1s and Xs, and some
  minimal cover contains it together with the earlier groups. Every minimal cover has the same
  number of groups, so the step count is fixed.
- F is right when it matches every non-X cell and has as few terms and literals as a minimal cover.
- After a wrong fill, `wrongCells.first` is the minterm number of the first wrong cell in reading
  order, and `count` is how many are wrong.
- Detectors:
  - fill: `fill-binary-order` (axes 00 01 10 11), `fill-dontcare-as-one`;
  - group: `group-shape`, `group-covers-zero`, `group-only-dontcares`, `group-too-small` (not
    prime), `group-not-needed`;
  - term: `term-keeps-changing`, `term-wrong-complement`;
  - F: `answer-misses-ones`, `answer-not-minimal`.
- Step vars: `sigma`, `varList`, `rowVars`, `colVars`, `cellCount`, `groupCount`, `groupNumber`,
  `answer` (one minimal SOP), `stepNumber`.

## View (`ui.tsx`, `KarnaughMap.tsx`; representations §5)

- **Map:** the slides' layout from `kmapLayout`: Gray-order axes, a corner split by a diagonal (row
  variables bottom-left, column variables top-right), bars outside the grid where each variable is
  1. Cells are 56 px (52 px on phones, 44 px at 320 px) with the minterm number top-left at 12 px
  and the value centred; a don't-care is an italic x.
- **One ARIA grid, one tab stop.** Arrows, Home and End move.
  - fill: Space / Enter cycle empty → 0 → 1 (→ X); 0, 1, x type and move on in reading order;
    Backspace clears. After a wrong check only `wrongCells.first` is marked (✕) and focused.
  - group: Space / Enter (or a tap) puts a cell in or out of the group (`aria-selected`, halo plus
    an accent inset); Escape clears.
- **Groups:** a rounded outline per accepted group with its own line style (solid, dashed,
  dotted, double) and a numbered badge; the same badge prefixes its term in the list beside the
  map (below it on phones). A wrapping group is open halves at opposite edges; four corners are
  four quarters (`groupPieces`). Outlines, not fills, so the values stay readable.
- **Goals:** fill (unless given) → for each group: mark, then its term → F. Terms and F use the
  shared `ExpressionEntry` (prime typing, overbar reading, key row).
- **Focus targets:** `kmap`, `cell-m<n>`, `expression`.
- **Explain Slowly stages:** `groups` (minterm numbers per group shown), `active` (index of the
  group discussed; its term shows "?" until `term` is true), `answer` (show F).

**Status:** spec, grading, tests and the view; registered.
