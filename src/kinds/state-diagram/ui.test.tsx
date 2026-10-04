import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";
import { arrowGeometry, defaultCells, statePositions } from "./StateDiagram";

const base = {
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
// ch5 Part II §2: A(t+1) = Ax + Bx, B(t+1) = A′x, y = (A + B)x′
const d = { kind: "state-diagram", stateVars: ["A", "B"], input: "x", next: ["Ax + Bx", "A'x"], output: { name: "y", expr: "(A + B)x'" } };
const labelV = VariantSchema.parse({ id: "v-l", prompt: "Label each arrow.", spec: d, ...base });
const nextV = VariantSchema.parse({ id: "v-n", prompt: "Draw each arrow.", spec: { ...d, mode: "next" }, ...base });

function Harness({ variant }: { variant: typeof labelV }) {
  const activity: Activity = { id: "sd", title: "State diagram", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
  const [state, dispatch] = useReducer(createRunnerReducer(activity), activity, (a) => createRunnerReducer(a)(initialRunnerState(a), { type: "OPEN" }));
  const v = currentVariant(activity, state);
  return (
    <QuestionView
      key={questionViewKey(v, state)}
      variant={v}
      last={state.last}
      stepIndex={state.stepIndex}
      locked={state.tutor.stage === "complete"}
      explanation={null}
      onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })}
      onPredict={() => {}}
      onContinue={() => {}}
    />
  );
}

const arrows = () => [...document.querySelectorAll("[data-arrow]")].map((a) => `${a.getAttribute("data-arrow")}:${a.getAttribute("data-state")}`);

describe("state diagram geometry", () => {
  it("four states sit 2 × 2, eight as two rows of four", () => {
    expect(statePositions(defaultCells(4))).toMatchObject({ cols: 2, rows: 2 });
    expect(statePositions(defaultCells(8))).toMatchObject({ cols: 4, rows: 2 });
    // authored cells win: a ring of four in one row
    const row = statePositions([[0, 0], [1, 0], [2, 0], [3, 0]]);
    expect(row).toMatchObject({ cols: 4, rows: 1 });
    expect(row.at[3].x).toBeGreaterThan(row.at[2].x);
  });

  it("the two directions between a pair bend to opposite sides, so they never overlap", () => {
    const [p, q] = [{ x: 80, y: 100 }, { x: 280, y: 100 }];
    const there = arrowGeometry(p, q);
    const back = arrowGeometry(q, p);
    expect(there.label.y).toBeGreaterThan(p.y); // travelling right: bent below
    expect(back.label.y).toBeLessThan(p.y); // travelling left: bent above
  });
});

describe("state-diagram kind in the stage (#240)", () => {
  it("label mode: every arrow is pre-drawn; the active one has a '?/?' slot; the label is picked from chips", async () => {
    render(<Harness variant={labelV} />);
    const user = userEvent.setup();
    await screen.findByText("Arrow 1 of 8: 00 → 00");
    // seven distinct arrows (10 → 00 … ), all drawn; the first is active, the rest later
    expect(arrows().filter((a) => a.endsWith(":active"))).toEqual(["00>00:active"]);
    expect(arrows().every((a) => a.endsWith(":active") || a.endsWith(":later"))).toBe(true);
    expect(document.querySelector("[data-label='0']")).toHaveTextContent("?/?");
    const chips = screen.getByRole("radiogroup", { name: "Label of the arrow from 00 to 00" });
    expect(within(chips).getAllByRole("radio").map((r) => (r as HTMLInputElement).value)).toEqual(["0/0", "0/1", "1/0", "1/1"]);
    expect(screen.getByRole("button", { name: "Check arrow" })).toBeDisabled();

    await user.click(within(chips).getByRole("radio", { name: "0/1" }));
    await user.click(screen.getByRole("button", { name: "Check arrow" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await user.click(within(chips).getByRole("radio", { name: "0/0" }));
    await user.click(screen.getByRole("button", { name: "Check arrow" }));

    await screen.findByText("Arrow 2 of 8: 00 → 01");
    expect(document.querySelector("[data-label='0']")).toHaveTextContent("0/0");
    expect(arrows()).toContain("00>00:done");
    expect(screen.getByRole("img", { name: /Arrows done: 00 to 00 on 0\/0\./ })).toBeInTheDocument();
    // the state table sits with the diagram, as the source to read from
    expect(within(screen.getByRole("table", { name: "State table" })).getAllByRole("row")).toHaveLength(9);
  });

  it("next mode: unanswered arrows are not drawn; the destination is picked on the circles", async () => {
    render(<Harness variant={nextV} />);
    const user = userEvent.setup();
    await screen.findByText("Arrow 1 of 8: from 00 with x = 0");
    expect(arrows()).toEqual([]);
    const group = screen.getByRole("radiogroup", { name: "Next state: 00, 01, 10, 11" });
    const circle = (code: string) => within(group).getByRole("radio", { name: `State ${code}` });
    expect(document.querySelector("[data-source]")).toHaveAttribute("data-focus-target", "state-00");

    // keyboard: one tab stop, arrows move, Space picks
    circle("00").focus();
    await user.keyboard("{ArrowRight} ");
    expect(circle("01")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Next state: 01")).toBeInTheDocument();
    await user.click(circle("00"));
    await user.click(screen.getByRole("button", { name: "Check arrow" }));

    await screen.findByText("Arrow 2 of 8: from 00 with x = 1");
    expect(arrows()).toEqual(["00>00:done"]);
  });

  it("a shared arrow takes its two labels in either order and draws each as given", async () => {
    // both rows of every state go to the same next state: A(t+1) = B, B(t+1) = A′, y = x
    const shared = VariantSchema.parse({ id: "v-s", prompt: "Label each arrow.", spec: { kind: "state-diagram", stateVars: ["A", "B"], input: "x", next: ["B", "A'"], output: { name: "y", expr: "x" } }, ...base });
    render(<Harness variant={shared} />);
    const user = userEvent.setup();
    await screen.findByText("Arrow 1 of 8: 00 → 01");
    const answer = async (label: string) => {
      await user.click(screen.getByRole("radio", { name: label }));
      await user.click(screen.getByRole("button", { name: "Check arrow" }));
    };
    await answer("1/1"); // the second row's label first: accepted
    await screen.findByText("Arrow 2 of 8: 00 → 01");
    expect(document.querySelector("[data-label='0']")).toHaveTextContent("1/1");
    await answer("1/1"); // already taken on this arrow
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await answer("0/0");
    await screen.findByText("Arrow 3 of 8: 01 → 11");
    expect(document.querySelector("[data-label='1']")).toHaveTextContent("0/0");
  });
});
