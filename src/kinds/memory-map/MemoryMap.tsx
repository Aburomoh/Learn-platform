"use client";

import { Fragment, useId, useState } from "react";
import type { Region } from "@/content/os";
import { NumericInput } from "@/interactions/NumericInput/NumericInput";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import shared from "../shared/shared.module.css";
import type { Goal, MemoryMapAnswer, MoveGoal, RegisterGoal } from "./logic";
import { memoryEnd } from "./logic";
import styles from "./MemoryMap.module.css";

export interface MemoryMapProps {
  id: string;
  scheme: "fixed" | "dynamic" | "relocatable";
  fit: "first" | "best";
  os: number;
  unit: string;
  registerUnit: "KB" | "bytes";
  /** Every job in arrival order. */
  jobs: { id: string; size: number }[];
  /** Every goal of the question (from the kind's logic). */
  goals: Goal[];
  /** Goals answered so far; `goals.length` = finished. */
  done: number;
  state?: AnswerState;
  /** After a wrong check: the first wrong part (a region index for the waste column, 0/1 for a release's start/size). */
  wrongFirst?: number;
  /** The last submitted answer, kept in the fields while `state` is set. */
  submitted?: MemoryMapAnswer;
  disabled?: boolean;
  /** Practice: the answer to the goal at `done`. Absent in Explain Slowly. */
  onCheck?: (answer: Omit<MemoryMapAnswer, "kind" | "step">) => void;
  /** Explain Slowly: the block to halo and the blocks to tag "fits". */
  explainPick?: number;
  explainFits?: number[];
}

// Block heights (spec §2.3): proportional, 44 px minimum, 120 px maximum, the column about 480 px at most.
const MIN_H = 44;
const MAX_H = 120;
const COLUMN_H = 480;

/** Pixel heights for the OS block and each region. */
export function blockHeights(
  os: number,
  regions: Region[],
): { os: number; rows: number[] } {
  const sizes = [os, ...regions.map((r) => r.size)];
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  const k = Math.min(COLUMN_H / total, MAX_H / Math.max(...sizes, 1));
  const h = (s: number) => Math.round(Math.min(MAX_H, Math.max(MIN_H, s * k)));
  return { os: os > 0 ? h(os) : 0, rows: regions.map((r) => h(r.size)) };
}

const waste = (r: Region) => r.size - r.jobSize;

/**
 * The slide's memory column (Ch2): OS at the top, blocks in address order, addresses at each
 * boundary. Free blocks are hatched, busy ones solid; in a fixed partition the job fills its share
 * from the top and the leftover stays hatched. When `pick` is set the free (or busy) blocks are
 * the radios of one group, so the student answers on the drawing itself. Never grades.
 */
function Column({
  id,
  os,
  unit,
  regions,
  heights,
  fixed,
  label,
  halo,
  wrong,
  tagFits,
  wasteShown,
  releasing,
  pick,
  after,
  compact: compactLabels,
  tail,
}: {
  id: string;
  os: number;
  unit: string;
  regions: Region[];
  heights: { os: number; rows: number[] };
  fixed: boolean;
  label: string;
  halo?: number;
  wrong?: number;
  tagFits?: number[];
  wasteShown?: boolean;
  releasing?: number;
  /** The radios: which blocks may be picked, the group name, the picked index and the change handler. */
  pick?: {
    which: "free" | "busy";
    name: string;
    picked: number | null;
    onPick: (i: number) => void;
    disabled: boolean;
  };
  /** Compaction "after" column: blocks not yet placed are dashed outlines. */
  after?: { pending: number; asking?: string };
  compact?: boolean;
  /** A last radio of the group under the column (the Waits chip). */
  tail?: React.ReactNode;
}) {
  const end = memoryEnd(regions);
  return (
    <div
      className={styles.column}
      data-column={id}
      {...(pick
        ? { role: "radiogroup", "aria-label": label }
        : { "aria-label": label })}
    >
      {os > 0 && (
        <>
          <span className={styles.addr}>0</span>
          <div
            className={`${styles.block} ${styles.os}`}
            style={{ height: heights.os }}
          >
            OS{compactLabels ? "" : " ·"} {os}
            {compactLabels ? "" : ` ${unit}`}
          </div>
        </>
      )}
      {regions.map((r, i) => {
        const free = r.job === null;
        const pickable = !!pick && (pick.which === "free" ? free : !free);
        const pending = after !== undefined && i >= after.pending;
        const asking =
          pending && after?.asking !== undefined && i === after.pending;
        const classes = [
          styles.block,
          free ? styles.free : styles.busy,
          fixed && !free ? styles.partition : "",
          halo === i ? styles.halo : "",
          wrong === i ? styles.wrong : "",
          releasing === i ? styles.releasing : "",
          pending ? styles.pending : "",
          pickable ? styles.pickable : "",
          pick && pick.picked === i ? styles.picked : "",
        ]
          .filter(Boolean)
          .join(" ");
        const name = free ? (fixed ? `Partition ${i + 1}` : "free") : r.job;
        const text = compactLabels
          ? pending
            ? asking
              ? `${after!.asking} → ?`
              : "?"
            : `${name} ${r.size}`
          : pending
            ? "?"
            : free
              ? `${name} · ${r.size} ${unit}`
              : `${r.job} · ${r.jobSize} ${unit}`;
        const inner = (
          <>
            {fixed && !free && (
              <span
                className={styles.fill}
                style={{ height: `${(100 * r.jobSize) / r.size}%` }}
                aria-hidden="true"
              />
            )}
            <span className={styles.text}>{text}</span>
            {fixed && !free && !compactLabels && (
              <small className={styles.sub}>
                Partition {i + 1} · {r.size} {unit}
                {wasteShown && waste(r) > 0 ? ` · waste ${waste(r)}` : ""}
              </small>
            )}
            {tagFits?.includes(i) && <span className={styles.fits}>fits</span>}
          </>
        );
        return (
          <Fragment key={i}>
            <span className={styles.addr}>
              {pending && i > after!.pending ? "" : r.start}
            </span>
            {pickable ? (
              <label
                className={classes}
                style={{ height: heights.rows[i] }}
                {...focusTarget(`block-${i}`)}
                data-block={i}
              >
                <input
                  type="radio"
                  name={pick!.name}
                  value={i}
                  checked={pick!.picked === i}
                  disabled={pick!.disabled}
                  onChange={() => pick!.onPick(i)}
                  aria-label={`${name}, ${r.size} ${unit}`}
                />
                {inner}
              </label>
            ) : (
              <div
                className={classes}
                style={{ height: heights.rows[i] }}
                {...focusTarget(`block-${i}`)}
                data-block={i}
              >
                {inner}
              </div>
            )}
          </Fragment>
        );
      })}
      <span className={styles.addr}>
        {after && after.pending < regions.length ? "" : end}
      </span>
      <span />
      {tail && <div className={styles.tail}>{tail}</div>}
    </div>
  );
}

/** The free and busy lists as on the slides (Beginning address · Size · Status), or the fixed partition table. */
function Lists({
  regions,
  previous,
  fixed,
  unit,
  wasteColumn,
}: {
  regions: Region[];
  previous?: Region[];
  fixed: boolean;
  unit: string;
  wasteColumn?: {
    values: (number | null)[];
    editing: boolean;
    wrong?: number;
    onChange: (i: number, v: string) => void;
    shown: boolean;
    form: string;
  };
}) {
  const same = (r: Region) =>
    previous?.some(
      (p) => p.start === r.start && p.size === r.size && p.job === r.job,
    );
  const changed = (r: Region) => (previous && !same(r) ? "" : undefined);
  if (fixed)
    return (
      <div className={styles.tableBox}>
        <table
          className={styles.list}
          aria-label="Partition table"
          {...focusTarget("partition-table")}
        >
          <caption>Partition table</caption>
          <thead>
            <tr>
              <th scope="col">Partition</th>
              <th scope="col">Size</th>
              <th scope="col">Address</th>
              <th scope="col">Status</th>
              {wasteColumn && <th scope="col">Internal waste</th>}
            </tr>
          </thead>
          <tbody>
            {regions.map((r, i) => (
              <tr key={i} data-changed={changed(r)}>
                <td>{i + 1}</td>
                <td className="mono">{r.size}</td>
                <td className="mono">{r.start}</td>
                <td>
                  {r.job === null
                    ? "free"
                    : `busy · ${r.job} (${r.jobSize} ${unit})`}
                </td>
                {wasteColumn && (
                  <td
                    className={`mono ${wasteColumn.wrong === i ? styles.wrongCell : ""}`}
                    {...focusTarget(`waste-${i}`)}
                  >
                    {r.job === null ? (
                      <span className={styles.muted}>—</span>
                    ) : wasteColumn.editing ? (
                      <input
                        form={wasteColumn.form}
                        className={`${styles.cellInput} mono`}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={`Internal waste of partition ${i + 1}`}
                        aria-invalid={wasteColumn.wrong === i || undefined}
                        value={wasteColumn.values[i] ?? ""}
                        onChange={(e) =>
                          wasteColumn.onChange(i, e.target.value)
                        }
                      />
                    ) : wasteColumn.shown ? (
                      waste(r)
                    ) : (
                      <span className={styles.unknown}>?</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  const free = regions.filter((r) => r.job === null);
  const busy = regions.filter((r) => r.job !== null);
  const table = (name: string, rows: Region[], target: string) => (
    <div className={styles.tableBox}>
      <table className={styles.list} aria-label={name} {...focusTarget(target)}>
        <caption>{name}</caption>
        <thead>
          <tr>
            <th scope="col">Beginning</th>
            <th scope="col">Size</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className={styles.muted}>
                null entry
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} data-changed={changed(r)}>
              <td className="mono">{r.start}</td>
              <td className="mono">{r.size}</td>
              <td>{r.job === null ? "free" : `busy · ${r.job}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className={styles.lists}>
      {table("Free list", free, "free-list")}
      {table("Busy list", busy, "busy-list")}
    </div>
  );
}

/** The goal in words (the prompt stays the content's; this names the step, as the other kinds' step labels do). */
export function goalText(
  g: Goal,
  fit: "first" | "best",
  fixed: boolean,
  unit: string,
  registerUnit: string,
): string {
  const fitName = fit === "first" ? "first-fit" : "best-fit";
  switch (g.tag) {
    case "place":
      return `Job ${g.job.id} (${g.job.size} ${unit}), ${fitName}: which ${fixed ? "partition" : "block"}?`;
    case "waste":
      return "Internal waste of each busy partition";
    case "holes":
      return `Free space in fragments: how much in total (${unit})?`;
    case "release":
      return fixed
        ? `${g.job.id} finishes: mark its partition free`
        : `${g.job.id} finishes and releases its block (start ${g.released.start}, ${g.released.size} ${unit}). What free block results?`;
    case "move":
      return `After compaction, where does ${g.job.id} start?`;
    case "register":
      return `Relocation register of ${g.job.id} (${registerUnit})`;
  }
}

export function MemoryMap({
  id,
  scheme,
  fit,
  os,
  unit,
  registerUnit,
  jobs,
  goals,
  done,
  state = "idle",
  wrongFirst,
  submitted,
  disabled = false,
  onCheck,
  explainPick,
  explainFits,
}: MemoryMapProps) {
  const fixed = scheme === "fixed";
  const finished = done >= goals.length;
  const g = goals[Math.min(done, goals.length - 1)];
  const regions = finished ? g.after : g.before;
  const previous = done > 0 ? goals[done - 1].before : undefined;
  const editing = !!onCheck && !disabled && !finished && state !== "correct";
  const wrong = state === "incorrect";
  const groupName = useId();
  const formId = useId();

  const [block, setBlock] = useState<number | "waits" | null>(
    submitted?.block ?? null,
  );
  const [fields, setFields] = useState<{ start: string; size: string }>({
    start: submitted?.start?.toString() ?? "",
    size: submitted?.size?.toString() ?? "",
  });
  const [wasteValues, setWasteValues] = useState<(number | null)[]>(
    submitted?.values ?? regions.map(() => null),
  );

  const heights = blockHeights(os, regions);
  const placed = new Set(
    regions.filter((r) => r.job !== null).map((r) => r.job),
  );
  // jobs that asked for memory and wait: a place goal already answered whose job is not in memory
  const waiting = new Set(
    goals
      .slice(0, done)
      .flatMap((x) =>
        x.tag === "place" && x.placement === null && !placed.has(x.job.id)
          ? [x.job.id]
          : [],
      ),
  );
  const current =
    !finished &&
    (g.tag === "place" ||
      g.tag === "release" ||
      g.tag === "move" ||
      g.tag === "register")
      ? g.job.id
      : undefined;
  const hasQueue = goals.some((x) => x.tag === "place");
  const wasteDone = goals.slice(0, done).some((x) => x.tag === "waste");
  const n = (s: string) => (s.trim() === "" ? undefined : Number(s));

  // compaction: the "after" column fills in one job per correct move
  const lastGoal = goals[goals.length - 1];
  const compaction: MoveGoal | RegisterGoal | undefined =
    !finished && (g.tag === "move" || g.tag === "register")
      ? g
      : finished && (lastGoal.tag === "move" || lastGoal.tag === "register")
        ? lastGoal
        : undefined;
  const afterRegions = compaction?.after;
  const movedCount = compaction
    ? finished || compaction.tag === "register"
      ? compaction.all.length
      : compaction.moved.length
    : 0;

  const summary = `Memory, ${fixed ? "fixed partitions" : "dynamic partitions"}, ${fit}-fit. OS 0 to ${os}. ${regions.map((r, i) => `${r.job === null ? (fixed ? `partition ${i + 1} free` : "free") : `${r.job}`} at ${r.start}, ${r.size} ${unit}`).join("; ")}. ${done} of ${goals.length} steps done.`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (g.tag === "place" && block !== null) onCheck!({ block });
    else if (
      g.tag === "release" &&
      fixed &&
      block !== null &&
      block !== "waits"
    )
      onCheck!({ block });
    else if (
      g.tag === "release" &&
      !fixed &&
      fields.start.trim() &&
      fields.size.trim()
    )
      onCheck!({ start: n(fields.start), size: n(fields.size) });
    else if (
      g.tag === "waste" &&
      g.values.every((v, i) => v === null || wasteValues[i] !== null)
    )
      onCheck!({ values: wasteValues });
  }

  const goal = finished ? "" : goalText(g, fit, fixed, unit, registerUnit);
  const pickGroup =
    editing && (g.tag === "place" || (g.tag === "release" && fixed))
      ? {
          which: g.tag === "place" ? ("free" as const) : ("busy" as const),
          name: groupName,
          picked: typeof block === "number" ? block : null,
          onPick: (i: number) => setBlock(i),
          disabled: !editing,
        }
      : undefined;
  const halo =
    explainPick ??
    (!finished && g.tag === "release" && !fixed
      ? g.blockIndex
      : !finished && (g.tag === "move" || g.tag === "register")
        ? regions.findIndex((r) => r.job === g.job.id)
        : undefined);
  const wrongBlock =
    wrong &&
    (g.tag === "place" || (g.tag === "release" && fixed)) &&
    typeof submitted?.block === "number"
      ? submitted.block
      : undefined;
  const columnLabel =
    g.tag === "place"
      ? `Block for ${g.job.id}`
      : g.tag === "release" && fixed
        ? `Partition of ${g.job.id}`
        : "Memory";

  return (
    <div className={styles.root} data-diagram={id}>
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
      <div className={styles.layout}>
        <div className={`${styles.well} ${afterRegions ? styles.pair : ""}`}>
          <div className={styles.half}>
            {afterRegions && <h4 className={styles.pairTitle}>Before</h4>}
            <Column
              id={`${id}-before`}
              os={os}
              unit={unit}
              regions={regions}
              heights={heights}
              fixed={fixed}
              label={columnLabel}
              halo={halo}
              wrong={wrongBlock}
              tagFits={explainFits}
              wasteShown={wasteDone}
              releasing={
                !finished && g.tag === "release" && !fixed
                  ? g.blockIndex
                  : undefined
              }
              pick={pickGroup}
              compact={!!afterRegions}
              tail={
                pickGroup && g.tag === "place" ? (
                  <label
                    className={`${styles.chip} ${block === "waits" ? styles.chipOn : ""} ${wrong && submitted?.block === "waits" ? styles.chipWrong : ""}`}
                    {...focusTarget("waits")}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value="waits"
                      checked={block === "waits"}
                      disabled={!editing}
                      onChange={() => setBlock("waits")}
                    />
                    Waits
                  </label>
                ) : undefined
              }
            />
          </div>
          {afterRegions && (
            <div className={styles.half}>
              <h4 className={styles.pairTitle}>After</h4>
              <Column
                id={`${id}-after`}
                os={os}
                unit={unit}
                regions={afterRegions}
                heights={blockHeights(os, afterRegions)}
                fixed={false}
                label="Memory after compaction"
                after={{
                  pending:
                    compaction && movedCount >= compaction.all.length
                      ? afterRegions.length
                      : movedCount,
                  asking: !finished && g.tag === "move" ? g.job.id : undefined,
                }}
                compact
              />
            </div>
          )}
        </div>

        <div className={styles.side}>
          {hasQueue && (
            <ul className={styles.queue} aria-label="Job queue">
              {jobs.map((j) => {
                const status = placed.has(j.id)
                  ? "placed"
                  : waiting.has(j.id)
                    ? "waits"
                    : j.id === current
                      ? "now"
                      : "later";
                return (
                  <li
                    key={j.id}
                    className={styles.job}
                    data-status={status}
                    {...focusTarget(`job-${j.id}`)}
                  >
                    {j.id} {j.size} {unit}
                    {status === "placed"
                      ? " ✓"
                      : status === "waits"
                        ? " · waits"
                        : ""}
                  </li>
                );
              })}
            </ul>
          )}

          {!finished && (
            <p className={shared.stepLabel} aria-live="polite">
              Step {done + 1} of {goals.length}
              {g.tag === "holes" || g.tag === "move" || g.tag === "register"
                ? ""
                : ` · ${goal}`}
            </p>
          )}

          {!finished &&
            onCheck &&
            (g.tag === "place" || g.tag === "release" || g.tag === "waste") && (
              <form id={formId} className={styles.form} onSubmit={submit}>
                {g.tag === "release" && !fixed && (
                  <div className={styles.fields}>
                    <label className={styles.field}>
                      Start
                      <input
                        className={`${styles.num} ${wrong && wrongFirst === 0 ? styles.wrongCell : ""} mono`}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-invalid={(wrong && wrongFirst === 0) || undefined}
                        value={fields.start}
                        disabled={!editing}
                        onChange={(e) =>
                          setFields((f) => ({
                            ...f,
                            start: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        {...focusTarget("release-start")}
                      />
                    </label>
                    <label className={styles.field}>
                      Size
                      <input
                        className={`${styles.num} ${wrong && wrongFirst === 1 ? styles.wrongCell : ""} mono`}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-invalid={(wrong && wrongFirst === 1) || undefined}
                        value={fields.size}
                        disabled={!editing}
                        onChange={(e) =>
                          setFields((f) => ({
                            ...f,
                            size: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        {...focusTarget("release-size")}
                      />
                    </label>
                    <span className={styles.unit}>{unit}</span>
                  </div>
                )}
                {g.tag === "place" && (
                  <p className={styles.note}>
                    Tap a free {fixed ? "partition" : "block"} in the column, or
                    choose Waits.
                  </p>
                )}
                {g.tag === "release" && fixed && (
                  <p className={styles.note}>
                    Tap the partition {g.job.id} leaves.
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    !editing ||
                    (g.tag === "place" || (g.tag === "release" && fixed)
                      ? block === null
                      : g.tag === "release"
                        ? !(fields.start.trim() && fields.size.trim())
                        : !g.values.every(
                            (v, i) => v === null || wasteValues[i] !== null,
                          ))
                  }
                >
                  {g.tag === "place"
                    ? "Place job"
                    : g.tag === "release"
                      ? fixed
                        ? "Mark free"
                        : "Check release"
                      : "Check column"}
                </button>
              </form>
            )}

          {!finished && onCheck && g.tag === "holes" && (
            <NumericInput
              id={`${id}-holes`}
              prompt={goal}
              base={10}
              state={state}
              disabled={!editing}
              submittedText={submitted?.value?.toString()}
              submitLabel="Check total"
              onAnswer={(text) => onCheck({ value: Number(text) })}
            />
          )}
          {!finished && onCheck && g.tag === "move" && (
            <NumericInput
              id={`${id}-move`}
              prompt={goal}
              base={10}
              state={state}
              disabled={!editing}
              submittedText={submitted?.start?.toString()}
              submitLabel="Check address"
              onAnswer={(text) => onCheck({ start: Number(text) })}
            />
          )}
          {!finished && onCheck && g.tag === "register" && (
            <>
              <NumericInput
                id={`${id}-register`}
                prompt={goal}
                base={10}
                signed
                state={state}
                disabled={!editing}
                submittedText={submitted?.value?.toString()}
                submitLabel="Check register"
                onAnswer={(text) => onCheck({ value: Number(text) })}
              />
              <p className={styles.note}>
                {g.job.id} moved from {g.relocation.oldStart} to{" "}
                {g.relocation.newStart} {unit}.
              </p>
            </>
          )}
          {finished && lastGoal.tag === "register" && (
            <p className={styles.note} {...focusTarget("register")}>
              {(lastGoal as RegisterGoal).all
                .filter((r) => r.delta !== 0)
                .map(
                  (r) => `${r.job}: ${r.delta} ${unit} × 1024 = ${r.register}`,
                )
                .join("; ")}
            </p>
          )}
          {finished && waiting.size > 0 && (
            <p className={styles.note}>
              Waiting:{" "}
              {[...waiting]
                .map(
                  (j) => `${j} (${jobs.find((x) => x.id === j)!.size} ${unit})`,
                )
                .join(", ")}
              {!fixed
                ? ` although ${regions.filter((r) => r.job === null).reduce((a, r) => a + r.size, 0)} ${unit} are free`
                : ""}
            </p>
          )}

          <Lists
            regions={regions}
            previous={previous}
            fixed={fixed}
            unit={unit}
            wasteColumn={
              fixed && (g.tag === "waste" || wasteDone)
                ? {
                    values: wasteValues,
                    editing: editing && g.tag === "waste",
                    wrong: wrong && g.tag === "waste" ? wrongFirst : undefined,
                    onChange: (i, v) =>
                      setWasteValues((w) =>
                        w.map((x, k) =>
                          k === i
                            ? v.trim() === ""
                              ? null
                              : Number(v.replace(/[^0-9]/g, ""))
                            : x,
                        ),
                      ),
                    shown: wasteDone,
                    form: formId,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
