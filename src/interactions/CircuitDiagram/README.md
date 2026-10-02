# CircuitDiagram

SVG rendering of a `circuit-predict` spec (up to 3 inputs, 4 gates, layered left to right).

```tsx
<CircuitDiagram id="circ" spec={variant.spec} inputs={inputs}
  onToggleInput={(id, v) => setInputs({ ...inputs, [id]: v })} />
<CircuitDiagram id="circ" spec={variant.spec} lit={["n1", "g1"]} revealOutput />
```

- Inputs are `role="switch"` hotspots (click, Enter, Space) when `spec.inputsToggleable` and a
  handler is given; otherwise decorative.
- Gates carry `data-focus-target="gate-<id>"`, inputs `input-<id>`.
- `lit` gates show their evaluated value and light their incoming wires (explanation mode).
- The output Y is hidden until `revealOutput` so the student predicts first.
- Values come from `evaluateCircuit` in `src/content/grade.ts`; the diagram never grades.
