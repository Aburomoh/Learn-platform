import { useId } from "react";
import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export interface ResourceEdge {
  process: string;
  resource: string;
  /** `holds`: the resource is allocated to the process (solid arrow resource → process). `requests`: the process waits for it (dashed arrow process → resource). */
  kind: "holds" | "requests";
  /** A label on the arrow as the slides write it: "holds", "requests", "assigned to", "waiting for". */
  label?: string;
}

export interface ResourceGraphFigureProps {
  /** Process names in drawing order: P1, P2 … (circles, top row). */
  processes: string[];
  /** Resource names in drawing order: R1, F2, tape drive … (boxes, bottom row). */
  resources: string[];
  edges: ResourceEdge[];
  /** The node with the halo (a process or resource name). */
  focus?: string;
  /** One line read to assistive technology instead of the generated list, when content has a better one. */
  caption?: string;
}

// Geometry in SVG units (visual system §4): 330 wide, 15-unit text, never drawn below 0.8× (12 px).
const W = 330;
const R = 20;
const BOX_W = 76;
const BOX_H = 34;
const TOP_Y = 36;
const BOTTOM_Y = 132;
const MIN_SCALE = 0.8;

/**
 * A resource-allocation sketch (CPET181 Ch5 s.7, s.13, s.16–19): circles for processes, boxes for
 * resources; a solid arrow from a resource to a process means allocated (held), a dashed arrow from
 * a process to a resource means requested. A picture only (#605): no values, no result state; the
 * deadlock cases and the four conditions are told by the prompt, not graded on the drawing.
 */
export function ResourceGraphFigure({ processes, resources, edges, focus, caption }: ResourceGraphFigureProps) {
  const id = useId().replace(/:/g, "");
  const spread = (n: number, i: number) => (W * (i + 1)) / (n + 1);
  const px = (name: string) => spread(processes.length, processes.indexOf(name));
  const rx = (name: string) => spread(resources.length, resources.indexOf(name));
  const total = BOTTOM_Y + BOX_H / 2 + 34;
  const summary =
    caption ??
    `Processes ${processes.join(", ")}; resources ${resources.join(", ")}. ${edges.map((e) => (e.kind === "holds" ? `${e.resource} is allocated to ${e.process}` : `${e.process} requests ${e.resource}`)).join("; ")}.`;

  // an edge runs between the two shapes' edges, in the direction of the arrow
  const edge = (e: ResourceEdge, k: number) => {
    const x1 = px(e.process);
    const x2 = rx(e.resource);
    const dx = x2 - x1;
    const dy = BOTTOM_Y - TOP_Y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // where the line leaves the circle and meets the box (approximating the box by its half-height)
    const pStart = { x: x1 + ux * (R + 2), y: TOP_Y + uy * (R + 2) };
    const rEnd = { x: x2 - ux * (BOX_H / 2 + 4), y: BOTTOM_Y - uy * (BOX_H / 2 + 4) };
    const from = e.kind === "requests" ? pStart : rEnd;
    const to = e.kind === "requests" ? rEnd : pStart;
    // the label sits a third of the way from the arrow's origin, offset to the side, so two labels never meet
    const t = e.kind === "requests" ? 0.2 : 0.8;
    const at = { x: pStart.x + (rEnd.x - pStart.x) * t, y: pStart.y + (rEnd.y - pStart.y) * t };
    const side = dx >= 0 ? -1 : 1;
    const labelAt = { x: at.x + side * uy * 12, y: at.y - side * ux * 12 };
    const focused = focus === e.process || focus === e.resource;
    return (
      <g key={k} className={`${styles.line} ${focused ? styles.focus : ""}`} data-edge={`${e.process}-${e.resource}`} data-kind={e.kind}>
        <path d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} className={e.kind === "requests" ? styles.dashed : ""} markerEnd={`url(#${id}-arrow)`} />
        {e.label && (
          <text x={labelAt.x} y={labelAt.y + 4} textAnchor="middle" className={styles.edgeLabel}>
            {e.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.25), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("resource-graph")}>
        <defs>
          <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
          </marker>
        </defs>
        {edges.map(edge)}
        {processes.map((p) => {
          const focused = focus === p;
          return (
            <g key={p} data-node={p} data-shape="process" data-focus={focused || undefined} className={focused ? styles.focus : ""} {...focusTarget(`node-${p}`)}>
              {focused && <circle cx={px(p)} cy={TOP_Y} r={R + 6} className={styles.hit} />}
              <circle cx={px(p)} cy={TOP_Y} r={R} className={styles.body} />
              <text x={px(p)} y={TOP_Y + 5} textAnchor="middle" className={styles.label}>
                {p}
              </text>
            </g>
          );
        })}
        {resources.map((r) => {
          const focused = focus === r;
          const x = rx(r);
          return (
            <g key={r} data-node={r} data-shape="resource" data-focus={focused || undefined} className={focused ? styles.focus : ""} {...focusTarget(`node-${r}`)}>
              {focused && <rect x={x - BOX_W / 2 - 5} y={BOTTOM_Y - BOX_H / 2 - 5} width={BOX_W + 10} height={BOX_H + 10} rx="10" className={styles.hit} />}
              <rect x={x - BOX_W / 2} y={BOTTOM_Y - BOX_H / 2} width={BOX_W} height={BOX_H} rx="6" className={styles.body} />
              <text x={x} y={BOTTOM_Y + 5} textAnchor="middle" className={styles.label}>
                {r}
              </text>
            </g>
          );
        })}
        {/* the slide's key: solid = allocated, dashed = requested (shape, never colour alone) */}
        <g className={styles.line} aria-hidden="true">
          <path d={`M 12 ${total - 10} H 36`} markerEnd={`url(#${id}-arrow)`} />
          <text x={42} y={total - 6} className={styles.edgeLabel}>
            allocated
          </text>
          <path d={`M 118 ${total - 10} H 142`} className={styles.dashed} markerEnd={`url(#${id}-arrow)`} />
          <text x={148} y={total - 6} className={styles.edgeLabel}>
            requested
          </text>
        </g>
      </svg>
    </div>
  );
}
