import { describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useReducer, type Dispatch } from "react";
import { getActivity } from "@/content";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey, type RunnerAction } from "./runnerReducer";
import { QuestionView } from "./QuestionView";

// Circuit-predict holds the gate step's choice and the explore toggles in its view: a retry on
// other inputs (v101 -> v000) must start at gate 1 with nothing chosen and the authored inputs.
const activity = getActivity("ecet111", "logic-gates", "predict-gate-output")!.activity;
const reducer = createRunnerReducer(activity);
let send: Dispatch<RunnerAction> = () => {};

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, initialRunnerState);
  useEffect(() => {
    send = dispatch;
  }, [dispatch]);
  const variant = currentVariant(activity, state);
  const stage = state.tutor.stage;
  return (
    <>
      <p data-testid="variant">{variant.id}</p>
      <QuestionView key={questionViewKey(variant, state)} variant={variant} last={state.last} stepIndex={state.stepIndex} locked={stage === "complete" || stage === "explaining"} explanation={null} onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })} onPredict={() => {}} onContinue={() => {}} />
    </>
  );
}

async function answer(user: ReturnType<typeof userEvent.setup>, value: "0" | "1") {
  const group = screen.getByRole("radiogroup");
  await user.click(within(group).getAllByRole("radio").find((r) => (r as HTMLInputElement).value === value)!);
  await user.click(screen.getByRole("button", { name: "Check" }));
}

describe("a retry on other inputs of the same circuit kind gets a fresh view (owner rule)", () => {
  it("after a wrong answer: the old choice and its mark are gone", async () => {
    render(<Harness />);
    act(() => send({ type: "OPEN" }));
    const user = userEvent.setup();
    await screen.findByText(/Gate 1 of 3/);
    await answer(user, "0");
    expect(screen.getAllByRole("radio").find((r) => (r as HTMLInputElement).value === "0")).toBeChecked();

    act(() => send({ type: "RETRY_VARIANT" }));
    expect(screen.getByTestId("variant")).toHaveTextContent("v000");
    await screen.findByText(/Gate 1 of 3/);
    for (const r of screen.getAllByRole("radio")) expect(r).not.toBeChecked();
    expect(screen.queryByText("✗")).toBeNull();
  });

  it("after exploring: the toggled inputs do not carry over", async () => {
    render(<Harness />);
    act(() => send({ type: "OPEN" }));
    const user = userEvent.setup();
    await screen.findByText(/Gate 1 of 3/);
    for (const v of ["1", "1", "1"] as const) await answer(user, v); // v101: NOT b=1, AND=1, OR=1
    await user.click(screen.getByRole("switch", { name: /Input B, currently 0/ }));
    expect(screen.getByRole("switch", { name: /Input B, currently 1/ })).toBeInTheDocument();

    act(() => send({ type: "RETRY_VARIANT" }));
    expect(screen.getByTestId("variant")).toHaveTextContent("v000");
    await screen.findByText(/Gate 1 of 3/);
    for (const v of ["1", "0", "0"] as const) await answer(user, v); // v000: NOT b=1, AND=0, OR=0
    expect(screen.getByRole("switch", { name: /Input B, currently 0/ })).toBeInTheDocument();
  });
});
