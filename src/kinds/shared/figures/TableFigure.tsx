import { focusTarget } from "@/interactions/shared/types";
import tt from "@/kinds/truth-table/TruthTable.module.css";
import { FlipFlopFigure } from "./BlockFigure";
import styles from "./figures.module.css";

export type TableFigureCell = 0 | 1 | "X" | string;

export interface TableFigureColumn {
  /** Header as on the slides: J, K, Q, Q(t+1). */
  header: string;
  /** One value per row, top to bottom. */
  values: TableFigureCell[];
  /** A 2 px rule stands before the first output column, as in the truth-table kind. */
  role: "input" | "output";
}

export interface TableFigureProps {
  /** The table's name, shown as its caption and read as its accessible name: "JK characteristic table". */
  title: string;
  columns: TableFigureColumn[];
  /** A flip-flop symbol beside the table (the characteristic-equation questions, #617). */
  symbol?: { ff: "d" | "t" | "sr" | "jk"; edge?: "rising" | "falling" };
  /** Replaces the title as the accessible name when the title reads badly. */
  caption?: string;
}

/**
 * A given table, read-only (#617, ADR-0009): a characteristic, excitation or state table the
 * question refers to, drawn with the truth-table kind's cells so it looks like the tables the
 * student fills elsewhere. Nothing is computed, highlighted or revealed: the student reads the
 * rows. A real `<table>` with a caption, so it is navigable cell by cell.
 */
export function TableFigure({ title, columns, symbol, caption }: TableFigureProps) {
  const rows = columns[0]?.values.length ?? 0;
  const firstOutput = columns.findIndex((c) => c.role === "output");
  return (
    <div className={styles.tableFigure}>
      {symbol && <FlipFlopFigure ff={symbol.ff} edge={symbol.edge} />}
      <div className={tt.well}>
        <table className={tt.table} aria-label={caption ?? title} {...focusTarget("table")}>
          <caption className={styles.tableCaption}>{title}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.header} scope="col" className={`${tt.head} ${i === firstOutput ? tt.rule : ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} className={tt.row}>
                {columns.map((c, i) => (
                  <td key={c.header} className={`${tt.cell} ${i === firstOutput ? tt.rule : ""} mono`}>
                    {String(c.values[r] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
