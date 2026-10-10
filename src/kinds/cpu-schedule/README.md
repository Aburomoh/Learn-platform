# cpu-schedule

CPU scheduling, CPET181 Chapter 4 (#583; spec `docs/design/cpet181/kinds-spec.md` §1; pack
`docs/content-packs/cpet181/ch4.md`). The Gantt chart is the slide's picture, built one segment at
a time; then the finish and turnaround columns and the average turnaround. Waiting time is never
asked or shown (Lead on #545).

## Spec
`policy` (`fcfs` | `sjn` | `srt` | `priority` | `rr`), `quantum` (RR), `jobs` in slide order
(`id`, `arrival`, `cpu`, `priority`), `phases` (default `timeline`, `finish`, `turnaround`,
`average`, in that order), `mode` (`build` default, or `identify`), `unit` (`ms`).

| Goal tag | One per | Answer | Control |
|---|---|---|---|
| `job` | segment | `job` (id or `"idle"`) | chips: the jobs in table order + Idle; finished jobs are disabled facts |
| `end` | segment | `end` | the "until" field; the open box grows to the typed end |
| `column` | result column (`finish`, `turnaround`) | `values[]` (jobs order) | inputs in the result table; first wrong row marked |
| `average` | question | `value` (2 decimals) | `NumericInput decimals={2}` |
| `policy` | identify mode | `policy` | chips FCFS / SJN / SRT / Priority / RR |
| `quantum` | identify mode, RR only | `value` | asked after the policy is right (never shown before, Lead on #583) |

Two goals per segment (Lead on #583: predict the job before the time). Truth is
`src/content/os/schedule.ts` (`truth(spec)`, cached per spec); `goals(spec)` lists the goals with
`drawn` = segments shown before each. In identify mode nothing policy-specific is shown before the
answer: no policy name or quantum, no Left column; the Priority column shows whenever every job has
a priority, never only when the answer is Priority.

## Detectors
`arrival-ignored`, `fcfs-under-sjn`, `longest-first`, `not-preempted`, `preempted-nonpreemptive`,
`end-past-remaining`, `priority-reversed`, `rr-queue-order`, `turnaround-as-finish`,
`average-wrong-count`.

## Step vars
`stepNumber`, `stepCount`, `policyName`, `policyShort`, `quantum`, `jobCount`, `segmentCount`,
`unit`, `segmentNumber`, `time`, `readyList` (rung 5 only), `jobId`, `segmentEnd`, `runLength`,
`columnLabel`, `columnValues` (rung 9), `sumList`, `sum`, `average`, `averageExpression` (for the
calculator, #581), `policyList`.

## View
Jobs table beside the lane from 900 px, stacked below. Lane: arrivals strip, one row of boxes
(`job length`, dotted right edge + ↩ when the job continues later, hatched idle), boundary times
under the edges; 1 unit = 24–40 px by the well's width, scrolls inside the well with the active edge
in view. Result table: given columns filled, the asked column haloed, later ones dim; turnaround
cells show `finish − arrival` only after the column is right. Focus targets: `row-<job>`,
`left-<job>`, `timeline`, `segment-<n>`, `tick-<n>`, `segment-end`, `job-<id>`, `policy-<p>`,
`results`, `col-finish`, `col-turnaround`, `cell-<column>-<job>`, `result-<job>`, `average`.
Explain stage: `revealed` (goals shown done).
