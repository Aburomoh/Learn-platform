"use client";

import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { useState } from "react";
import { arrowSteps, labelOptions, stateCells, stateCodes, transitions, type StateDiagramAnswer, type Transition } from "./logic";
import type { StateDiagramSpec } from "./spec";
import { StateDiagram } from "./StateDiagram";
import styles from "./state-diagram.module.css";

/**
 * The state table the diagram is read from (§13.3): beside the diagram on wide screens, below it
 * on phones. Read-only; a row is a focus target (`row-<n>`) so hint rung 5 can point at it.
 *
 * A long table (8 states, 16 rows) would sit a full screen below the diagram on a phone, so below
 * 900 px it shows only the rows of `current`, the state the arrow being asked leaves, with a
 * toggle for the whole table (#468). Reading the answer from those rows is still the student's work.
 */
function StateTable({ spec, rows, current }: { spec: StateDiagramSpec; rows: Transition[]; current?: string }) {
  const [whole, setWhole] = useState(false);
  const short = current !== undefined && rows.length > SHORT_TABLE_ROWS;
  const table = (
    <table className={styles.table} aria-label="State table" data-short={short && !whole ? "" : undefined}>
      <thead>
        <tr>
          <th scope="col">{spec.stateVars.join("")}</th>
          <th scope="col">{spec.input}</th>
          <th scope="col">Next {spec.stateVars.join("")}</th>
          {spec.output && <th scope="col">{spec.output.name}</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((t, i) => (
          <tr key={i} data-focus-target={`row-${i}`} data-other={short && t.from !== current ? "" : undefined}>
            <td className="mono">{t.from}</td>
            <td className="mono">{t.input}</td>
            <td className="mono">{t.to}</td>
            {spec.output && <td className="mono">{t.output}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
  if (!short) return table;
  return (
    <div className={styles.tableBox}>
      {table}
      <button type="button" className={`btn btn-quiet ${styles.toggle}`} aria-pressed={whole} onClick={() => setWhole((w) => !w)}>
        {whole ? `Show only the rows of ${current}` : "Show whole table"}
      </button>
    </div>
  );
}

/** Tables up to this many rows (4 states) are always shown whole. */
const SHORT_TABLE_ROWS = 8;

export function Practice({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<StateDiagramSpec, StateDiagramAnswer>) {
  const { spec } = variant;
  const table = transitions(spec);
  // The label the student gave at each step. On an arrow two rows share, either label is right
  // while it is open, so a done label is drawn as given, and `taken` tells the grader what is used.
  const [given, setGiven] = useState<Record<number, string>>({});
  const rows = table.map((t, i) => ({ ...t, label: i < stepIndex ? (given[i] ?? t.label) : t.label }));
  const finished = state === "correct" && locked;
  const done = finished ? rows.length : stepIndex;
  const t = rows[Math.min(done, rows.length - 1)];
  const current = Math.min(stepIndex, rows.length - 1);
  // the steps that share this arrow (two when both inputs take the state to the same next state)
  const onArrow = arrowSteps(spec, current);
  const taken = onArrow.filter((i) => i < stepIndex).map((i) => rows[i].label);
  return (
    <>
      <Prompt text={prompt} />
      {!finished && (
        <p className={shared.stepLabel} aria-live="polite">
          {spec.mode === "next" ? `Arrow ${done + 1} of ${rows.length}: from ${t.from} with ${spec.input} = ${t.input}` : `Arrow ${done + 1} of ${rows.length}: ${t.from} → ${t.to}${onArrow.length > 1 ? ` (label ${onArrow.indexOf(current) + 1} of 2 on this arrow)` : ""}`}
        </p>
      )}
      <div className={styles.layout}>
        <StateDiagram
          key={stepIndex}
          id={variant.id}
          states={stateCodes(spec)}
          positions={stateCells(spec)}
          transitions={rows}
          mode={spec.mode}
          done={done}
          labelOptions={labelOptions(spec)}
          inputName={spec.input}
          state={state}
          disabled={locked}
          onCheck={(answer) => {
            if (spec.mode === "next") return onSubmit({ kind: "state-diagram", step: stepIndex, next: answer });
            setGiven((g) => ({ ...g, [stepIndex]: answer }));
            onSubmit({ kind: "state-diagram", step: stepIndex, label: answer, taken });
          }}
        />
        <StateTable spec={spec} rows={table} current={finished ? undefined : table[current].from} />
      </div>
    </>
  );
}

/** Explain Slowly reuses the diagram read-only. Content stage: `revealed` = arrows shown done (the next one is the active arrow). */
export function Explain({ variant, stage }: ExplainProps<StateDiagramSpec>) {
  const { spec } = variant;
  const rows = transitions(spec);
  return (
    <div className={styles.layout}>
      <StateDiagram id={variant.id} states={stateCodes(spec)} positions={stateCells(spec)} transitions={rows} mode={spec.mode} done={(stage.revealed as number | undefined) ?? 0} labelOptions={labelOptions(spec)} inputName={spec.input} />
      <StateTable spec={spec} rows={rows} />
    </div>
  );
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:state-diagram";
