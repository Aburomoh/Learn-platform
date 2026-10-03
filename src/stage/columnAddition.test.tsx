import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import type { Activity } from "@/content/schema";
import { addition1101 } from "@/content/fixtures/columnAddition";
import { createRunnerReducer, initialRunnerState, currentVariant, type RunnerAction, type RunnerState } from "./runnerReducer";
import { QuestionView } from "./QuestionView";

// A one-question activity built from the slide example 1101 + 0111 = 10100.
const activity: Activity = {
  id: "addition",
  title: "Addition",
  summary: "",
  authority: "DEMO",
  minutes: 1,
  questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [addition1101] }],
};
const reducer = createRunnerReducer(activity);
const step = (i: number, sum: number, carry?: number): RunnerAction => ({ type: "SUBMIT", answer: { kind: "column-addition", step: i, sum, carry } });
const run = (actions: RunnerAction[], start = initialRunnerState(activity)): RunnerState => actions.reduce((s, a) => reducer(s, a), start);

describe("runner reducer: column addition", () => {
  it("each column is its own step; the final carry completes the question", () => {
    let s = run([{ type: "OPEN" }, step(0, 0, 1)]);
    expect(s.stepIndex).toBe(1);
    s = run([step(1, 0, 1), step(2, 1, 1), step(3, 0, 1)], s);
    expect(s.stepIndex).toBe(4);
    expect(s.completed[0]).toBe(false);
    s = run([step(4, 1)], s);
    expect(s.tutor.stage).toBe("complete");
  });

  it("a wrong column is retried on its own with a nudge about that column", () => {
    const s = run([{ type: "OPEN" }, step(0, 0, 1), step(1, 1, 0)]);
    expect(s.stepIndex).toBe(1);
    expect(s.last?.result.misconceptionId).toBe("add.carry-ignored");
    expect(s.message).toBe("Remember the carry coming in from the right. This column adds 0 + 1 + 1.");
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

describe("stage: column addition rendered through QuestionView", () => {
  it("walks 1101 + 0111 column by column by keyboard to 10100", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    // column 1: 1 + 1 → writing 2 is recognised and the column is retried
    await user.type(screen.getByLabelText(/first column from the right, 1 \+ 1: sum bit/), "2");
    await user.type(screen.getByLabelText(/first column from the right: carry/), "0{Enter}");
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/first column from the right, 1 \+ 1: sum bit/));
    await user.type(screen.getByLabelText(/first column from the right, 1 \+ 1: sum bit/), "0");
    await user.clear(screen.getByLabelText(/first column from the right: carry/));
    await user.type(screen.getByLabelText(/first column from the right: carry/), "1{Enter}");

    // the remaining columns: focus is already on the sum bit of the new column
    for (const [sum, carry] of [["0", "1"], ["1", "1"], ["0", "1"]]) {
      expect(screen.getByLabelText(/sum bit/)).toHaveFocus();
      await user.keyboard(sum);
      await user.tab();
      await user.keyboard(`${carry}{Enter}`);
    }
    // final carry
    expect(screen.getByLabelText("Final carry: bit to bring down")).toHaveFocus();
    await user.keyboard("1{Enter}");

    expect(screen.getByTestId("stage")).toHaveTextContent("complete");
    expect(document.querySelector("[data-focus-target='add-result']")).toHaveTextContent("1101 + 0111 = 10100");
    // many keystrokes: allow more than the default 5 s on a busy machine
  }, 20_000);
});
