import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export interface TracksFigureProps {
  /** `concentric`: separate rings (magnetic disk). `spiral`: one long track from the centre out (optical disc). */
  tracks: "concentric" | "spiral";
  caption?: string;
}

// Geometry in SVG units (visual system §4): 330 wide, never drawn below 0.8×.
const W = 330;
const CX = W / 2;
const CY = 92;
const PLATTER = 80;
const HUB = 12;
const MIN_SCALE = 0.8;

/** An Archimedean spiral from the hub to the rim, as an SVG path. */
function spiralPath(turns: number, r0: number, r1: number): string {
  const steps = turns * 48;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * 2 * Math.PI;
    const r = r0 + (r1 - r0) * t;
    pts.push(`${(CX + r * Math.cos(a)).toFixed(1)} ${(CY + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")}`;
}

/**
 * A platter seen from above (CPET181 Ch7 s.16, s.22, #615): concentric tracks, one inside the other,
 * or one long spiral track from the centre to the edge. A picture only, for telling the two apart;
 * the accessible name describes the shape and does not name the medium.
 */
export function TracksFigure({ tracks, caption }: TracksFigureProps) {
  const rings = [28, 42, 56, 70];
  const summary = caption ?? (tracks === "concentric" ? "A platter with four separate rings, one inside the other, around a hub." : "A platter with one track spiralling out from the hub to the edge.");
  const total = CY + PLATTER + 12;
  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.1), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("tracks")}>
        <circle cx={CX} cy={CY} r={PLATTER} className={styles.body} />
        <g className={styles.line} data-tracks={tracks}>
          {tracks === "concentric" ? rings.map((r) => <circle key={r} cx={CX} cy={CY} r={r} className={styles.wire} data-track="ring" />) : <path d={spiralPath(4, HUB + 6, PLATTER - 10)} className={styles.wire} data-track="spiral" />}
        </g>
        <circle cx={CX} cy={CY} r={HUB} className={styles.body} />
      </svg>
    </div>
  );
}
