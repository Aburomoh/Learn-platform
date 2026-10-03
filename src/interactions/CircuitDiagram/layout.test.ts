import { describe, expect, it } from "vitest";
import type { CircuitSpec } from "@/content/schema";
import { layoutCircuit, type Point } from "./layout";

type Gates = CircuitSpec["gates"];
const circuit = (inputs: string[], gates: Gates, outputGateId: string): CircuitSpec => ({
  kind: "circuit-predict",
  inputs: inputs.map((id) => ({ id, label: id.toUpperCase(), value: 0 })),
  gates,
  outputGateId,
  answer: 0,
  inputsToggleable: false,
});

const specs: Record<string, CircuitSpec> = {
  "NOT-AND-OR": circuit(["a", "b", "c"], [
    { id: "n1", type: "NOT", from: ["b"] },
    { id: "g1", type: "AND", from: ["a", "n1"] },
    { id: "g2", type: "OR", from: ["g1", "c"] },
  ], "g2"),
  "XOR from AND/OR/NOT (fan-out past a gate)": circuit(["a", "b"], [
    { id: "na", type: "NOT", from: ["a"] },
    { id: "nb", type: "NOT", from: ["b"] },
    { id: "g1", type: "AND", from: ["a", "nb"] },
    { id: "g2", type: "AND", from: ["na", "b"] },
  ], "g2"),
  "two gates sharing both inputs": circuit(["a", "b"], [
    { id: "g1", type: "AND", from: ["a", "b"] },
    { id: "g2", type: "XOR", from: ["a", "b"] },
    { id: "g3", type: "NOR", from: ["g1", "g2"] },
  ], "g3"),
  "single gate": circuit(["a", "b"], [{ id: "g1", type: "NAND", from: ["a", "b"] }], "g1"),
};

type Seg = { a: Point; b: Point; net: string };
function segmentsOf(spec: CircuitSpec): Seg[] {
  return layoutCircuit(spec).wires.flatMap((w) => w.points.slice(1).map((b, i) => ({ a: w.points[i], b, net: w.from })));
}
/** Length two collinear segments have in common. */
function shared(s: Seg, t: Seg): number {
  for (const [along, across] of [["x", "y"], ["y", "x"]] as const) {
    if (s.a[across] === s.b[across] && t.a[across] === t.b[across] && s.a[across] === t.a[across]) {
      const lo = Math.max(Math.min(s.a[along], s.b[along]), Math.min(t.a[along], t.b[along]));
      const hi = Math.min(Math.max(s.a[along], s.b[along]), Math.max(t.a[along], t.b[along]));
      if (hi - lo > 0.01) return hi - lo;
    }
  }
  return 0;
}

describe.each(Object.entries(specs))("layoutCircuit: %s", (_name, spec) => {
  it("draws every wire with right angles only", () => {
    for (const s of segmentsOf(spec)) expect(s.a.x === s.b.x || s.a.y === s.b.y).toBe(true);
  });

  it("never lets wires of different signals share a segment", () => {
    const segs = segmentsOf(spec);
    for (const s of segs) for (const t of segs) if (s.net !== t.net) expect(shared(s, t)).toBe(0);
  });

  it("ends each wire on its own pin", () => {
    const pins = layoutCircuit(spec).wires.map((w) => w.points[w.points.length - 1]).map((p) => `${p.x},${p.y}`);
    expect(new Set(pins).size).toBe(pins.length);
  });

  it("keeps horizontal runs clear of the gates they pass", () => {
    const layout = layoutCircuit(spec);
    for (const w of layout.wires)
      for (let i = 1; i < w.points.length; i++) {
        const [a, b] = [w.points[i - 1], w.points[i]];
        if (a.y !== b.y) continue;
        for (const g of spec.gates) {
          if (g.id === w.to || g.id === w.from) continue;
          const p = layout.gates[g.id];
          const overlapsX = Math.min(a.x, b.x) < p.x + 60 && Math.max(a.x, b.x) > p.x;
          if (overlapsX) expect(Math.abs(a.y - p.y)).toBeGreaterThan(24);
        }
      }
  });
});

describe("layoutCircuit junctions", () => {
  it("marks a dot where a signal branches to a second gate", () => {
    const wires = layoutCircuit(specs["two gates sharing both inputs"]).wires;
    expect(wires.filter((w) => w.junction).length).toBeGreaterThanOrEqual(2);
    expect(layoutCircuit(specs["NOT-AND-OR"]).wires.some((w) => w.junction)).toBe(false);
  });
});
