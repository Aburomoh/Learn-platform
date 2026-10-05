"use client";

import { useState } from "react";
import { formatCube } from "@/content/boolean";
import { ExpressionEntry } from "../shared/ExpressionEntry";
import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { KarnaughMap, type MapGroup } from "./KarnaughMap";
import { cellValues, cubeOf, goalOf, groupCount, kmapLayout, type KmapAnswer } from "./logic";
import type { KmapSpec } from "./spec";
import styles from "./kmap.module.css";

/** The term a group stands for, in course notation ("B'C"), or "?" while it is not a valid group. */
function termOf(spec: KmapSpec, cells: number[]): string {
  const cube = cubeOf(cells);
  return cube ? formatCube(cube, spec.vars) : "?";
}

/** The numbered group list beside the map (below it on phones): the same badge, then the term. */
function GroupList({ spec, groups, pending, answer }: { spec: KmapSpec; groups: number[][]; pending?: number; answer?: string }) {
  if (!groups.length && pending === undefined && !answer) return null;
  return (
    <ol className={styles.list} aria-label="Groups">
      {groups.map((cells, i) => (
        <li key={i} className={styles.item}>
          <span className={styles.badge} aria-hidden="true">
            {i + 1}
          </span>
          <span className="sr-only">Group {i + 1}: </span>
          <span className="mono">{pending === i ? "?" : termOf(spec, cells)}</span>
        </li>
      ))}
      {answer && (
        <li className={`${styles.item} ${styles.answer}`}>
          <span className="mono">F = {answer}</span>
        </li>
      )}
    </ol>
  );
}

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<KmapSpec, KmapAnswer>) {
  const { spec } = variant;
  const layout = kmapLayout(spec.vars);
  const values = cellValues(spec);
  const total = groupCount(spec);
  const finished = state === "correct" && locked;
  const goal = finished ? { tag: "done" as const, group: undefined } : goalOf(spec, stepIndex);
  // The cells of each group as the student marked it. A step only advances on a right answer, so
  // the last marking sent for a group goal that is now behind us is that group.
  const [marked, setMarked] = useState<Record<number, number[]>>({});
  const doneGroups = Math.min(total, finished || goal.tag === "answer" ? total : (goal.group ?? 0) + (goal.tag === "term" ? 1 : 0));
  const groups = Array.from({ length: doneGroups }, (_, g) => marked[g] ?? []).filter((cells) => cells.length);
  const current = goal.tag === "term" ? goal.group : undefined;
  const lastHere = last?.answer.kind === "kmap" && last.answer.step === stepIndex ? last : undefined;
  const mapGroups: MapGroup[] = groups.map((cells, i) => ({ cells, now: i === current }));

  return (
    <>
      <Prompt text={prompt} />
      <div className={styles.layout}>
        <KarnaughMap
          key={goal.tag === "fill" || goal.tag === "group" ? stepIndex : "map"}
          id={variant.id}
          layout={layout}
          values={values}
          mode={goal.tag === "fill" ? "fill" : goal.tag === "group" ? "group" : "read"}
          groups={mapGroups}
          allowX={spec.dontCares.length > 0}
          state={goal.tag === "fill" || goal.tag === "group" ? state : "idle"}
          wrongCell={lastHere?.result.wrongCells?.first}
          disabled={locked}
          onFill={(cells) => onSubmit({ kind: "kmap", step: stepIndex, cells })}
          onGroup={(cells) => {
            setMarked((m) => ({ ...m, [goal.group!]: cells }));
            onSubmit({ kind: "kmap", step: stepIndex, group: cells, previous: groups });
          }}
        />
        <GroupList spec={spec} groups={groups} pending={current} answer={finished && lastHere?.answer.kind === "kmap" ? lastHere.answer.expr : undefined} />
      </div>
      {goal.tag === "group" && (
        <p className={shared.stepLabel} aria-live="polite">
          Group {goal.group! + 1} of {total}: tap its cells, then check.
        </p>
      )}
      {goal.tag === "term" && (
        <>
          <p className={shared.stepLabel} aria-live="polite">
            Group {goal.group! + 1} of {total}: write its term.
          </p>
          <ExpressionEntry
            key={stepIndex}
            id={`${variant.id}-term-${goal.group}`}
            label={`Term for group ${goal.group! + 1}`}
            vars={spec.vars}
            keys="product"
            state={state}
            disabled={locked}
            submittedText={lastHere?.answer.kind === "kmap" ? lastHere.answer.term : undefined}
            onAnswer={(term) => onSubmit({ kind: "kmap", step: stepIndex, group: marked[goal.group!] ?? [], term })}
          />
        </>
      )}
      {goal.tag === "answer" && (
        <>
          <p className={shared.stepLabel} aria-live="polite">
            Now write F from the groups.
          </p>
          <ExpressionEntry
            key={stepIndex}
            id={`${variant.id}-f`}
            label="F, the simplified function"
            vars={spec.vars}
            state={state}
            disabled={locked}
            submittedText={lastHere?.answer.kind === "kmap" ? lastHere.answer.expr : undefined}
            onAnswer={(expr) => onSubmit({ kind: "kmap", step: stepIndex, expr })}
          />
        </>
      )}
    </>
  );
}

/**
 * Explain Slowly reuses the map read-only (UX §1). Content stages: `groups` = the groups shown
 * (minterm numbers each), `active` = index of the group being discussed (halo; its term is "?"
 * until `term` is true), `answer` = show F.
 */
export function Explain({ variant, stage }: ExplainProps<KmapSpec>) {
  const { spec } = variant;
  const groups = (stage.groups as number[][] | undefined) ?? [];
  const active = stage.active as number | undefined;
  return (
    <div className={styles.layout}>
      <KarnaughMap id={variant.id} layout={kmapLayout(spec.vars)} values={cellValues(spec)} mode="read" groups={groups.map((cells, i) => ({ cells, now: i === active }))} />
      <GroupList spec={spec} groups={groups} pending={stage.term ? undefined : active} answer={stage.answer ? groups.map((g) => termOf(spec, g)).join(" + ") : undefined} />
    </div>
  );
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:kmap";
