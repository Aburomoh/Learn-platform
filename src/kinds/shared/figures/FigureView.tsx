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
const LatchFigure = dynamic(() => import("./LatchFigure").then((m) => m.LatchFigure));

export interface FigureViewProps {
  id: string;
  figure: FigureSpec;
  /** Result state: the question is answered (or it is the last Explain stage), so the computed result is drawn. */
  revealed?: boolean;
  /** Focus state from the current Explain stage; overrides the figure's own `focus`. */
  focus?: string;
}

export function FigureView({ id, figure, revealed = false, focus }: FigureViewProps) {
  return (
    <div className={styles.figure} data-figure={id}>
      {draw(id, figure, revealed, focus)}
    </div>
  );
}

function draw(id: string, figure: FigureSpec, revealed: boolean, focus: string | undefined) {
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
        />
      );
    case "latch":
      return <LatchFigure id={`${id}-latch`} latch={figure.latch} values={figure.values} revealed={revealed} />;
    default: {
      const unhandled: never = figure;
      throw new Error(`No renderer for figure ${JSON.stringify(unhandled)}`);
    }
  }
}
