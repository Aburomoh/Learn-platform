import { focusTarget } from "@/interactions/shared/types";
import { translate, type MemoryTableGiven } from "./memoryTable";
import styles from "./figures.module.css";

export interface MemoryTableFigureProps extends MemoryTableGiven {
  unit?: string;
  /** Result state: the translation is computed and drawn (the row lit, the strips filled). */
  revealed?: boolean;
  /** The part with the halo: row, number, displacement, physical. */
  focus?: string;
}

// Geometry in SVG units (visual system §4): 15-unit text, 28-unit rows; the table never drawn below 0.8× (12 px).
const W = 330;
const ROW = 28;
const PAD = 10;
const MIN_SCALE = 0.8;

const fmt = (v: number) => String(v);

/**
 * The slide's page map table or segment map table (Ch3 s.8–9, s.13, s.17) with the logical →
 * physical address strips under it. Given: the table and the logical address. The page (or
 * segment) number, the displacement, the frame or base and the physical address read "?" until the
 * result state, where they are computed (`translate`) and the table row lights up. Never authored.
 */
export function MemoryTableFigure({ table, size, rows, address, unit = "", revealed = false, focus }: MemoryTableFigureProps) {
  const paging = table === "page";
  const t = translate({ table, size, rows, address });
  const show = revealed && t ? t : null;
  const q = (v: number | undefined | null) => (v === undefined || v === null ? "?" : fmt(v));
  const columns = paging ? ["Page", "Frame"] : ["Segment", "Size", "Address"];
  const colX = paging ? [PAD + 50, PAD + 150] : [PAD + 8, PAD + 200, PAD + 280];
  const tableH = ROW * (rows.length + 1);
  const stripsTop = PAD + tableH + 18;
  const hasAddress = address !== undefined;
  const STRIPS = 3;
  const total = stripsTop + (hasAddress ? STRIPS * ROW + 4 : 0) + PAD;
  const logical = typeof address === "number" ? fmt(address) : address ? `${fmt(address.part)}, ${fmt(address.offset)}` : "";
  const partName = paging ? "page" : "segment";
  const atName = paging ? "frame" : "base";
  const given = typeof address === "object" && address ? address : null;

  const summary =
    `${paging ? "Page map table" : "Segment map table"}: ${rows.map((r) => (paging ? `page ${r.id} in frame ${r.at}` : `segment ${r.id}${r.name ? ` (${r.name})` : ""}, ${r.size ?? ""} at ${r.at}`)).join("; ")}.` +
    (paging && size ? ` Page size ${size}${unit ? ` ${unit}` : ""}.` : "") +
    (hasAddress ? ` Address ${logical}.` : "") +
    (show ? ` ${partName} ${show.part}, displacement ${show.displacement}, ${atName} ${show.at}, physical address ${show.physical}.` : "");

  const cell = (name: string, x: number, y: number, text: string, extra = "", anchor: "middle" | "start" = "middle") => (
    <text x={x} y={y} textAnchor={anchor} className={`${styles.pin} mono ${extra}`} data-cell={name}>
      {text}
    </text>
  );
  const strip = (name: string, y: number, parts: { label: string; value: string; result?: boolean }[]) => {
    const focused = focus === name;
    return (
      <g data-line={name} data-focus={focused || undefined} className={`${styles.line} ${focused ? styles.focus : ""}`} {...focusTarget(`line-${name}`)}>
        {focused && <rect x={2} y={y - 19} width={W - 4} height={ROW} className={styles.hit} />}
        <text x={PAD} y={y} className={`${styles.pin} mono`}>
          {parts.map((p, i) => (
            <tspan key={i}>
              {i > 0 ? "  " : ""}
              {p.label}
              <tspan className={`${styles.value} ${p.value === "?" ? styles.asked : p.result ? styles.high : ""}`}>{p.value}</tspan>
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.25), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={summary} {...focusTarget("memory-table")}>
        {/* the table: header, then one row per page or segment; the translated row lights up in the result state */}
        <g data-table={table}>
          <rect x={PAD} y={PAD} width={W - 2 * PAD} height={tableH} rx="6" className={styles.body} />
          <line x1={PAD} y1={PAD + ROW} x2={W - PAD} y2={PAD + ROW} className={styles.wire} />
          {columns.map((c, i) => (
            <text key={c} x={colX[i]} y={PAD + ROW - 9} textAnchor={!paging && i === 0 ? "start" : "middle"} className={styles.sub}>
              {c}
            </text>
          ))}
          {rows.map((r, k) => {
            const y = PAD + ROW * (k + 1);
            const hit = show !== null && r.id === show.part;
            const focusedRow = focus === "row" && t !== null && r.id === t.part;
            return (
              <g key={r.id} data-row={r.id} data-on={hit || undefined} data-focus={focusedRow || undefined} className={`${focusedRow ? styles.focus : ""} ${hit ? styles.on : ""}`} {...focusTarget(`row-${r.id}`)}>
                {(hit || focusedRow) && <rect x={PAD + 2} y={y + 2} width={W - 2 * PAD - 4} height={ROW - 4} rx="4" className={hit ? styles.rowOn : styles.hit} />}
                {cell("id", colX[0], y + ROW - 9, paging ? fmt(r.id) : `${r.id}${r.name ? ` ${r.name}` : ""}`, hit ? styles.high : "", paging ? "middle" : "start")}
                {paging ? cell("at", colX[1], y + ROW - 9, fmt(r.at), hit ? styles.high : "") : cell("size", colX[1], y + ROW - 9, r.size === undefined ? "" : fmt(r.size))}
                {!paging && cell("at", colX[2], y + ROW - 9, fmt(r.at), hit ? styles.high : "")}
              </g>
            );
          })}
        </g>
        {hasAddress && (
          <>
            {/* the translation in the slide's three steps: the number, the displacement, the physical address */}
            {strip("number", stripsTop + 10, paging ? [{ label: `${partName} = ⌊${logical} ÷ ${q(size)}⌋ = `, value: q(show?.part), result: true }] : [{ label: `${partName} `, value: q(given?.part), result: false }])}
            {strip("displacement", stripsTop + 10 + ROW, paging ? [{ label: `displacement = ${logical} − `, value: q(show?.part), result: true }, { label: ` × ${q(size)} = `, value: q(show?.displacement), result: true }] : [{ label: "displacement ", value: q(given?.offset), result: false }])}
            {strip("physical", stripsTop + 10 + 2 * ROW, paging ? [{ label: `physical = ${atName} `, value: q(show?.at), result: true }, { label: ` × ${q(size)} + `, value: q(show?.displacement), result: true }, { label: " = ", value: q(show?.physical), result: true }] : [{ label: `physical = ${atName} `, value: q(show?.at), result: true }, { label: ` + ${q(given?.offset)} = `, value: q(show?.physical), result: true }])}
          </>
        )}
      </svg>
    </div>
  );
}
