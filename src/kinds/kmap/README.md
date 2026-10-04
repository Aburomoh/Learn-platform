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

**Status:** spec, grading and tests. The view, and registration with it (ADR-0008), are next
(Frontend).
