import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";
import { normaliseMinus } from "./WeightDiagram";

// The slides' (101.101)_2 → 5.625 (Ch.1 s.12), through the stage: weights, terms, sum.
const v = VariantSchema.parse({
  id: "v-101",
  prompt: "Convert (101.101)_2 to decimal, by place value.",
  spec: { kind: "base-to-decimal", base: 2, number: "101.101" },
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
});
const activity: Activity = { id: "b2d", title: "Base to decimal", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [v] }] };
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

describe("base-to-decimal kind in the stage (#208)", () => {
  it("accepts a typed minus sign", () => {
    expect(normaliseMinus(" −3 ")).toBe("-3");
  });

  it("weights, then terms, then the sum; a wrong weight marks only the first wrong cell", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    const form = await screen.findByRole("form", { name: "101.101 in base 2, by place value" });
    expect(form).toBeInTheDocument();
    const fill = async (values: string[], button: string) => {
      const cells = screen.getAllByRole("textbox");
      for (const [i, value] of values.entries()) {
        await user.clear(cells[i]);
        await user.type(cells[i], value);
      }
      await user.click(screen.getByRole("button", { name: button }));
    };

    // weights counted from the wrong end: the first wrong cell is pointed at, entries kept
    await fill(["-3", "-2", "-1", "0", "1", "2"], "Check weights");
    const marked = screen.getAllByRole("textbox").filter((c) => c.getAttribute("aria-invalid") === "true");
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAccessibleName("Power under digit 1 (1)");
    await fill(["2", "1", "0", "−1", "-2", "-3"], "Check weights");

    await screen.findByRole("button", { name: "Check terms" });
    expect(screen.getByRole("form")).toHaveTextContent("2-1"); // the weights row is done and shown
    await fill(["4", "0", "1", "0.5", "0", "0.125"], "Check terms");

    await screen.findByRole("button", { name: "Check sum" });
    await fill(["5.625"], "Check sum");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByRole("form")).toHaveTextContent("(101.101)2 = (5.625)10");
  });
});
