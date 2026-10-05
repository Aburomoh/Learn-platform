/**
 * Pure layout for CircuitDiagram: gate positions, one pin per gate input, and right-angle wires.
 * Each wire that needs a vertical run gets its own channel (x position) in the gap before its
 * destination column, so wires of different signals never share a segment.
 */
import type { CircuitShape, GateType } from "./circuit";

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
  /** The stub of `outputGateId` (kept for callers that need the main output only). */
  output: { from: Point; to: Point };
  /** One stub per circuit output: `outputGateId`, then every other labelled gate that feeds no gate (S and C of a half adder). */
  outputs: OutputLayout[];
}

export interface OutputLayout {
  gateId: string;
  /** The gate's label, "Y" for an unlabelled main output. */
  label: string;
  from: Point;
  to: Point;
}

/** The circuit's outputs in drawing order: the main output gate, then other labelled gates nothing reads. */
export function outputGates(spec: CircuitShape): { gateId: string; label: string }[] {
  const read = new Set(spec.gates.flatMap((g) => g.from));
  const main = spec.gates.find((g) => g.id === spec.outputGateId);
  const others = spec.gates.filter((g) => g.id !== spec.outputGateId && g.label && !read.has(g.id));
  return [{ gateId: spec.outputGateId, label: main?.label ?? "Y" }, ...others.map((g) => ({ gateId: g.id, label: g.label! }))];
}

export const GATE_H = 44;
export const INPUT_W = 38;
export const INPUT_H = 40;
const INPUT_X = 4;
const ROW_H = 70;
const COL_X0 = 82;
const COL_W = 104;
const PIN_DY = 11;
const MIN_GATE_GAP = 64;
/** A horizontal wire closer than this to a gate centre line would run through its body or label. */
const BODY_CLEARANCE = 40;
const OUTPUT_STUB = 20;
/** Vertical runs of different signals in one gap are at least this far apart (#387). */
export const CHANNEL_GAP = 16;
/** The last channel stays this far left of the nearest gate pin, so the value label on the stub has room. */
export const PIN_CLEARANCE = 20;

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

export function gateDepths(spec: CircuitShape): Record<string, number> {
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

/** One signal's trunk in a gap: it arrives at `yLeft` and branches to every `yRights`. */
interface Channel {
  net: string;
  yLeft: number;
  yRights: number[];
  segments: Segment[];
  x: number;
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

export function layoutCircuit(spec: CircuitShape): CircuitLayout {
  const depth = gateDepths(spec);
  const maxDepth = Math.max(...Object.values(depth));
  const gateById = Object.fromEntries(spec.gates.map((g) => [g.id, g]));
  // Column x: the default grid, pushed right where a gap needs more channels (assigned below).
  const colX: number[] = Array.from({ length: maxDepth + 1 }, (_, d) => COL_X0 + d * COL_W);

  const inputs: Record<string, Point> = {};
  spec.inputs.forEach((inp, i) => (inputs[inp.id] = { x: INPUT_X + INPUT_W / 2, y: i * ROW_H }));

  // Gate rows: centre each gate on its sources, then keep gates in one column apart.
  const gates: Record<string, Point> = {};
  const yOf = (id: string) => (inputs[id] ?? gates[id]).y;
  for (let d = 0; d <= maxDepth; d++) {
    const column = spec.gates.filter((g) => depth[g.id] === d);
    for (const g of column) {
      const ys = g.from.map(yOf);
      gates[g.id] = { x: colX[d], y: ys.reduce((a, b) => a + b, 0) / ys.length };
    }
    const sorted = [...column].sort((a, b) => gates[a.id].y - gates[b.id].y);
    for (let i = 1; i < sorted.length; i++) {
      const prev = gates[sorted[i - 1].id];
      const cur = gates[sorted[i].id];
      if (cur.y - prev.y < MIN_GATE_GAP) cur.y = prev.y + MIN_GATE_GAP;
    }
  }

  const outX = (id: string) => (inputs[id] ? INPUT_X + INPUT_W : gates[id].x + gateWidth(gateById[id].type));
  const outOf = (id: string): Point => ({ x: outX(id), y: yOf(id) });
  const colOf = (id: string) => (inputs[id] ? -1 : depth[id]);

  // One wire per gate input; the upper source takes the upper pin so the pair never crosses.
  // Pin x follows the gate once its column is placed; pin y is known now.
  const wires: (WireLayout & { pinDx: number; pinY: number; laneY?: number })[] = [];
  for (const g of spec.gates) {
    const single = g.from.length === 1;
    const order = g.from.map((f, i) => ({ f, i })).sort((a, b) => yOf(a.f) - yOf(b.f) || a.i - b.i);
    order.forEach(({ f }, k) => {
      wires.push({ from: f, to: g.id, points: [], pinDx: pinInset(g.type, single), pinY: gates[g.id].y + (single ? 0 : k === 0 ? -PIN_DY : PIN_DY) });
    });
  }

  // A wire that would pass through a gate in a column it skips is moved to a free lane.
  const segments: Segment[] = [];
  wires.forEach((w, wi) => {
    const startY = yOf(w.from);
    const from = colOf(w.from);
    const to = depth[w.to];
    const crossed = spec.gates.filter((h) => depth[h.id] > from && depth[h.id] < to);
    const blocked = (y: number) => crossed.some((h) => Math.abs(gates[h.id].y - y) < BODY_CLEARANCE);
    if (blocked(startY)) {
      let lane = startY;
      for (let k = 1; k < 12 && blocked(lane); k++) {
        const step = Math.ceil(k / 2) * (ROW_H / 2) * (k % 2 ? 1 : -1);
        lane = startY + step;
      }
      w.laneY = lane;
      segments.push({ wire: wi, net: w.from, gap: from + 1, yLeft: startY, yRight: lane, x: 0 });
      if (lane !== w.pinY) segments.push({ wire: wi, net: w.from, gap: to, yLeft: lane, yRight: w.pinY, x: 0 });
    } else if (startY !== w.pinY) {
      segments.push({ wire: wi, net: w.from, gap: to, yLeft: startY, yRight: w.pinY, x: 0 });
    }
  });

  // Channel assignment per gap (#387): the vertical runs of one signal share one channel (a trunk
  // with branches); channels are CHANNEL_GAP apart and PIN_CLEARANCE left of the nearest pin. A gap
  // that needs more room pushes its column, and every later one, to the right.
  const channelsByGap: Channel[][] = [];
  for (let gap = 0; gap <= maxDepth; gap++) {
    const here = segments.filter((seg) => seg.gap === gap);
    const channels: Channel[] = [];
    for (const seg of here) {
      let ch = channels.find((c) => c.net === seg.net && c.yLeft === seg.yLeft);
      if (!ch) channels.push((ch = { net: seg.net, yLeft: seg.yLeft, yRights: [], segments: [], x: 0 }));
      ch.yRights.push(seg.yRight);
      ch.segments.push(seg);
    }
    // a wire of the same signal that runs straight into this column branches off the trunk too
    wires.forEach((w) => {
      if (depth[w.to] !== gap || w.laneY !== undefined) return;
      const ch = channels.find((c) => c.net === w.from && c.yLeft === w.pinY && c.yLeft === yOf(w.from));
      if (ch) ch.yRights.push(w.pinY);
    });
    channelsByGap.push(channels);
    if (!channels.length) continue;
    const prevOut = gap === 0 ? INPUT_X + INPUT_W : Math.max(...spec.gates.filter((g) => depth[g.id] === gap - 1).map((g) => colX[gap - 1] + gateWidth(g.type)));
    const lo = prevOut + 12;
    const minPin = Math.min(...wires.filter((w) => depth[w.to] === gap).map((w) => w.pinDx));
    const needed = lo + (channels.length - 1) * CHANNEL_GAP + PIN_CLEARANCE - minPin;
    if (needed > colX[gap]) {
      const shift = needed - colX[gap];
      for (let d = gap; d <= maxDepth; d++) colX[d] += shift;
      for (const g of spec.gates) if (depth[g.id] >= gap) gates[g.id].x += shift;
    }
    const hi = colX[gap] + minPin - PIN_CLEARANCE;
    const best = bestOrder(channels);
    // spread over the room there is, never closer than CHANNEL_GAP
    const step = best.length > 1 ? Math.max(CHANNEL_GAP, (hi - lo) / (best.length + 1)) : 0;
    const first = best.length > 1 ? hi - (best.length - 1) * step - Math.max(0, (hi - lo - (best.length - 1) * step) / 2) : (lo + hi) / 2;
    best.forEach((ch, k) => {
      ch.x = first + k * step;
      for (const seg of ch.segments) seg.x = ch.x;
    });
  }

  wires.forEach((w, wi) => {
    const pts: Point[] = [outOf(w.from)];
    for (const seg of segments.filter((x) => x.wire === wi).sort((a, b) => a.gap - b.gap)) {
      pts.push({ x: seg.x, y: seg.yLeft }, { x: seg.x, y: seg.yRight });
    }
    pts.push({ x: gates[w.to].x + w.pinDx, y: w.pinY });
    w.points = pts;
  });

  // Junction dots only where a wire really branches: three or more ways meet on a trunk.
  for (const channels of channelsByGap) {
    for (const ch of channels) {
      const ys = [ch.yLeft, ...ch.yRights];
      const top = Math.min(...ys);
      const bottom = Math.max(...ys);
      for (const y of new Set(ys)) {
        const ways = (y === ch.yLeft ? 1 : 0) + ch.yRights.filter((r) => r === y).length + (top < y ? 1 : 0) + (bottom > y ? 1 : 0);
        if (ways < 3) continue;
        // hang the dot on a wire that turns there (its first point on this trunk)
        const seg = ch.segments.find((x) => x.yRight === y || x.yLeft === y)!;
        const w = wires[seg.wire];
        if (!w.junction) w.junction = { x: ch.x, y };
        else wires.find((o) => o.from === ch.net && !o.junction && o !== w && o.points.some((pt) => pt.x === ch.x))!.junction = { x: ch.x, y };
      }
    }
  }

  const outFrom = outOf(spec.outputGateId);
  const output = { from: outFrom, to: { x: outFrom.x + OUTPUT_STUB, y: outFrom.y } };
  const outputs: OutputLayout[] = outputGates(spec).map((o) => {
    const from = outOf(o.gateId);
    return { ...o, from, to: { x: from.x + OUTPUT_STUB, y: from.y } };
  });

  const ys = [
    ...Object.values(inputs).flatMap((p) => [p.y - INPUT_H / 2, p.y + INPUT_H / 2]),
    ...spec.gates.flatMap((g) => [gates[g.id].y - GATE_H / 2 - 16, gates[g.id].y + GATE_H / 2 + (g.type === "NOT" ? 18 : 0)]),
    ...wires.flatMap((w) => w.points.map((p) => p.y)),
  ];
  const top = Math.min(...ys) - 12;
  const bottom = Math.max(...ys) + 12;
  const right = Math.max(...outputs.map((o) => o.to.x + 44), ...spec.gates.map((g) => gates[g.id].x + gateWidth(g.type) + 28));

  return {
    viewBox: { x: 0, y: top, width: right, height: bottom - top },
    inputs,
    gates,
    wires: wires.map(({ from, to, points, junction }) => ({ from, to, points, junction })),
    output,
    outputs,
  };
}

/** Left-to-right order of the channels in one gap with the fewest crossings and no overlaps. */
function bestOrder(channels: Channel[]): Channel[] {
  if (channels.length === 1) return channels;
  if (channels.length > 6) return [...channels].sort((a, b) => a.yLeft - b.yLeft);
  let best = channels;
  let bestCost = Infinity;
  permute(channels, (order) => {
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

/** Cost of placing channel `a` to the left of channel `b` in the same gap. */
function pairCost(a: Channel, b: Channel): number {
  const span = (c: Channel) => [Math.min(c.yLeft, ...c.yRights), Math.max(c.yLeft, ...c.yRights)];
  const inside = (y: number, c: Channel) => y > span(c)[0] && y < span(c)[1];
  const touches = (y: number, c: Channel) => y === span(c)[0] || y === span(c)[1] || y === c.yLeft || c.yRights.includes(y);
  let cost = 0;
  // b's incoming horizontal passes a's trunk; a's outgoing branches pass b's trunk.
  if (inside(b.yLeft, a)) cost += 1;
  if (touches(b.yLeft, a)) cost += 100;
  for (const y of a.yRights) {
    if (inside(y, b)) cost += 1;
    if (touches(y, b)) cost += 100;
  }
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
