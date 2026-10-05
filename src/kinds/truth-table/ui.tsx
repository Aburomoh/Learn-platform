"use client";

import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { useState } from "react";
import shared from "../shared/shared.module.css";
import { columnTruth, goals, inputColumn, muxPairs, rowCount, rowLabel, type PairChoice, type TruthTableAnswer } from "./logic";
import type { TruthTableSpec } from "./spec";
import { TruthTable, type TruthColumn } from "./TruthTable";
import styles from "./TruthTable.module.css";

/**
 * The table as drawn: inputs (given unless the student fills them), the optional minterm column,
 * then the spec's columns with the last one as the output. `active` is the drawn column of goal
 * `step`, or undefined when there is none (row-select, or the table is finished).
 */
function layout(spec: TruthTableSpec, step: number | undefined) {
  const rows = rowCount(spec);
  // state tables (#440): "Present state" over the flip-flops, "Input" over x
  const inputGroup = (spec.inputGroups ?? []).flatMap((g) => Array.from({ length: g.span }, () => g.label));
  const inputs: TruthColumn[] = spec.inputs.map((name, i) => ({ id: `in-${i}`, header: name, role: "input", values: inputColumn(spec, i), given: !spec.fillInputs, group: inputGroup[i] }));
  const minterms: TruthColumn[] = spec.mintermColumn ? [{ id: "m", header: "m", role: "minterm", values: Array.from({ length: rows }, (_, r) => `m${r}`), given: true }] : [];
  const rest: TruthColumn[] = spec.columns.map((c, i) => ({ id: c.id, header: c.label, role: i === spec.columns.length - 1 ? "output" : "derived", values: columnTruth(spec, c), given: c.given, group: c.group }));
  const columns = spec.mintermColumn === "left" ? [...minterms, ...inputs, ...rest] : [...inputs, ...rest, ...minterms];
  const goal = step === undefined ? undefined : goals(spec)[step];
  const active = goal === undefined ? undefined : columns.findIndex((c) => c.id === (goal.type === "input" ? `in-${goal.index}` : goal.column.id));
  const rowNames = Array.from({ length: rows }, (_, r) => rowLabel(spec, r));
  return { columns, active, rowNames, allowX: goal?.type === "column" && columns[active!].values.includes("X") };
}

const CHOICES: PairChoice[] = ["0", "1", "v", "v'"];

/** A mux data input as the slides write it: 0, 1, the data variable or its complement (z, z′). */
const choiceName = (c: PairChoice, data: string) => (c === "v" ? data : c === "v'" ? `${data}′` : c);

/** The pair column of a mux-pairs table: "I0 … In" with the choices of the pairs done so far. */
function pairColumn(spec: TruthTableSpec, done: number) {
  const pairs = muxPairs(spec);
  const data = spec.inputs.at(-1)!;
  return { header: "MUX input", names: pairs.map((p) => `I${p.select}`), values: pairs.map((p) => choiceName(p.choice, data)), done, active: done < pairs.length ? done : undefined };
}

/** Mux-pairs mode (#308): the table is given; per pair of rows the student picks what that data input gets. */
function MuxPairs({ variant, prompt, state, stepIndex, locked, onSubmit }: PracticeProps<TruthTableSpec, TruthTableAnswer>) {
  const { spec } = variant;
  const { columns, rowNames } = layout(spec, undefined);
  const pairs = muxPairs(spec);
  const finished = state === "correct" && locked;
  const done = finished ? pairs.length : stepIndex;
  const data = spec.inputs.at(-1)!;
  const [picked, setPicked] = useState<PairChoice | null>(null);
  const editing = !locked && !finished;
  return (
    <>
      <Prompt text={prompt} />
      <TruthTable id={variant.id} columns={columns.map((c) => ({ ...c, given: true }))} rowNames={rowNames} pairs={pairColumn(spec, done)} />
      {!finished && (
        <form
          className={styles.answer}
          onSubmit={(e) => {
            e.preventDefault();
            if (editing && picked) onSubmit({ kind: "truth-table", step: stepIndex, choice: picked });
          }}
        >
          <p className={shared.stepLabel} aria-live="polite">
            Pair {done + 1} of {pairs.length}: what goes on I{pairs[done].select}?
          </p>
          <fieldset className={styles.chips} role="radiogroup" aria-label={`Data input I${pairs[done].select}`} aria-invalid={state === "incorrect" || undefined}>
            {CHOICES.map((c) => (
              <label key={c} className={`${styles.chip} ${picked === c ? styles.chipOn : ""} mono`}>
                <input type="radio" name={`${variant.id}-pair`} value={c} checked={picked === c} disabled={!editing} onChange={() => setPicked(c)} />
                {choiceName(c, data)}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn btn-primary" disabled={!editing || !picked}>
            Check input
          </button>
        </form>
      )}
    </>
  );
}

export function Practice(props: PracticeProps<TruthTableSpec, TruthTableAnswer>) {
  // each pair is a fresh choice: remount per step so the last pick does not carry over
  if (props.variant.spec.mode === "mux-pairs") return <MuxPairs key={props.stepIndex} {...props} />;
  return <TablePractice {...props} />;
}

function TablePractice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<TruthTableSpec, TruthTableAnswer>) {
  const { spec } = variant;
  const finished = state === "correct" && locked;
  const wrongRow = state === "incorrect" ? last?.result.wrongCells?.first : undefined;

  if (spec.mode === "row-select") {
    const { columns, rowNames } = layout(spec, undefined);
    const target = spec.columns.find((c) => c.id === spec.target)!;
    return (
      <>
        <Prompt text={prompt} />
        <TruthTable
          id={variant.id}
          columns={columns.map((c) => ({ ...c, given: true }))}
          rowNames={rowNames}
          select={{ label: `${target.label} = 1?` }}
          state={state}
          wrongRow={wrongRow}
          disabled={locked}
          onCheck={(a) => "rows" in a && onSubmit({ kind: "truth-table", step: 0, rows: a.rows })}
        />
      </>
    );
  }

  const { columns, active, rowNames, allowX } = layout(spec, finished ? undefined : stepIndex);
  return (
    <>
      <Prompt text={prompt} />
      <TruthTable
        key={stepIndex}
        id={variant.id}
        columns={columns}
        rowNames={rowNames}
        activeColumn={active}
        allowX={allowX}
        state={state}
        wrongRow={wrongRow}
        disabled={locked}
        onCheck={(a) => "values" in a && onSubmit({ kind: "truth-table", step: stepIndex, values: a.values })}
      />
    </>
  );
}

/**
 * Explain Slowly reuses the table read-only (UX §1). Content stages: `step` = the goal being shown
 * (omit for the finished table), `revealed` = rows of that column filled so far; row-select:
 * `rows` = rows shown as picked; mux-pairs: `pairs` = pairs shown done (the next one has the halo).
 */
export function Explain({ variant, stage }: ExplainProps<TruthTableSpec>) {
  const { spec } = variant;
  if (spec.mode === "mux-pairs") {
    const { columns, rowNames } = layout(spec, undefined);
    return <TruthTable id={variant.id} columns={columns.map((c) => ({ ...c, given: true }))} rowNames={rowNames} pairs={pairColumn(spec, (stage.pairs as number | undefined) ?? 0)} />;
  }
  const step = stage.step as number | undefined;
  const { columns, active, rowNames } = layout(spec, spec.mode === "row-select" ? undefined : step);
  if (spec.mode === "row-select") {
    const target = spec.columns.find((c) => c.id === spec.target)!;
    return <TruthTable id={variant.id} columns={columns.map((c) => ({ ...c, given: true }))} rowNames={rowNames} select={{ label: `${target.label} = 1?`, picked: (stage.rows as number[] | undefined) ?? [] }} />;
  }
  return <TruthTable id={variant.id} columns={columns} rowNames={rowNames} activeColumn={active} revealed={active === undefined ? undefined : ((stage.revealed as number | undefined) ?? 0)} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:truth-table";
