/**
 * Pure layout for CircuitDiagram: gate positions, one pin per gate input, and right-angle wires.
 * Each wire that needs a vertical run gets its own channel (x position) in the gap before its
 * destination column, so wires of different signals never share a segment.
 */
import type { CircuitSpec } from "@/content/schema";

type GateType = CircuitSpec["gates"][number]["type"];

export interface Point {
  x: number;
  y: number;
}

export interface WireLayout {
  from: string;
  to: string;
  /** Polyline, axis-aligned between consecutive points; the last point is the gate pin. */
  points: Point[];
  /** Dot where this wire branches off a signal that carries on to another gate. */
  junction?: Point;
}

export interface CircuitLayout {
  viewBox: { x: number; y: number; width: number; height: number };
  /** Centre of each input terminal box. */
  inputs: Record<string, Point>;
  /** Left edge (x) and centre line (y) of each gate body. */
  gates: Record<string, Point>;
  wires: WireLayout[];
  output: { from: Point; to: Point };
}

export const GATE_H = 44;
export const INPUT_W = 44;
export const INPUT_H = 40;
const INPUT_X = 8;
const ROW_H = 70;
const COL_X0 = 120;
const COL_W = 150;
const PIN_DY = 11;
const MIN_GATE_GAP = 64;
/** A horizontal wire closer than this to a gate centre line would run through its body or label. */
const BODY_CLEARANCE = 40;
const OUTPUT_STUB = 40;

/** Distance from the left edge of the body to its output tip (bubble included). */
export function gateWidth(type: GateType): number {
  switch (type) {
    case "NOT": return 48;
    case "AND": return 56;
    case "NAND": return 64;
    case "OR": return 60;
    case "XOR": return 60;
    case "NOR": return 68;
  }
}

/** Where an input wire meets the body, relative to its left edge (OR-family backs are curved). */
function pinInset(type: GateType, single: boolean): number {
  if (type === "XOR") return single ? -7 : -2.5;
  if (type === "OR" || type === "NOR") return single ? 6 : 4.5;
  return 0;
}

export function gateDepths(spec: CircuitSpec): Record<string, number> {
  const depth: Record<string, number> = {};
  const inputIds = new Set(spec.inputs.map((i) => i.id));
  const resolve = (gid: string, guard = 0): number => {
    if (depth[gid] !== undefined) return depth[gid];
    if (guard > 20) throw new Error("Circuit cycle");
    const g = spec.gates.find((x) => x.id === gid)!;
    const d = Math.max(...g.from.map((f) => (inputIds.has(f) ? -1 : resolve(f, guard + 1)))) + 1;
    depth[gid] = d;
    return d;
  };
  for (const g of spec.gates) resolve(g.id);
  return depth;
}

/** A vertical run that needs a channel in the gap before column `gap`. */
interface Segment {
  wire: number;
  net: string;
  gap: number;
  yLeft: number;
  yRight: number;
  x: number;
}

export function layoutCircuit(spec: CircuitSpec): CircuitLayout {
  const depth = gateDepths(spec);
  const maxDepth = Math.max(...Object.values(depth));
  const gateById = Object.fromEntries(spec.gates.map((g) => [g.id, g]));
  const colLeft = (d: number) => COL_X0 + d * COL_W;

  const inputs: Record<string, Point> = {};
  spec.inputs.forEach((inp, i) => (inputs[inp.id] = { x: INPUT_X + INPUT_W / 2, y: i * ROW_H }));

  // Gate rows: centre each gate on its sources, then keep gates in one column apart.
  const gates: Record<string, Point> = {};
  const yOf = (id: string) => (inputs[id] ?? gates[id]).y;
  for (let d = 0; d <= maxDepth; d++) {
    const column = spec.gates.filter((g) => depth[g.id] === d);
    for (const g of column) {
      const ys = g.from.map(yOf);
      gates[g.id] = { x: colLeft(d), y: ys.reduce((a, b) => a + b, 0) / ys.length };
    }
    const sorted = [...column].sort((a, b) => gates[a.id].y - gates[b.id].y);
    for (let i = 1; i < sorted.length; i++) {
      const prev = gates[sorted[i - 1].id];
      const cur = gates[sorted[i].id];
      if (cur.y - prev.y < MIN_GATE_GAP) cur.y = prev.y + MIN_GATE_GAP;
    }
  }

  const outOf = (id: string): Point =>
    inputs[id] ? { x: INPUT_X + INPUT_W, y: inputs[id].y } : { x: gates[id].x + gateWidth(gateById[id].type), y: gates[id].y };
  const colOf = (id: string) => (inputs[id] ? -1 : depth[id]);

  // One wire per gate input; the upper source takes the upper pin so the pair never crosses.
  const wires: (WireLayout & { pin: Point; laneY?: number })[] = [];
  for (const g of spec.gates) {
    const single = g.from.length === 1;
    const order = g.from.map((f, i) => ({ f, i })).sort((a, b) => yOf(a.f) - yOf(b.f) || a.i - b.i);
    order.forEach(({ f }, k) => {
      const pin = { x: gates[g.id].x + pinInset(g.type, single), y: gates[g.id].y + (single ? 0 : k === 0 ? -PIN_DY : PIN_DY) };
      wires.push({ from: f, to: g.id, points: [], pin });
    });
  }

  // A wire that would pass through a gate in a column it skips is moved to a free lane.
  const segments: Segment[] = [];
  wires.forEach((w, wi) => {
    const start = outOf(w.from);
    const from = colOf(w.from);
    const to = depth[w.to];
    const crossed = spec.gates.filter((h) => depth[h.id] > from && depth[h.id] < to);
    const blocked = (y: number) => crossed.some((h) => Math.abs(gates[h.id].y - y) < BODY_CLEARANCE);
    if (blocked(start.y)) {
      let lane = start.y;
      for (let k = 1; k < 12 && blocked(lane); k++) {
        const step = Math.ceil(k / 2) * (ROW_H / 2) * (k % 2 ? 1 : -1);
        lane = start.y + step;
      }
      w.laneY = lane;
      segments.push({ wire: wi, net: w.from, gap: from + 1, yLeft: start.y, yRight: lane, x: 0 });
      if (lane !== w.pin.y) segments.push({ wire: wi, net: w.from, gap: to, yLeft: lane, yRight: w.pin.y, x: 0 });
    } else if (start.y !== w.pin.y) {
      segments.push({ wire: wi, net: w.from, gap: to, yLeft: start.y, yRight: w.pin.y, x: 0 });
    }
  });

  // Channel assignment per gap: every vertical run gets its own x, ordered to minimise crossings.
  for (let gap = 0; gap <= maxDepth; gap++) {
    const here = segments.filter((s) => s.gap === gap);
    if (!here.length) continue;
    const prevOut = gap === 0 ? INPUT_X + INPUT_W : Math.max(...spec.gates.filter((g) => depth[g.id] === gap - 1).map((g) => colLeft(gap - 1) + gateWidth(g.type)));
    const lo = prevOut + 10;
    const hi = colLeft(gap) - 16;
    const best = bestOrder(here);
    best.forEach((s, k) => (s.x = lo + ((k + 1) * (hi - lo)) / (best.length + 1)));
  }

  wires.forEach((w, wi) => {
    const start = outOf(w.from);
    const pts: Point[] = [start];
    for (const s of segments.filter((x) => x.wire === wi).sort((a, b) => a.gap - b.gap)) {
      pts.push({ x: s.x, y: s.yLeft }, { x: s.x, y: s.yRight });
    }
    pts.push(w.pin);
    w.points = pts;
  });

  // Junction dots: a wire turns off its signal while another wire of that signal carries on.
  for (const w of wires) {
    if (w.points.length < 3) continue;
    const turn = w.points[1];
    const carriesOn = wires.some((o) => o !== w && o.from === w.from && o.points[1].x > turn.x && o.points[1].y === turn.y);
    const oppositeBranch = wires.some((o) => o !== w && o.from === w.from && o.points.length > 2 && o.points[1].x === turn.x);
    if (carriesOn || oppositeBranch) w.junction = turn;
  }

  const outFrom = outOf(spec.outputGateId);
  const output = { from: outFrom, to: { x: outFrom.x + OUTPUT_STUB, y: outFrom.y } };

  const ys = [
    ...Object.values(inputs).flatMap((p) => [p.y - INPUT_H / 2, p.y + INPUT_H / 2]),
    ...spec.gates.flatMap((g) => [gates[g.id].y - GATE_H / 2 - 16, gates[g.id].y + GATE_H / 2 + (g.type === "NOT" ? 18 : 0)]),
    ...wires.flatMap((w) => w.points.map((p) => p.y)),
  ];
  const top = Math.min(...ys) - 12;
  const bottom = Math.max(...ys) + 12;
  const right = Math.max(output.to.x + 64, ...spec.gates.map((g) => gates[g.id].x + gateWidth(g.type) + 28));

  return {
    viewBox: { x: 0, y: top, width: right, height: bottom - top },
    inputs,
    gates,
    wires: wires.map(({ from, to, points, junction }) => ({ from, to, points, junction })),
    output,
  };
}

/** Left-to-right order of vertical runs in one gap with the fewest crossings and no overlaps. */
function bestOrder(segs: Segment[]): Segment[] {
  if (segs.length === 1) return segs;
  if (segs.length > 6) return [...segs].sort((a, b) => a.yLeft - b.yLeft);
  let best = segs;
  let bestCost = Infinity;
  permute(segs, (order) => {
    let cost = 0;
    for (let i = 0; i < order.length; i++)
      for (let j = i + 1; j < order.length; j++) cost += pairCost(order[i], order[j]);
    if (cost < bestCost) {
      bestCost = cost;
      best = [...order];
    }
  });
  return best;
}

/** Cost of placing run `a` to the left of run `b` in the same gap. */
function pairCost(a: Segment, b: Segment): number {
  if (a.net === b.net && a.yLeft === b.yLeft) return 0;
  const inside = (y: number, s: Segment) => y > Math.min(s.yLeft, s.yRight) && y < Math.max(s.yLeft, s.yRight);
  const touches = (y: number, s: Segment) => y === s.yLeft || y === s.yRight;
  let cost = 0;
  // b's incoming horizontal passes a's channel; a's outgoing horizontal passes b's channel.
  if (inside(b.yLeft, a)) cost += 1;
  if (inside(a.yRight, b)) cost += 1;
  if (touches(b.yLeft, a) || touches(a.yRight, b)) cost += 100;
  return cost;
}

function permute<T>(items: T[], visit: (order: T[]) => void, k = 0, work: T[] = [...items]): void {
  if (k === work.length) return visit(work);
  for (let i = k; i < work.length; i++) {
    [work[k], work[i]] = [work[i], work[k]];
    permute(items, visit, k + 1, work);
    [work[k], work[i]] = [work[i], work[k]];
  }
}
