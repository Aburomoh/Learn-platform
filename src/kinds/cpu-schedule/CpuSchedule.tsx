"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Segment } from "@/content/os";
import { NumericInput } from "@/interactions/NumericInput/NumericInput";
import { focusTarget, type AnswerState } from "@/interactions/shared/types";
import { useScrollFade } from "@/interactions/shared/useScrollFade";
import shared from "../shared/shared.module.css";
import { POLICY_NAME, POLICY_SHORT, remainingAfter, type CpuScheduleAnswer, type Goal } from "./logic";
import type { CpuScheduleSpec } from "./spec";
import styles from "./CpuSchedule.module.css";

export interface CpuScheduleProps {
  id: string;
  spec: CpuScheduleSpec;
  /** The truth's segments (drawn only up to the goal's `drawn`). */
  segments: Segment[];
  /** Per-job truth for the result table (finish, turnaround), shown only once its column is done. */
  results: { id: string; finish: number; turnaround: number }[];
  goals: Goal[];
  /** Goals answered so far; `goals.length` = finished. */
  done: number;
  state?: AnswerState;
  /** After a wrong column check: the first wrong row. */
  wrongFirst?: number;
  submitted?: CpuScheduleAnswer;
  disabled?: boolean;
  onCheck?: (answer: Omit<CpuScheduleAnswer, "kind" | "step">) => void;
}

// Lane geometry (spec §1.4): 1 time unit = COL px, clamped to 24–40 by the well's width.
const ARRIVALS = 22;
const LANE = 36;
const TICKS = 18;
const PAD = 12;
const GAP = 6;
const laneTop = ARRIVALS + GAP;
const height = laneTop + LANE + GAP + TICKS;

function colFor(available: number, total: number): number {
  return Math.min(40, Math.max(24, Math.floor((available - 2 * PAD) / Math.max(total, 1))));
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

/**
 * The slide's Gantt chart (Ch4): an arrivals strip, one lane of boxes, boundary times under the
 * edges. Built one segment at a time: first which job runs (chips), then until when (a field).
 * A job that continues later has a dotted right edge; idle CPU is a hatched box. Never grades.
 */
export function CpuSchedule({ id, spec, segments, results, goals, done, state = "idle", wrongFirst, submitted, disabled = false, onCheck }: CpuScheduleProps) {
  const finished = done >= goals.length;
  const g = goals[Math.min(done, goals.length - 1)];
  const drawn = finished ? segments.length : g.drawn;
  const editing = !!onCheck && !disabled && !finished && state !== "correct";
  const wrong = state === "incorrect";
  const groupName = useId();
  const total = segments.length ? segments[segments.length - 1].end : 0;
  const now = drawn < segments.length ? segments[drawn].start : total;
  const identify = spec.mode === "identify";
  // identify mode shows nothing policy-specific before the answer: no policy name, no quantum, no Left column;
  // the Priority column shows whenever every job has a priority, never only when the answer is Priority
  const preemptive = !identify && (spec.policy === "srt" || spec.policy === "rr");
  const showPriority = identify ? spec.jobs.every((j) => j.priority !== undefined) : spec.policy === "priority";

  const [job, setJob] = useState<string | null>(submitted?.job ?? null);
  const [end, setEnd] = useState(submitted?.end?.toString() ?? "");
  const [cells, setCells] = useState<(number | null)[]>(submitted?.values ?? spec.jobs.map(() => null));
  const [policy, setPolicy] = useState<string | null>(submitted?.policy ?? null);

  // the scale follows the well's width; a long schedule scrolls inside it with the active edge in view
  const scroller = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(scroller);
  const [col, setCol] = useState(32);
  // the well is measured after mount: until then the server and the first client render agree on
  // full labels at 32 px per unit (a width-dependent choice before hydration gives React #418, QA on #599)
  const [measured, setMeasured] = useState(false);
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const update = () => {
      setCol(colFor(box.clientWidth, total));
      setMeasured(true);
    };
    update();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(box);
    return () => ro?.disconnect();
  }, [total]);
  const typedEnd = Number(end);
  const openWidth = editing && g.tag === "end" && end !== "" && typedEnd > now ? typedEnd - now : 1;
  const laneEnd = Math.max(total, now + openWidth) + 0.5;
  const width = PAD * 2 + Math.ceil(laneEnd * col);
  useEffect(() => {
    const box = scroller.current;
    if (!box || drawn >= segments.length || box.scrollWidth <= box.clientWidth) return;
    const x = PAD + now * col + 3 * col;
    if (x > box.scrollLeft + box.clientWidth) box.scrollLeft = x - box.clientWidth;
  }, [now, col, drawn, segments.length]);

  const x = (t: number) => PAD + t * col;
  const left = remainingAfter(spec, drawn);
  const finishedJobs = new Set(spec.jobs.filter((j) => left[j.id] <= 1e-9).map((j) => j.id));
  const continuesLater = (k: number) => segments[k].job !== null && segments.slice(k + 1).some((s) => s.job === segments[k].job);
  const arrivalsAt = new Map<number, string[]>();
  for (const j of spec.jobs) arrivalsAt.set(j.arrival, [...(arrivalsAt.get(j.arrival) ?? []), j.id]);

  const columnsDone = goals.slice(0, done).flatMap((x) => (x.tag === "column" ? [x.column] : []));
  const showTable = finished ? spec.phases.some((p) => p === "finish" || p === "turnaround") : g.tag === "column" || g.tag === "average" || columnsDone.length > 0;
  const activeColumn = !finished && g.tag === "column" ? g.column : undefined;
  const averageDone = finished && spec.phases.includes("average");

  const summary = `${identify ? "Which algorithm?" : `${POLICY_NAME[spec.policy]}${spec.quantum ? `, quantum ${spec.quantum} ${spec.unit}` : ""}.`} ${spec.jobs.map((j) => `${j.id} arrives at ${j.arrival}, ${j.cpu} ${spec.unit}`).join("; ")}. ${
    drawn ? `Segments so far: ${segments.slice(0, drawn).map((s) => `${s.job ?? "idle"} from ${fmt(s.start)} to ${fmt(s.end)}`).join(", ")}.` : "No segment yet."
  }${drawn < segments.length ? ` Next starts at ${fmt(now)}.` : " Timeline complete."}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (g.tag === "job" && job !== null) onCheck!({ job });
    else if (g.tag === "end" && end !== "") onCheck!({ end: typedEnd });
    else if (g.tag === "column" && cells.every((c) => c !== null)) onCheck!({ values: cells });
    else if (g.tag === "policy" && policy !== null) onCheck!({ policy });
  }

  const goal = finished
    ? ""
    : g.tag === "job"
      ? `Segment ${g.segment + 1} · starts at ${fmt(g.time)}: which job runs?`
      : g.tag === "end"
        ? `Segment ${g.segment + 1} · ${g.job ?? "idle"} from ${fmt(g.time)}: until when?`
        : g.tag === "column"
          ? `Column ${g.column === "finish" ? "Finish" : "Turnaround"}`
          : g.tag === "average"
            ? "Average turnaround"
            : g.tag === "quantum"
              ? "Round Robin: what is the time quantum?"
              : "Which algorithm produced this chart?";

  const formId = useId();
  const chipsWrong = wrong && (g.tag === "job" || g.tag === "policy");
  const columns = [
    { key: "arrival", label: "Arrival", given: true },
    { key: "cpu", label: "CPU", given: true },
    ...(showPriority ? [{ key: "priority", label: "Priority", given: true }] : []),
    ...(preemptive ? [{ key: "left", label: "Left", given: true }] : []),
  ];

  return (
    <div className={styles.root} data-diagram={id}>
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
      <div className={styles.layout}>
        <table className={styles.jobs} aria-label="Jobs">
          <caption className={styles.caption}>{identify ? "Jobs" : `${POLICY_NAME[spec.policy]}${spec.quantum ? ` · quantum ${spec.quantum} ${spec.unit}` : ""}`}</caption>
          <thead>
            <tr>
              <th scope="col">Job</th>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.jobs.map((j) => (
              <tr key={j.id} {...focusTarget(`row-${j.id}`)}>
                <th scope="row" className="mono">
                  {j.id}
                </th>
                <td className="mono">{fmt(j.arrival)}</td>
                <td className="mono">{fmt(j.cpu)}</td>
                {showPriority && <td className="mono">{j.priority}</td>}
                {preemptive && (
                  <td className={`mono ${finishedJobs.has(j.id) ? styles.leftDone : styles.left}`} {...focusTarget(`left-${j.id}`)}>
                    {drawn === 0 ? "" : fmt(left[j.id])}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.well}>
          <div className={styles.names} aria-hidden="true" style={{ "--arrivals": `${ARRIVALS}px`, "--lane": `${LANE}px`, "--gap": `${GAP}px` } as React.CSSProperties}>
            <span>arrives</span>
            <span>CPU</span>
          </div>
          <div className={styles.scroll} ref={scroller} data-fade={fade} {...(fade === "none" ? {} : { tabIndex: 0, role: "group", "aria-label": "Timeline, scrolls sideways" })}>
            <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} style={{ width, minWidth: width }} role="img" aria-label={summary} {...focusTarget("timeline")}>
              <defs>
                <pattern id={`${id}-idle-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" className={styles.hatchLine} />
                </pattern>
              </defs>
              {/* arrivals strip: a triangle and the job id at each arrival */}
              {[...arrivalsAt.entries()].map(([t, ids]) => (
                <g key={t} className={styles.arrival} data-ready={!finished && g.tag === "job" && ids.some((i) => g.ready.includes(i)) ? "" : undefined}>
                  <path d={`M ${x(t) - 4} ${ARRIVALS - 2} l 4 -7 l 4 7 Z`} />
                  <text x={x(t) + 6} y={ARRIVALS - 4}>
                    {ids.join(" ")}
                  </text>
                </g>
              ))}
              {/* the dotted guide at the current time */}
              {!finished && drawn < segments.length && <line x1={x(now)} y1={2} x2={x(now)} y2={laneTop + LANE} className={styles.guide} />}
              {/* checked segments */}
              {segments.slice(0, drawn).map((s, k) => {
                const w = (s.end - s.start) * col;
                const label = s.job === null ? "idle" : `${s.job} ${fmt(s.end - s.start)}`;
                const narrow = measured && w < label.length * 8 + 6;
                return (
                  <g key={k} className={`${styles.segment} ${s.job === null ? styles.idle : ""}`} data-segment={k + 1} {...focusTarget(`segment-${k + 1}`)}>
                    {/* the title first and the label as one string: a <title> after text inside <text> hydrates in a different order (React #418, QA on #599) */}
                    <title>{`${s.job ?? "idle"} from ${fmt(s.start)} to ${fmt(s.end)}${continuesLater(k) ? ", continues later" : ""}`}</title>
                    <rect x={x(s.start)} y={laneTop} width={w} height={LANE} className={styles.box} />
                    {s.job === null && <rect x={x(s.start)} y={laneTop} width={w} height={LANE} fill={`url(#${id}-idle-hatch)`} />}
                    {continuesLater(k) && <line x1={x(s.end)} y1={laneTop} x2={x(s.end)} y2={laneTop + LANE} className={styles.dotted} />}
                    <text x={x(s.start) + w / 2} y={laneTop + LANE / 2 + 5} textAnchor="middle" className={`${styles.label} mono`}>
                      {narrow ? (s.job ?? "·") : `${label}${continuesLater(k) ? " ↩" : ""}`}
                    </text>
                  </g>
                );
              })}
              {/* the open slot being asked */}
              {!finished && drawn < segments.length && (g.tag === "job" || g.tag === "end") && (
                <g data-active-segment={drawn + 1}>
                  <rect x={x(now)} y={laneTop} width={openWidth * col} height={LANE} className={styles.open} />
                  <text x={x(now) + (openWidth * col) / 2} y={laneTop + LANE / 2 + 6} textAnchor="middle" className={styles.unknown}>
                    ?
                  </text>
                </g>
              )}
              {/* ticks: the boundary times, as the slides print them */}
              {[0, ...segments.slice(0, drawn).map((s) => s.end)].map((t, i) => (
                <text key={i} x={x(t)} y={height - 3} textAnchor="middle" className={`${styles.tick} ${i === drawn && !finished ? styles.tickNow : ""}`} {...focusTarget(`tick-${i}`)}>
                  {fmt(t)}
                </text>
              ))}
              {!finished && drawn < segments.length && (g.tag === "end" || g.tag === "job") && (
                <text x={x(now + openWidth)} y={height - 3} textAnchor="middle" className={styles.unknown}>
                  ?
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      {!finished && (
        <p className={shared.stepLabel} aria-live="polite">
          Step {done + 1} of {goals.length} · {goal}
        </p>
      )}

      {!finished && onCheck && (g.tag === "job" || g.tag === "end" || g.tag === "policy") && (
        <form id={formId} className={styles.form} onSubmit={submit}>
          {g.tag === "job" && (
            <fieldset className={styles.chips} role="radiogroup" aria-label={`Job for segment ${g.segment + 1}`} aria-invalid={chipsWrong || undefined}>
              {[...spec.jobs.map((j) => j.id), "idle"].map((option) => {
                const off = option !== "idle" && finishedJobs.has(option);
                return (
                  <label key={option} className={`${styles.chip} ${job === option ? styles.chipOn : ""} ${off ? styles.chipOff : ""} ${wrong && submitted?.job === option ? styles.chipWrong : ""} mono`} {...focusTarget(`job-${option}`)}>
                    <input type="radio" name={groupName} value={option} checked={job === option} disabled={!editing || off} aria-disabled={off || undefined} onChange={() => setJob(option)} />
                    {option === "idle" ? "Idle" : option}
                    {off ? " ✓" : ""}
                  </label>
                );
              })}
            </fieldset>
          )}
          {g.tag === "policy" && (
            <fieldset className={styles.chips} role="radiogroup" aria-label="Algorithm" aria-invalid={chipsWrong || undefined}>
              {(Object.keys(POLICY_SHORT) as (keyof typeof POLICY_SHORT)[]).map((p) => (
                <label key={p} className={`${styles.chip} ${policy === p ? styles.chipOn : ""} ${wrong && submitted?.policy === p ? styles.chipWrong : ""}`} {...focusTarget(`policy-${p}`)}>
                  <input type="radio" name={groupName} value={p} checked={policy === p} disabled={!editing} onChange={() => setPolicy(p)} />
                  {POLICY_SHORT[p]}
                </label>
              ))}
            </fieldset>
          )}
          {g.tag === "end" && (
            <label className={styles.until}>
              until
              <input className={`${styles.num} ${wrong ? styles.numWrong : ""} mono`} inputMode="decimal" autoComplete="off" maxLength={5} aria-label="Segment end time" aria-invalid={wrong || undefined} value={end} disabled={!editing} onChange={(e) => setEnd(e.target.value.replace(/[^0-9.]/g, ""))} {...focusTarget("segment-end")} />
              <span className={styles.unit}>{spec.unit}</span>
            </label>
          )}
          <button type="submit" className="btn btn-primary" disabled={!editing || (g.tag === "job" ? job === null : g.tag === "end" ? end === "" : policy === null)}>
            {g.tag === "job" ? "Check job" : g.tag === "end" ? "Check segment" : "Check algorithm"}
          </button>
        </form>
      )}

      {showTable && (
        <table className={styles.result} aria-label="Results" {...focusTarget("results")}>
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Arrival</th>
              <th scope="col">CPU</th>
              <th scope="col" className={activeColumn === "finish" ? styles.colNow : columnsDone.includes("finish") ? "" : styles.colLater} {...focusTarget("col-finish")}>
                Finish
              </th>
              <th scope="col" className={activeColumn === "turnaround" ? styles.colNow : columnsDone.includes("turnaround") ? "" : styles.colLater} {...focusTarget("col-turnaround")}>
                Turnaround
              </th>
            </tr>
          </thead>
          <tbody>
            {spec.jobs.map((j, i) => {
              const r = results[i];
              const cell = (column: "finish" | "turnaround") => {
                const value = column === "finish" ? r.finish : r.turnaround;
                if (columnsDone.includes(column))
                  return (
                    <td key={column} className="mono">
                      {fmt(value)}
                      {column === "turnaround" && <span className={styles.sub}>{`${fmt(r.finish)} − ${fmt(j.arrival)}`}</span>}
                    </td>
                  );
                if (activeColumn === column)
                  return (
                    <td key={column} className={wrong && wrongFirst === i ? styles.wrongCell : ""} {...focusTarget(`cell-${column}-${j.id}`)}>
                      <input form={formId} className={`${styles.cell} mono`} inputMode="decimal" autoComplete="off" aria-label={`${column === "finish" ? "Finish time" : "Turnaround"} of ${j.id}`} aria-invalid={(wrong && wrongFirst === i) || undefined} value={cells[i] ?? ""} disabled={!editing} onChange={(e) => setCells((c) => c.map((v, k) => (k === i ? (e.target.value.trim() === "" ? null : Number(e.target.value.replace(/[^0-9.]/g, ""))) : v)))} />
                    </td>
                  );
                return (
                  <td key={column} className={styles.later}>
                    ?
                  </td>
                );
              };
              return (
                <tr key={j.id} {...focusTarget(`result-${j.id}`)}>
                  <th scope="row" className="mono">
                    {j.id}
                  </th>
                  <td className="mono">{fmt(j.arrival)}</td>
                  <td className="mono">{fmt(j.cpu)}</td>
                  {cell("finish")}
                  {cell("turnaround")}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!finished && onCheck && g.tag === "column" && (
        <form id={formId} className={styles.form} onSubmit={submit}>
          <button type="submit" className="btn btn-primary" disabled={!editing || !cells.every((c) => c !== null)}>
            Check column
          </button>
        </form>
      )}
      {!finished && onCheck && g.tag === "average" && (
        <NumericInput id={`${id}-average`} prompt={`Average turnaround = (sum of turnarounds) / ${spec.jobs.length} = ? (${spec.unit}, 2 decimals)`} base={10} decimals={2} state={state} disabled={!editing} submittedText={submitted?.value?.toString()} submitLabel="Check average" onAnswer={(text) => onCheck({ value: Number(text) })} />
      )}
      {!finished && onCheck && g.tag === "quantum" && (
        <NumericInput id={`${id}-quantum`} prompt={`Time quantum (${spec.unit})`} base={10} state={state} disabled={!editing} submittedText={submitted?.value?.toString()} submitLabel="Check quantum" onAnswer={(text) => onCheck({ value: Number(text) })} />
      )}
      {averageDone && (
        <p className={styles.averageLine} {...focusTarget("average")}>
          Average turnaround = ({results.map((r) => fmt(r.turnaround)).join(" + ")}) / {spec.jobs.length} = <strong className="mono">{(results.reduce((a, r) => a + r.turnaround, 0) / spec.jobs.length).toFixed(2)}</strong> {spec.unit}
        </p>
      )}
    </div>
  );
}
