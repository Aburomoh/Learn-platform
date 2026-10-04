import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

// content pack ch2 §5: F = (A′ + B)C, one gate output at a time, through the stage (#348).
const v = VariantSchema.parse({
  id: "v-ce",
  prompt: "Write the expression at each gate output.",
  spec: {
    kind: "circuit-predict",
    mode: "expression",
    inputs: [
      { id: "a", label: "A", value: 0 },
      { id: "b", label: "B", value: 0 },
      { id: "c", label: "C", value: 1 },
    ],
    gates: [
      { id: "n1", type: "NOT", from: ["a"] },
      { id: "g1", type: "OR", from: ["n1", "b"] },
      { id: "g2", type: "AND", from: ["g1", "c"], label: "F" },
    ],
    outputGateId: "g2",
    answer: 1,
  },
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
});
const activity: Activity = { id: "ce", title: "Circuit to expression", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [v] }] };
const reducer = createRunnerReducer(activity);

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, (a) => reducer(initialRunnerState(a), { type: "OPEN" }));
  const variant = currentVariant(activity, state);
  return (
    <QuestionView
      key={questionViewKey(variant, state)}
      variant={variant}
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

const shown = () => [...document.querySelectorAll("[data-expression]")].map((e) => `${e.getAttribute("data-expression")}=${e.textContent}`);

describe("circuit-predict expression mode in the stage (#348)", () => {
  it("one gate at a time: the active gate is marked, finished gates show their expression, later ones nothing", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    const answer = async (label: RegExp, text: string) => {
      await user.type(await screen.findByRole("textbox", { name: label }), text);
      await user.click(screen.getByRole("button", { name: "Check" }));
    };

    await screen.findByText(/Gate 1 of 3: NOT/);
    // symbolic: no 0/1 values or signal colours anywhere on the diagram
    expect(document.querySelectorAll("[data-signal]")).toHaveLength(0);
    expect(document.querySelector("[data-active]")).toHaveAttribute("data-focus-target", "gate-n1");
    expect(shown()).toEqual([]);
    expect(screen.getByRole("button", { name: "complement (NOT)" })).toBeInTheDocument(); // the shared field's key row

    await answer(/output of the NOT gate/, "A'");
    await screen.findByText(/Gate 2 of 3: OR/);
    expect(shown()).toEqual(["n1=A'"]);

    // a wrong gate is retried in place; the earlier gate keeps its expression
    await answer(/output of the OR gate/, "A'B");
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(shown()).toEqual(["n1=A'"]);
    await user.clear(screen.getByRole("textbox", { name: /output of the OR gate/ }));
    await answer(/output of the OR gate/, "B + A'");

    await answer(/output of the AND gate\. That is F\./, "(A' + B)C");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(shown()).toEqual(["n1=A'", "g1=A' + B", "g2=(A' + B)C"]);
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
