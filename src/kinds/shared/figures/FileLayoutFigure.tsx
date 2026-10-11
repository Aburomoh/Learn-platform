import { useId } from "react";
import { focusTarget } from "@/interactions/shared/types";
import styles from "./figures.module.css";

export interface FileLayoutFigureProps {
  /** The slide's three organisations (Ch8 s.7–9). */
  layout: "sequential" | "direct" | "indexed";
  /** Record keys in file order: "A", "B" … or 10, 20 …; `indexed` reads them as the ordered file. */
  records: string[];
  /** The key being looked up: the search path is drawn to it (`key` in the spec; React reserves that prop name). */
  searchKey?: string;
  /** Indexed: records per block (the equal blocks the file is split into). Default 3. */
  blockSize?: number;
  /** Direct: the slot count of the relative file (addresses 0 … slots − 1). Default = records. */
  slots?: number;
  /** The part with the halo: "index", "blocks", "file", "hash", "record". */
  focus?: string;
  caption?: string;
}

// Geometry in SVG units (visual system §4): 330 wide, 15-unit text, never drawn below 0.8× (12 px).
const W = 330;
const CELL = 36;
const ROW = 30;
const PAD = 10;
const MIN_SCALE = 0.8;

/** Direct access needs a key → address rule; the slide says "computed from the key", so the drawing uses key mod slots. */
export const hash = (key: string, slots: number) => (Number.isFinite(Number(key)) ? Number(key) : [...key].reduce((a, c) => a + c.charCodeAt(0), 0)) % slots;

/**
 * A physical record organisation (CPET181 Ch8 s.7–9), a picture only (#605): the sequential file
 * (records in a row, the search sweeps from the start), the direct file (key → address → slot),
 * the indexed sequential file (an index of block keys over equal blocks). The searched key, when
 * given, lights the path to its record. Nothing is graded on the drawing.
 */
export function FileLayoutFigure({ layout, records, searchKey: key, blockSize = 3, slots, focus, caption }: FileLayoutFigureProps) {
  const id = useId().replace(/:/g, "");
  const n = records.length;
  const found = key === undefined ? -1 : records.indexOf(key);
  const cellW = Math.min(CELL, Math.floor((W - 2 * PAD) / Math.max(n, 1)));
  const rowX = (W - cellW * n) / 2;
  const focusOn = (part: string) => focus === part;

  const cellsRow = (y: number, keys: string[], x0: number, lit: number, part: string) => (
    <g data-part={part} data-focus={focusOn(part) || undefined} className={focusOn(part) ? styles.focus : ""} {...focusTarget(`part-${part}`)}>
      {focusOn(part) && <rect x={x0 - 5} y={y - 5} width={cellW * keys.length + 10} height={ROW + 10} rx="8" className={styles.hit} />}
      {keys.map((k, i) => (
        <g key={i} data-record={k} data-on={i === lit || undefined}>
          <rect x={x0 + i * cellW} y={y} width={cellW} height={ROW} className={styles.body} />
          {i === lit && <rect x={x0 + i * cellW + 2} y={y + 2} width={cellW - 4} height={ROW - 4} rx="3" className={styles.rowOn} />}
          <text x={x0 + i * cellW + cellW / 2} y={y + ROW / 2 + 5} textAnchor="middle" className={`${styles.label} ${i === lit ? styles.high : ""}`} style={{ fontSize: cellW < 30 ? 13 : undefined }}>
            {k}
          </text>
        </g>
      ))}
    </g>
  );
  const marker = (
    <defs>
      <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
      </marker>
    </defs>
  );

  let body: React.ReactNode;
  let total: number;
  let summary: string;

  if (layout === "sequential") {
    const y = 34;
    total = y + ROW + 44;
    body = (
      <>
        {cellsRow(y, records, rowX, found, "file")}
        {/* the search sweeps the records from the first one */}
        {found >= 0 && (
          <g className={styles.line} data-part="search">
            <path d={`M ${rowX + 4} ${y + ROW + 16} H ${rowX + found * cellW + cellW / 2}`} markerEnd={`url(#${id}-arrow)`} />
            <text x={rowX + 4} y={y + ROW + 36} className={styles.edgeLabel}>
              search from the start: {found + 1} record{found === 0 ? "" : "s"} read
            </text>
          </g>
        )}
      </>
    );
    summary = `Sequential file: records ${records.join(", ")} one after another.${found >= 0 ? ` Finding ${key} reads ${found + 1} record${found === 0 ? "" : "s"} from the start.` : ""}`;
  } else if (layout === "direct") {
    const count = slots ?? n;
    const addr = key === undefined ? -1 : hash(key, count);
    const placed = records.map((k) => hash(k, count));
    const slotKeys = Array.from({ length: count }, (_, a) => records.filter((k, i) => placed[i] === a).join("/") || "");
    const yHash = 30;
    const yFile = yHash + ROW + 40;
    total = yFile + ROW + 30;
    const slotW = Math.min(CELL, Math.floor((W - 2 * PAD) / count));
    const x0 = (W - slotW * count) / 2;
    body = (
      <>
        <g data-part="hash" data-focus={focusOn("hash") || undefined} className={`${styles.line} ${focusOn("hash") ? styles.focus : ""}`} {...focusTarget("part-hash")}>
          {focusOn("hash") && <rect x={W / 2 - 100} y={yHash - 5} width={200} height={ROW + 10} rx="8" className={styles.hit} />}
          <rect x={W / 2 - 92} y={yHash} width={184} height={ROW} rx="6" className={styles.body} />
          <text x={W / 2} y={yHash + ROW / 2 + 5} textAnchor="middle" className={styles.label}>
            {key === undefined ? "address = f(key)" : `address = f(${key}) = ${addr}`}
          </text>
          {addr >= 0 && <path d={`M ${W / 2} ${yHash + ROW} V ${yFile - 6} H ${x0 + addr * slotW + slotW / 2} V ${yFile - 2}`} markerEnd={`url(#${id}-arrow)`} />}
        </g>
        <g data-part="file" data-focus={focusOn("file") || undefined} className={focusOn("file") ? styles.focus : ""} {...focusTarget("part-file")}>
          {focusOn("file") && <rect x={x0 - 5} y={yFile - 5} width={slotW * count + 10} height={ROW + 10} rx="8" className={styles.hit} />}
          {slotKeys.map((k, a) => (
            <g key={a} data-slot={a} data-on={a === addr || undefined}>
              <rect x={x0 + a * slotW} y={yFile} width={slotW} height={ROW} className={styles.body} />
              {a === addr && <rect x={x0 + a * slotW + 2} y={yFile + 2} width={slotW - 4} height={ROW - 4} rx="3" className={styles.rowOn} />}
              <text x={x0 + a * slotW + slotW / 2} y={yFile + ROW / 2 + 5} textAnchor="middle" className={`${styles.label} ${a === addr ? styles.high : ""}`} style={{ fontSize: slotW < 30 || k.length > 2 ? 12 : undefined }}>
                {k}
              </text>
              <text x={x0 + a * slotW + slotW / 2} y={yFile + ROW + 16} textAnchor="middle" className={styles.sub} style={{ fontSize: 12 }}>
                {a}
              </text>
            </g>
          ))}
        </g>
      </>
    );
    const collisions = slotKeys.filter((k) => k.includes("/"));
    summary = `Direct file with ${count} slots: each key's address is computed from the key.${key !== undefined ? ` ${key} goes to address ${addr}.` : ""}${collisions.length ? ` Collision at ${collisions.join(", ")}.` : ""}`;
  } else {
    const blocks: string[][] = [];
    for (let i = 0; i < n; i += blockSize) blocks.push(records.slice(i, i + blockSize));
    const index = blocks.map((b) => b[b.length - 1]);
    const hitBlock = found < 0 ? -1 : Math.floor(found / blockSize);
    const yIndex = 30;
    const yBlocks = yIndex + ROW + 44;
    total = yBlocks + ROW + 30;
    const idxW = Math.min(64, Math.floor((W - 2 * PAD) / blocks.length));
    const ix0 = (W - idxW * blocks.length) / 2;
    const gap = 8;
    const blockW = cellW * blockSize;
    const bx0 = (W - blocks.length * blockW - (blocks.length - 1) * gap) / 2;
    body = (
      <>
        <g data-part="index" data-focus={focusOn("index") || undefined} className={`${styles.line} ${focusOn("index") ? styles.focus : ""}`} {...focusTarget("part-index")}>
          {focusOn("index") && <rect x={ix0 - 5} y={yIndex - 5} width={idxW * blocks.length + 10} height={ROW + 10} rx="8" className={styles.hit} />}
          {index.map((k, b) => (
            <g key={b} data-index={b} data-on={b === hitBlock || undefined}>
              <rect x={ix0 + b * idxW} y={yIndex} width={idxW} height={ROW} className={styles.body} />
              {b === hitBlock && <rect x={ix0 + b * idxW + 2} y={yIndex + 2} width={idxW - 4} height={ROW - 4} rx="3" className={styles.rowOn} />}
              <text x={ix0 + b * idxW + idxW / 2} y={yIndex + ROW / 2 + 5} textAnchor="middle" className={`${styles.label} ${b === hitBlock ? styles.high : ""}`} style={{ fontSize: 13 }}>
                ≤ {k}
              </text>
            </g>
          ))}
          <text x={ix0} y={yIndex - 8} className={styles.sub} style={{ fontSize: 13 }}>
            index: highest key per block
          </text>
          {hitBlock >= 0 && <path d={`M ${ix0 + hitBlock * idxW + idxW / 2} ${yIndex + ROW} V ${yBlocks - 14} H ${bx0 + hitBlock * (blockW + gap) + blockW / 2} V ${yBlocks - 2}`} markerEnd={`url(#${id}-arrow)`} />}
        </g>
        <g data-part="blocks" data-focus={focusOn("blocks") || undefined} className={focusOn("blocks") ? styles.focus : ""} {...focusTarget("part-blocks")}>
          {focusOn("blocks") && <rect x={bx0 - 5} y={yBlocks - 5} width={blocks.length * blockW + (blocks.length - 1) * gap + 10} height={ROW + 10} rx="8" className={styles.hit} />}
          {blocks.map((b, k) => (
            <g key={k} data-block={k}>
              {b.map((rec, i) => {
                const lit = k === hitBlock && k * blockSize + i === found;
                return (
                  <g key={i} data-record={rec} data-on={lit || undefined}>
                    <rect x={bx0 + k * (blockW + gap) + i * cellW} y={yBlocks} width={cellW} height={ROW} className={styles.body} />
                    {lit && <rect x={bx0 + k * (blockW + gap) + i * cellW + 2} y={yBlocks + 2} width={cellW - 4} height={ROW - 4} rx="3" className={styles.rowOn} />}
                    <text x={bx0 + k * (blockW + gap) + i * cellW + cellW / 2} y={yBlocks + ROW / 2 + 5} textAnchor="middle" className={`${styles.label} ${lit ? styles.high : ""}`} style={{ fontSize: cellW < 30 ? 13 : undefined }}>
                      {rec}
                    </text>
                  </g>
                );
              })}
              <text x={bx0 + k * (blockW + gap) + blockW / 2} y={yBlocks + ROW + 16} textAnchor="middle" className={styles.sub} style={{ fontSize: 12 }}>
                block {k}
              </text>
            </g>
          ))}
        </g>
      </>
    );
    summary = `Indexed sequential file: ${blocks.length} blocks of ${blockSize} ordered records (${records.join(", ")}) with an index of the highest key per block.${found >= 0 ? ` Finding ${key}: the index points to block ${hitBlock}, then the record.` : ""}`;
  }

  return (
    <div className={styles.well}>
      <svg viewBox={`0 0 ${W} ${total}`} className={`${styles.svg} ${styles.center}`} style={{ maxWidth: Math.round(W * 1.25), minWidth: Math.round(W * MIN_SCALE) }} role="img" aria-label={caption ?? summary} {...focusTarget("file-layout")}>
        {marker}
        {body}
      </svg>
    </div>
  );
}
