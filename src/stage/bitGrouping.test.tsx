import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import type { Activity } from "@/content/schema";
import { hex26, octal88 } from "@/content/fixtures/bitGrouping";
import { createRunnerReducer, initialRunnerState, currentVariant, type RunnerAction, type RunnerState } from "./runnerReducer";
import { QuestionView } from "./QuestionView";

// A one-question activity built from the grouping fixtures (26 → 1A in hex; retry variant 88 → 130 in octal).
const activity: Activity = {
  id: "grouping",
  title: "Grouping",
  summary: "",
  authority: "DEMO",
  minutes: 1,
  questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [hex26, octal88] }],
};
const reducer = createRunnerReducer(activity);
const groups = (g: string[]): RunnerAction => ({ type: "SUBMIT", answer: { kind: "bit-grouping", step: 0, groups: g } });
const digit = (step: number, d: string): RunnerAction => ({ type: "SUBMIT", answer: { kind: "bit-grouping", step, digit: d } });
const run = (actions: RunnerAction[], start = initialRunnerState(activity)): RunnerState => actions.reduce((s, a) => reducer(s, a), start);

describe("runner reducer: octal/hex grouping, one goal at a time", () => {
  it("marking the groups is its own step; each digit is the next goal", () => {
    let s = run([{ type: "OPEN" }, groups(["0001", "1010"])]);
    expect(s.stepIndex).toBe(1);
    expect(s.completed[0]).toBe(false);
    s = run([digit(1, "1")], s);
    expect(s.stepIndex).toBe(2);
    s = run([digit(2, "a")], s);
    expect(s.tutor.stage).toBe("complete");
    expect(s.completed[0]).toBe(true);
  });

  it("a wrong grouping is retried without moving on, with a nudge about the mistake", () => {
    const s = run([{ type: "OPEN" }, groups(["1", "1010"])]);
    expect(s.stepIndex).toBe(0);
    expect(s.last?.result).toMatchObject({ correct: false, misconceptionId: "ns.group-no-padding" });
    expect(s.message).toContain("add zeros on its left until it has 4 bits");
  });

  it("uses the hint ladder of the current kind of step", () => {
    let s = run([{ type: "OPEN" }, groups(["1101", "0"]), groups(["110", "10"])]);
    expect(s.hints.map((h) => h.text)).toEqual(["Groups of 4, starting at the right. Add 3 zero(s) on the left."]);
    s = run([groups(["0001", "1010"]), digit(1, "1"), digit(2, "7"), digit(2, "7")], s);
    expect(s.hints.map((h) => h.text)).toEqual(["Group 2 is 1010. What is its value?"]);
  });

  it("recognises 10 typed for A", () => {
    const s = run([{ type: "OPEN" }, groups(["0001", "1010"]), digit(1, "1"), digit(2, "10")]);
    expect(s.last?.result.misconceptionId).toBe("ns.hex-digit-decimal");
    expect(s.stepIndex).toBe(2);
  });
});

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, initialRunnerState);
  const variant = currentVariant(activity, state);
  const stage = state.tutor.stage;
  return (
    <>
      <QuestionView
        key={`${variant.id}-${state.interactionKey}`}
        variant={variant}
        last={state.last}
        stepIndex={state.stepIndex}
        locked={stage === "complete" || stage === "explaining"}
        explanation={state.explanation}
        onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })}
        onPredict={() => {}}
        onContinue={() => {}}
      />
      <output data-testid="stage">{stage}</output>
    </>
  );
}

describe("stage: grouping question rendered through QuestionView", () => {
  it("walks 26 → (1A) in hex: pad and cut, then one digit per group, then the joined result", async () => {
    render(<Harness />);
    // the kind's view is loaded on demand (ADR-0008): wait for it once
    await screen.findByRole("button", { name: "Add a leading zero" });
    const user = userEvent.setup();
    // step 0: nothing about the groups or digits is shown yet
    expect(screen.queryByRole("textbox")).toBeNull();
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Add a leading zero" }));
    await user.click(screen.getByRole("button", { name: /Bit 5 of 8: 1\. Start a new group here/ }));
    await user.click(screen.getByRole("button", { name: "Check groups" }));

    // step 1: first group only
    const first = screen.getByLabelText("Group 1 of 2, 0001: hexadecimal digit");
    expect(first).toHaveFocus();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    await user.keyboard("1{Enter}");

    // step 2: a wrong digit stays on this group
    await user.keyboard("9{Enter}");
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    const second = screen.getByLabelText("Group 2 of 2, 1010: hexadecimal digit");
    await user.clear(second);
    await user.type(second, "a{Enter}");

    expect(screen.getByTestId("stage")).toHaveTextContent("complete");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector("[data-focus-target='group-result']")).toHaveTextContent("(1A)16");
  });
});
