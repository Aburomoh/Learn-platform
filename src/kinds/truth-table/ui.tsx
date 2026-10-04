"use client";

import { Prompt } from "../shared/Prompt";
import type { ExplainProps, PracticeProps } from "../types";
import { columnTruth, goals, inputColumn, rowCount, rowLabel, type TruthTableAnswer } from "./logic";
import type { TruthTableSpec } from "./spec";
import { TruthTable, type TruthColumn } from "./TruthTable";

/**
 * The table as drawn: inputs (given unless the student fills them), the optional minterm column,
 * then the spec's columns with the last one as the output. `active` is the drawn column of goal
 * `step`, or undefined when there is none (row-select, or the table is finished).
 */
function layout(spec: TruthTableSpec, step: number | undefined) {
  const rows = rowCount(spec);
  const inputs: TruthColumn[] = spec.inputs.map((name, i) => ({ id: `in-${i}`, header: name, role: "input", values: inputColumn(spec, i), given: !spec.fillInputs }));
  const minterms: TruthColumn[] = spec.mintermColumn ? [{ id: "m", header: "m", role: "minterm", values: Array.from({ length: rows }, (_, r) => `m${r}`), given: true }] : [];
  const rest: TruthColumn[] = spec.columns.map((c, i) => ({ id: c.id, header: c.label, role: i === spec.columns.length - 1 ? "output" : "derived", values: columnTruth(spec, c), given: c.given, group: c.group }));
  const columns = spec.mintermColumn === "left" ? [...minterms, ...inputs, ...rest] : [...inputs, ...rest, ...minterms];
  const goal = step === undefined ? undefined : goals(spec)[step];
  const active = goal === undefined ? undefined : columns.findIndex((c) => c.id === (goal.type === "input" ? `in-${goal.index}` : goal.column.id));
  const rowNames = Array.from({ length: rows }, (_, r) => rowLabel(spec, r));
  return { columns, active, rowNames, allowX: goal?.type === "column" && columns[active!].values.includes("X") };
}

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<TruthTableSpec, TruthTableAnswer>) {
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
 * `rows` = rows shown as picked.
 */
export function Explain({ variant, stage }: ExplainProps<TruthTableSpec>) {
  const { spec } = variant;
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
