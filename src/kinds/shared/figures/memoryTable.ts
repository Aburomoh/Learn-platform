/**
 * Page map and segment map tables (CPET181 Ch3, #605): what a `memory-table` figure computes from
 * what content gives. Pure; the figure never prints an authored answer (ADR-0009).
 * Paging (s.11–13): page = ⌊address ÷ page size⌋, displacement = address − page × size,
 * physical = frame × size + displacement. Segmentation (s.17): physical = base + displacement.
 */

export interface MemoryTableRow {
  /** Page or segment number, in table order (0, 1, 2 …). */
  id: number;
  /** Segment name as the slide writes it: "main program", "subroutine A". */
  name?: string;
  /** Segment size (segments only). */
  size?: number;
  /** Page: the frame number. Segment: the memory address where it starts. */
  at: number;
}

export interface MemoryTableGiven {
  table: "page" | "segment";
  /** Page size (pages only). */
  size?: number;
  rows: MemoryTableRow[];
  /** The logical address to translate: one number (paging), or segment number and displacement (segmentation). */
  address?: number | { part: number; offset: number };
}

export interface Translation {
  /** The page or segment number. */
  part: number;
  displacement: number;
  /** The frame number (pages) or the segment's base address. */
  at: number;
  /** Frame × size for a page; the base itself for a segment. */
  start: number;
  physical: number;
}

/** The translation of the given address, or null when none is given. */
export function translate(f: MemoryTableGiven): Translation | null {
  if (f.address === undefined) return null;
  if (f.table === "page") {
    const size = f.size ?? 0;
    const address = typeof f.address === "number" ? f.address : f.address.part * size + f.address.offset;
    const part = Math.floor(address / size);
    const displacement = address - part * size;
    const row = f.rows.find((r) => r.id === part);
    if (!row) return null;
    return { part, displacement, at: row.at, start: row.at * size, physical: row.at * size + displacement };
  }
  const { part, offset } = typeof f.address === "number" ? { part: 0, offset: f.address } : f.address;
  const row = f.rows.find((r) => r.id === part);
  if (!row) return null;
  return { part, displacement: offset, at: row.at, start: row.at, physical: row.at + offset };
}

/** What a focus or a stage may name on this figure. */
export const MEMORY_TABLE_PINS = ["row", "number", "displacement", "physical"] as const;
