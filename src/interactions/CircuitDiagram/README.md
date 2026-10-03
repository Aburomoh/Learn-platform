# CircuitDiagram

SVG rendering of a `circuit-predict` spec (up to 3 inputs, 4 gates, layered left to right),
drawn like a textbook schematic: standard gate symbols, one pin per gate input, right-angle wires.

```tsx
<CircuitDiagram id="circ" spec={variant.spec} inputs={inputs}
  onToggleInput={(id, v) => setInputs({ ...inputs, [id]: v })} />
<CircuitDiagram id="circ" spec={variant.spec} lit={["n1", "g1"]} revealOutput />
```

- Inputs are `role="switch"` hotspots (click, Enter, Space) when `spec.inputsToggleable` and a
  handler is given; otherwise decorative.
- Gates carry `data-focus-target="gate-<id>"`, inputs `input-<id>`.
- `lit` gates (answered or explained) show their value; wires carrying a known value into a
  reached gate are coloured with `--signal-high` / `--signal-low`. Accent is never a logic level.
- The output Y is hidden until `revealOutput` so the student predicts first.
- Values come from `evaluateCircuit` in `src/content/grade.ts`; the diagram never grades.
- `activeGateId` marks the gate being asked: halo, accent outline, `?` at its output and the 0/1
  printed on its input wires. Its output wire and everything after it stay neutral, with dimmed
  strokes (`--pending-opacity`; labels keep full contrast), so neither colour nor text gives an answer away (tested).
- Layout is pure and lives in `layout.ts`: each wire that needs a vertical run gets its own
  channel, so wires of different signals never share a segment; a signal that feeds two gates
  shows a junction dot; a wire that would pass through a gate is moved to a free lane.
  `layout.test.ts` asserts these rules on several circuits.
- The SVG scales with its box down to 0.6× (a three-column circuit fits a 390 px phone). Below
  that the box scrolls sideways, fades the hidden edge(s), becomes keyboard-focusable and keeps the
  active gate in view. Toggleable inputs have an enlarged hit area.
