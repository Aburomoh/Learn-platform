"use client";

/**
 * The figure of a question (ADR-0009), drawn by the stage for any kind. Each figure type is its own
 * lazy chunk, so a question downloads only the drawing it shows. Each `import()` is written out in
 * place: the build needs to see it to know which chunk to preload.
 */
import dynamic from "next/dynamic";
import { codeNames, pickName, rightPick } from "./device";
import type { FigureSpec } from "./figureSpec";
import styles from "./figures.module.css";

const DeviceFigure = dynamic(() => import("./DeviceFigure").then((m) => m.DeviceFigure));
const AdderFigure = dynamic(() => import("./BlockFigure").then((m) => m.AdderFigure));
const FlipFlopFigure = dynamic(() => import("./BlockFigure").then((m) => m.FlipFlopFigure));
const SequentialFigure = dynamic(() => import("./SequentialFigure").then((m) => m.SequentialFigure));
const GatesFigure = dynamic(() => import("./circuit/GatesFigure").then((m) => m.GatesFigure));
const LatchFigure = dynamic(() => import("./LatchFigure").then((m) => m.LatchFigure));
const FileLayoutFigure = dynamic(() => import("./FileLayoutFigure").then((m) => m.FileLayoutFigure));
const ResourceGraphFigure = dynamic(() => import("./ResourceGraphFigure").then((m) => m.ResourceGraphFigure));
const MemoryTableFigure = dynamic(() => import("./MemoryTableFigure").then((m) => m.MemoryTableFigure));
const TapeFigure = dynamic(() => import("./TapeFigure").then((m) => m.TapeFigure));
const TracksFigure = dynamic(() => import("./TracksFigure").then((m) => m.TracksFigure));
const TableFigure = dynamic(() => import("./TableFigure").then((m) => m.TableFigure));

export interface FigureViewProps {
  id: string;
  figure: FigureSpec;
  /** Result state: the question is answered (or it is the last Explain stage), so the computed result is drawn. */
  revealed?: boolean;
  /** Focus state from the current Explain stage; overrides the figure's own `focus`. */
  focus?: string;
  /** Topic card: 1, 2, 3 over the inputs, the body and the outputs (not drawn on a latch). */
  marks?: boolean;
}

export function FigureView({ id, figure, revealed = false, focus, marks = false }: FigureViewProps) {
  return (
    <div className={styles.figure} data-figure={id}>
      {draw(id, figure, revealed, focus, marks)}
    </div>
  );
}

function draw(id: string, figure: FigureSpec, revealed: boolean, focus: string | undefined, marks: boolean) {
  switch (figure.type) {
    case "device":
      return (
        <DeviceFigure
          device={figure.device}
          bits={figure.bits}
          names={codeNames(figure)}
          ask={figure.given}
          data={figure.data}
          revealed={revealed ? rightPick(figure, figure.given) : undefined}
          pickName={(k) => pickName(figure, k)}
          focus={focus ?? figure.focus}
          marks={marks}
        />
      );
    case "latch":
      return <LatchFigure id={`${id}-latch`} latch={figure.latch} values={figure.values} revealed={revealed} />;
    case "adder":
      return <AdderFigure adder={figure.adder} given={figure.given} revealed={revealed} focus={focus ?? figure.focus} marks={marks} />;
    case "flip-flop":
      return <FlipFlopFigure ff={figure.ff} edge={figure.edge} given={figure.given} revealed={revealed} focus={focus ?? figure.focus} marks={marks} />;
    case "sequential":
      return <SequentialFigure flipFlops={figure.flipFlops} input={figure.input} output={figure.output} focus={focus ?? figure.focus} marks={marks} />;
    case "gates":
      return <GatesFigure id={`${id}-gates`} output={figure.output} expr={figure.expr} vars={figure.vars} revealed={revealed} />;
    case "file-layout":
      return <FileLayoutFigure layout={figure.layout} records={figure.records} searchKey={figure.key} blockSize={figure.blockSize} slots={figure.slots} focus={focus ?? figure.focus} caption={figure.caption} />;
    case "resource-graph":
      return <ResourceGraphFigure processes={figure.processes} resources={figure.resources} edges={figure.edges} focus={focus ?? figure.focus} caption={figure.caption} />;
    case "memory-table":
      return <MemoryTableFigure table={figure.table} size={figure.size} rows={figure.rows} address={figure.address} unit={figure.unit} revealed={revealed} focus={focus ?? figure.focus} />;
    case "table":
      return <TableFigure title={figure.title} columns={figure.columns} symbol={figure.symbol} caption={figure.caption} />;
    case "tape":
      return <TapeFigure records={figure.records} block={figure.block} revealed={revealed} caption={figure.caption} />;
    case "tracks":
      return <TracksFigure tracks={figure.tracks} caption={figure.caption} />;
    default: {
      const unhandled: never = figure;
      throw new Error(`No renderer for figure ${JSON.stringify(unhandled)}`);
    }
  }
}
