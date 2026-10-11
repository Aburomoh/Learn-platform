import { useId } from "react";
import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export type Topology = "star" | "ring" | "bus" | "tree" | "hybrid";

export interface TopologyFigureProps {
  topology: Topology;
  /** Sites drawn (star: besides the centre; hybrid: fixed at seven). Default 6. */
  nodes?: number;
  caption?: string;
}

/** The accessible name describes the shape and never names the topology, so identify questions stay fair. */
export const TOPOLOGY_SUMMARY: Record<Topology, (n: number) => string> = {
  star: (n) => `A central node with ${n} other nodes, each linked to the centre alone.`,
  ring: (n) => `${n} nodes joined in a closed loop, each to its two neighbours, with the traffic going one way round.`,
  bus: (n) => `${n} nodes hanging off one shared line, with an end point at each end.`,
  tree: (n) => `${n} nodes branching out from one root along cables that never close a loop.`,
  hybrid: () => "A central hub with three nodes, linked by one cable to a closed loop of four nodes.",
};

// Geometry in SVG units (visual system §4): 330 wide, never drawn below 0.8×.
const W = 330;
const R = 11;
const MIN_SCALE = 0.8;

type Pt = { x: number; y: number };
const onCircle = (cx: number, cy: number, r: number, n: number, i: number, start = -Math.PI / 2): Pt => ({ x: cx + r * Math.cos(start + (2 * Math.PI * i) / n), y: cy + r * Math.sin(start + (2 * Math.PI * i) / n) });
const seg = (a: Pt, b: Pt, trim: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return `M ${(a.x + (dx / len) * trim).toFixed(1)} ${(a.y + (dy / len) * trim).toFixed(1)} L ${(b.x - (dx / len) * trim).toFixed(1)} ${(b.y - (dy / len) * trim).toFixed(1)}`;
};

/**
 * A network topology as a sketch (CPET181 Ch9 s.7–12, #615): star, ring, bus, tree or hybrid, with
 * unlabelled sites so the student tells the shapes apart. A picture only: no values, no result state.
 * The centre of a star and the end points of a bus are squares (a controller), sites are circles.
 */
export function TopologyFigure({ topology, nodes = 6, caption }: TopologyFigureProps) {
  const id = useId().replace(/:/g, "");
  const summary = caption ?? TOPOLOGY_SUMMARY[topology](topology === "hybrid" ? 7 : nodes);
  let total = 180;
  const site = (p: Pt, k: string, kind: "site" | "hub" | "end" = "site") =>
    kind === "site" ? (
      <circle key={k} cx={p.x} cy={p.y} r={R} className={styles.body} data-node={kind} />
    ) : (
      <rect key={k} x={p.x - R} y={p.y - R} width={2 * R} height={2 * R} rx="3" className={styles.body} data-node={kind} />
    );

  let lines: string[] = [];
  let arrows: string[] = [];
  let shapes: React.ReactNode[] = [];

  if (topology === "star") {
    const c = { x: W / 2, y: 90 };
    const pts = Array.from({ length: nodes }, (_, i) => onCircle(c.x, c.y, 68, nodes, i));
    lines = pts.map((p) => seg(c, p, R + 1));
    shapes = [site(c, "hub", "hub"), ...pts.map((p, i) => site(p, `s${i}`))];
  } else if (topology === "ring") {
    const c = { x: W / 2, y: 90 };
    const pts = Array.from({ length: nodes }, (_, i) => onCircle(c.x, c.y, 68, nodes, i));
    arrows = pts.map((p, i) => seg(p, pts[(i + 1) % nodes], R + 2));
    shapes = pts.map((p, i) => site(p, `s${i}`));
  } else if (topology === "bus") {
    const y = 60;
    const x0 = 24;
    const x1 = W - 24;
    const step = (x1 - x0 - 40) / (nodes - 1);
    const pts = Array.from({ length: nodes }, (_, i) => ({ x: x0 + 20 + i * step, y: y + 48 }));
    lines = [`M ${x0 + R} ${y} L ${x1 - R} ${y}`, ...pts.map((p) => `M ${p.x} ${y} L ${p.x} ${p.y - R - 1}`)];
    shapes = [site({ x: x0, y }, "e0", "end"), site({ x: x1, y }, "e1", "end"), ...pts.map((p, i) => site(p, `s${i}`))];
    total = y + 48 + R + 16;
  } else if (topology === "tree") {
    // a root, two branches, the rest spread under the branches
    const root = { x: W / 2, y: 28 };
    const branches = [
      { x: W / 2 - 80, y: 84 },
      { x: W / 2 + 80, y: 84 },
    ];
    const leafCount = Math.max(0, nodes - 3);
    const leaves = Array.from({ length: leafCount }, (_, i) => {
      const side = i % 2;
      const k = Math.floor(i / 2);
      const perSide = Math.ceil((leafCount - side) / 2);
      const spread = Math.min(44, 120 / Math.max(perSide, 1));
      return { x: branches[side].x + (k - (perSide - 1) / 2) * spread, y: 140, parent: branches[side] };
    });
    lines = [...branches.map((b) => seg(root, b, R + 1)), ...leaves.map((l) => seg(l.parent, l, R + 1))];
    shapes = [site(root, "root"), ...branches.map((b, i) => site(b, `b${i}`)), ...leaves.map((l, i) => site(l, `l${i}`))];
    total = 140 + R + 16;
  } else {
    const hub = { x: 78, y: 90 };
    const starPts = [0, 1, 2].map((i) => onCircle(hub.x, hub.y, 50, 3, i, Math.PI * 0.5));
    const rc = { x: 240, y: 90 };
    const ringPts = [0, 1, 2, 3].map((i) => onCircle(rc.x, rc.y, 50, 4, i, Math.PI));
    lines = [...starPts.map((p) => seg(hub, p, R + 1)), seg(hub, ringPts[0], R + 1)];
    arrows = ringPts.map((p, i) => seg(p, ringPts[(i + 1) % 4], R + 2));
    shapes = [site(hub, "hub", "hub"), ...starPts.map((p, i) => site(p, `s${i}`)), ...ringPts.map((p, i) => site(p, `r${i}`))];
  }

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.1), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} data-topology={topology} {...focusTarget("topology")}>
        <defs>
          <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
          </marker>
        </defs>
        <g className={styles.line}>
          {lines.map((d, i) => (
            <path key={`l${i}`} d={d} />
          ))}
          {arrows.map((d, i) => (
            <path key={`a${i}`} d={d} markerEnd={`url(#${id}-arrow)`} />
          ))}
        </g>
        {shapes}
      </svg>
    </div>
  );
}
