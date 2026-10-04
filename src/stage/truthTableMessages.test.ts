import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { hasMessage } from "@/tutor";
import { createRunnerReducer, initialRunnerState, type RunnerAction, type RunnerState } from "./runnerReducer";

/** #223: fixtures, not course content; the real Chapter 2 content arrives with its own PRs. */
const detectors = [
  { id: "tt.and-or", title: "AND and OR swapped", nudgeKey: "tt.and-or-swapped", detect: { type: "and-or-swapped" } },
  { id: "tt.not", title: "NOT not applied", nudgeKey: "tt.not-missing", detect: { type: "not-missing" } },
  { id: "tt.order", title: "Rows out of order", nudgeKey: "tt.rows-out-of-order", detect: { type: "rows-out-of-order" } },
  { id: "tt.inverted", title: "Picked the 0-rows", nudgeKey: "tt.rows-inverted", detect: { type: "rows-inverted" } },
];
const base = { prompt: "Fill the table.", vars: {}, hints: [{ rung: 2, text: "Not yet." }], explanation: [{ id: "s1", say: "One." }, { id: "s2", say: "Two." }], misconceptions: detectors };

const variant = (id: string, spec: unknown): Variant => VariantSchema.parse({ ...base, id, spec });
const fillTable = variant("v-fill", {
  kind: "truth-table",
  inputs: ["A", "B"],
  fillInputs: true,
  columns: [
    { id: "and", label: "AB", expr: "AB" },
    { id: "nand", label: "(AB)′", expr: "(AB)'" },
  ],
});
const pickRows = variant("v-rows", {
  kind: "truth-table",
  inputs: ["A", "B"],
  mode: "row-select",
  target: "f",
  columns: [{ id: "f", label: "A + B", expr: "A + B" }],
});

function activityOf(v: Variant): Activity {
  const a = getActivity("ecet111", "number-systems", "decimal-to-binary")!.activity;
  return { ...a, questions: [{ ...a.questions[0], variants: [v, { ...v, id: `${v.id}-b` }] }] };
}
function runOn(v: Variant, actions: RunnerAction[], from?: RunnerState): RunnerState {
  const activity = activityOf(v);
  const r = createRunnerReducer(activity);
  return actions.reduce((s, a) => r(s, a), from ?? initialRunnerState(activity));
}
const cells = (step: number, values: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "truth-table", step, values: [...values].map((c) => Number(c) as 0 | 1) } });
const rows = (picked: number[]): RunnerAction => ({ type: "SUBMIT", answer: { kind: "truth-table", step: 0, rows: picked } });
const sentences = (m: string) => m.split(/(?<=[.?!])\s/).length;

describe("#223 truth table: step lines", () => {
  const open: RunnerAction = { type: "OPEN" };

  it("names the next column, and the last one", () => {
    // inputs A, B first, then AB, (AB)′: steps A, B, AB, (AB)′
    let s = runOn(fillTable, [open, cells(0, "0011")]);
    expect(s.message).toBe("Good. Now the B column.");
    s = runOn(fillTable, [cells(1, "0101"), cells(2, "0001")], s);
    expect(s.message).toBe("Good. Last column: (AB)′.");
  });

  it("a wrong cell without a recognised slip points at the marked cell, not a flat 'not quite'", () => {
    const s = runOn(fillTable, [open, cells(0, "0111")]);
    expect(s.last?.result.wrongCells).toMatchObject({ first: 1 });
    expect(s.message).toBe("Cells not right yet: 1. The inputs count up in binary, starting from all zeros.");
    const col = runOn(fillTable, [open, cells(0, "0011"), cells(1, "0101"), cells(2, "1001")]);
    expect(col.message).toBe("Cells not right yet: 2. Check the marked one first: work out AB for that row on its own.");
  });

  it("row-select wrong picks point at the marked row", () => {
    const s = runOn(pickRows, [open, rows([1, 2])]); // A + B is 1 on rows 1, 2, 3
    expect(s.message).toBe("Rows not right yet: 1. Check the marked row first: is A + B 1 or 0 there?");
  });
});

describe("#223 truth table: every detector has its own short nudge, none gives the answer", () => {
  const open: RunnerAction = { type: "OPEN" };
  const passInputs = [cells(0, "0011"), cells(1, "0101")];

  it("and-or-swapped", () => {
    const m = runOn(fillTable, [open, ...passInputs, cells(2, "0111")]).message; // A+B instead of AB
    expect(m).toBe("Look at the AND and OR signs again. AND needs every part to be 1; OR needs just one.");
    expect(sentences(m)).toBeLessThanOrEqual(2);
  });

  it("not-missing", () => {
    const m = runOn(fillTable, [open, ...passInputs, cells(2, "0001"), cells(3, "0001")]).message; // AB written for (AB)′
    expect(m).toBe("A bar or prime flips a value. Did you flip it before using it?");
  });

  it("rows-out-of-order", () => {
    const m = runOn(fillTable, [open, cells(0, "0101")]).message; // B's column written under A
    expect(m).toBe("The rows count up in binary, starting from all zeros. The last input changes on every row.");
  });

  it("rows-inverted", () => {
    const m = runOn(pickRows, [open, rows([0])]).message; // the 0-row picked
    expect(m).toBe("Those are the rows where it is 0. Pick the rows where it is 1.");
  });

  it("none of the lines contains an unfilled slot, and every nudge key resolves", () => {
    for (const d of detectors) expect(hasMessage(d.nudgeKey), d.nudgeKey).toBe(true);
    for (const k of ["wrong.cell", "wrong.cell.column", "wrong.cell.inputs", "wrong.cell.rows", "step.next-table-column", "step.last-table-column"]) expect(hasMessage(k), k).toBe(true);
  });
});

describe("#223 every kind that reports wrongCells gets a generic line with no unfilled slot", () => {
  const open: RunnerAction = { type: "OPEN" };
  const baseToDecimal = VariantSchema.parse({ ...base, id: "v-b2d", spec: { kind: "base-to-decimal", base: 2, number: "101.101" }, misconceptions: [] });

  it("truth table (every step tag) and base to decimal", () => {
    const wrongs: [Variant, RunnerAction[]][] = [
      [fillTable, [open, cells(0, "0111")]], // inputs
      [fillTable, [open, cells(0, "0011"), cells(1, "0101"), cells(2, "1001")]], // column
      [pickRows, [open, rows([1, 2])]], // rows
      [baseToDecimal, [open, { type: "SUBMIT", answer: { kind: "base-to-decimal", step: 0, powers: [2, 1, 1, -1, -2, -3] } }]], // weights
    ];
    for (const [v, actions] of wrongs) {
      const m = runOn(v, actions).message;
      expect(m, m).not.toMatch(/\{[a-zA-Z0-9_]+\}|missing message/);
      expect(m, m).toMatch(/not right yet: \d/);
    }
  });
});
