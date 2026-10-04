import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useReducer, type Dispatch } from "react";
import type { Activity } from "@/content/schema";
import { placeValue29, placeValue45 } from "@/content/fixtures/placeValue45";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey, type RunnerAction } from "./runnerReducer";
import { QuestionView } from "./QuestionView";

// Two variants of the same kind: the retry must start from an empty row, not from 45's digits.
const activity: Activity = {
  id: "pv",
  title: "Place value",
  summary: "",
  authority: "DEMO",
  minutes: 1,
  questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [placeValue45, placeValue29] }],
};
const reducer = createRunnerReducer(activity);
let send: Dispatch<RunnerAction> = () => {};

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, initialRunnerState);
  useEffect(() => {
    send = dispatch;
  }, [dispatch]);
  const variant = currentVariant(activity, state);
  return (
    <>
      <p data-testid="variant">{variant.id}</p>
      <QuestionView key={questionViewKey(variant, state)} variant={variant} last={state.last} stepIndex={state.stepIndex} locked={false} explanation={null} onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })} onPredict={() => {}} onContinue={() => {}} />
    </>
  );
}

describe("a retry on other numbers of the same kind gets a fresh view (ADR-0008, owner rule)", () => {
  it("the place-value row is empty again after switching from 45 to 29", async () => {
    render(<Harness />);
    act(() => send({ type: "OPEN" }));
    const user = userEvent.setup();
    // the kind's view is lazy: wait for it, then place a 1 in the 32 slot
    const one = await screen.findByRole("button", { name: "1" });
    one.focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(screen.getByText("Total so far:").parentElement).toHaveTextContent("32");

    // "Try with other numbers"
    act(() => send({ type: "RETRY_VARIANT" }));
    expect(screen.getByTestId("variant")).toHaveTextContent("v29");
    expect((await screen.findByText("Total so far:")).parentElement).toHaveTextContent("0");
  });

  it("the view key changes with the variant alone, whatever path switches it", () => {
    expect(questionViewKey(placeValue45, { interactionKey: 3 })).not.toBe(questionViewKey(placeValue29, { interactionKey: 3 }));
    expect(questionViewKey(placeValue45, { interactionKey: 3 })).not.toBe(questionViewKey(placeValue45, { interactionKey: 4 }));
  });
});
