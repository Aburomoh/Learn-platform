import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

const base = {
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
// Ch4 s.22: SJN A(0,2) B(1,4) C(2,1) D(4,2) → A 0–2, C –3, B –7, D –9; TAT 2, 6, 1, 5; avg 3.5
const sjn: Variant = VariantSchema.parse({
  id: "v-sjn",
  prompt: "Build the Gantt chart with SJN, then the table.",
  spec: { kind: "cpu-schedule", policy: "sjn", jobs: [{ id: "A", arrival: 0, cpu: 2 }, { id: "B", arrival: 1, cpu: 4 }, { id: "C", arrival: 2, cpu: 1 }, { id: "D", arrival: 4, cpu: 2 }] },
  ...base,
});
const identify: Variant = VariantSchema.parse({
  id: "v-id",
  prompt: "Which algorithm produced this chart?",
  spec: { kind: "cpu-schedule", policy: "rr", quantum: 4, mode: "identify", jobs: [{ id: "A", arrival: 0, cpu: 7 }, { id: "B", arrival: 2, cpu: 4 }, { id: "C", arrival: 4, cpu: 3 }, { id: "D", arrival: 6, cpu: 5 }] },
  ...base,
});

function Harness({ variant }: { variant: Variant }) {
  const activity: Activity = { id: "cs", title: "CPU scheduling", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
  const [state, dispatch] = useReducer(createRunnerReducer(activity), activity, (a) => createRunnerReducer(a)(initialRunnerState(a), { type: "OPEN" }));
  const v = currentVariant(activity, state);
  return <QuestionView key={questionViewKey(v, state)} variant={v} last={state.last} stepIndex={state.stepIndex} locked={state.tutor.stage === "complete"} explanation={null} onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })} onPredict={() => {}} onContinue={() => {}} />;
}

// the label's own text, without its <title>
const segments = () => [...document.querySelectorAll("[data-segment] text")].map((t) => [...t.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim());
const ticks = () => [...document.querySelectorAll("[data-focus-target^='tick-']")].map((t) => t.textContent);

describe("cpu-schedule kind in the stage (#583)", () => {
  it("builds the chart: job chips then the end field; nothing is drawn before its check; the Left column is absent for SJN", async () => {
    render(<Harness variant={sjn} />);
    const user = userEvent.setup();
    await screen.findByText(/Step 1 of 11 · Segment 1 · starts at 0: which job runs\?/);
    expect(segments()).toEqual([]);
    expect(ticks()).toEqual(["0"]);
    expect(within(screen.getByRole("table", { name: "Jobs" })).queryByText("Left")).toBeNull();
    expect(screen.queryByRole("table", { name: "Results" })).toBeNull();
    const chips = screen.getByRole("radiogroup", { name: "Job for segment 1" });
    expect(within(chips).getAllByRole("radio").map((r) => (r as HTMLInputElement).value)).toEqual(["A", "B", "C", "D", "idle"]);

    await user.click(within(chips).getByRole("radio", { name: "B" })); // not arrived
    await user.click(screen.getByRole("button", { name: "Check job" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(chips).toHaveAttribute("aria-invalid", "true");
    await user.click(within(chips).getByRole("radio", { name: "A" }));
    await user.click(screen.getByRole("button", { name: "Check job" }));

    await screen.findByText(/Step 2 of 11 · Segment 1 · A from 0: until when\?/);
    expect(segments()).toEqual([]); // the box draws only once the end is right
    await user.type(screen.getByRole("textbox", { name: "Segment end time" }), "2{Enter}");
    await screen.findByText(/Step 3 of 11 · Segment 2 · starts at 2/);
    expect(segments()).toEqual(["A 2"]);
    expect(ticks()).toEqual(["0", "2"]);

    // at 2: B (4) and C (1) are ready; SJN takes C
    await user.click(screen.getByRole("radio", { name: "C" }));
    await user.click(screen.getByRole("button", { name: "Check job" }));
    await user.type(await screen.findByRole("textbox", { name: "Segment end time" }), "3{Enter}");
    await screen.findByText(/Step 5 of 11/);
    await user.click(screen.getByRole("radio", { name: "B" }));
    await user.click(screen.getByRole("button", { name: "Check job" }));
    await user.type(await screen.findByRole("textbox", { name: "Segment end time" }), "7{Enter}");
    await screen.findByText(/Step 7 of 11/);
    // finished jobs are disabled facts, not hints
    expect(screen.getByRole("radio", { name: "A ✓" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "D" }));
    await user.click(screen.getByRole("button", { name: "Check job" }));
    await user.type(await screen.findByRole("textbox", { name: "Segment end time" }), "9{Enter}");

    // the result table: finish column asked, turnaround later
    await screen.findByText(/Step 9 of 11 · Column Finish/);
    expect(segments()).toEqual(["A 2", "C", "B 4", "D 2"]); // a 1-unit box is narrower than its label: id only (spec §1.4)
    const table = screen.getByRole("table", { name: "Results" });
    expect(within(table).getAllByRole("textbox").map((t) => t.getAttribute("aria-label"))).toEqual(["Finish time of A", "Finish time of B", "Finish time of C", "Finish time of D"]);
    for (const [job, v] of [["A", "2"], ["B", "6"], ["C", "3"], ["D", "9"]]) await user.type(within(table).getByRole("textbox", { name: `Finish time of ${job}` }), v);
    await user.click(screen.getByRole("button", { name: "Check column" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(within(table).getByRole("textbox", { name: "Finish time of B" })).toHaveAttribute("aria-invalid", "true");
    expect(within(table).getByRole("textbox", { name: "Finish time of D" })).not.toHaveAttribute("aria-invalid");
    await user.clear(within(table).getByRole("textbox", { name: "Finish time of B" }));
    await user.type(within(table).getByRole("textbox", { name: "Finish time of B" }), "7");
    await user.click(screen.getByRole("button", { name: "Check column" }));

    await screen.findByText(/Step 10 of 11 · Column Turnaround/);
    for (const [job, v] of [["A", "2"], ["B", "6"], ["C", "1"], ["D", "5"]]) await user.type(screen.getByRole("textbox", { name: `Turnaround of ${job}` }), v);
    await user.click(screen.getByRole("button", { name: "Check column" }));
    await screen.findByText(/Step 11 of 11 · Average turnaround/);
    expect(screen.getByText("7 − 1")).toBeInTheDocument(); // the subtraction shows only after the column is right
    await user.type(screen.getByRole("textbox", { name: /Average turnaround/ }), "3.5");
    await user.click(screen.getByRole("button", { name: "Check average" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/Average turnaround = \(2 \+ 6 \+ 1 \+ 5\) \/ 4 =/)).toBeInTheDocument();
  });

  it("identify mode: the whole chart is given, nothing policy-specific shown; the policy is picked, then the quantum asked", async () => {
    render(<Harness variant={identify} />);
    const user = userEvent.setup();
    await screen.findByText(/Step 1 of 2 · Which algorithm produced this chart\?/);
    expect(screen.queryByText(/quantum/i)).toBeNull();
    expect(screen.queryByText("Round Robin")).toBeNull();
    expect(within(screen.getByRole("table", { name: "Jobs" })).queryByText("Left")).toBeNull();
    expect(segments()).toEqual(["A 4 ↩", "B 4", "C 3", "A 3", "D 4 ↩", "D"]);
    expect(ticks()).toEqual(["0", "4", "8", "11", "14", "18", "19"]);
    const chips = screen.getByRole("radiogroup", { name: "Algorithm" });
    await user.click(within(chips).getByRole("radio", { name: "FCFS" }));
    await user.click(screen.getByRole("button", { name: "Check algorithm" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await user.click(within(chips).getByRole("radio", { name: "RR" }));
    await user.click(screen.getByRole("button", { name: "Check algorithm" }));
    await screen.findByText(/Step 2 of 2 · Round Robin: what is the time quantum\?/);
    await user.type(screen.getByRole("textbox", { name: /Time quantum/ }), "4");
    await user.click(screen.getByRole("button", { name: "Check quantum" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
  });
});
