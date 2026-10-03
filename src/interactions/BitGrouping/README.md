# BitGrouping

Binary to octal (groups of 3) or hexadecimal (groups of 4), one goal at a time, as on the ECET 111
Chapter 1 slides: mark the groups from the right (padding with zeros on the left), then one digit
per group, left to right.

```tsx
<BitGrouping key={step} id="q" bits="11010" groupSize={3} stepIndex={step}
  groups={["011", "010"]} digits={["3", "2"]}
  onGroups={(groups) => submit({ kind: "bit-grouping", step: 0, groups })}
  onDigit={(digit) => submit({ kind: "bit-grouping", step, digit })}
  state={lastWrong ? "incorrect" : "idle"} />
```

- `stepIndex` 0: a row of bit cells. Tapping a bit starts a new group there (toggle button,
  `aria-pressed`, at least 36 × 44 px) and shows a 2 px divider in a gap; "Add 0" / "Remove 0" pad
  on the left. A row too long for its box scrolls inside it with a faded edge. "Check groups" reports the marked
  groups, padding included, left to right. The correct groups are not rendered in this step.
- `stepIndex` k ≥ 1: every group in a box; only group k has an input (two characters allowed so
  "13" for D can be recognised; hex is upper-cased). Earlier groups show their digit, later
  groups show nothing. Focus moves to the input on each step.
- `stepIndex` = groups + 1: all digits and the joined result, e.g. (32)₈, as a confirmation.
- Never grades. Remount (change `key`) when `stepIndex` advances.
- Without `onGroups` / `onDigit` it is read-only (explanations); `attention` outlines a group.
- Focus targets: `bits`, `pad-zero`, `group-<i>`, `group-digit`, `group-result`.
- At 390 px, 8 cells fit without scrolling; longer rows scroll inside the box.
