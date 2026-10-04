import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

// The kind end to end through the stage: registry, step contract, grader and the lazy view.
const xor = VariantSchema.parse({
  id: "v-xor",
  prompt: "Fill the table for F = AB' + A'B, one column at a time.",
  spec: {
    kind: "truth-table",
    inputs: ["A", "B"],
    columns: [
      { id: "na", label: "A′", expr: "A'" },
      { id: "nb", label: "B′", expr: "B'" },
      { id: "f", label: "F", expr: "AB' + A'B" },
    ],
  },
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
});
const activity: Activity = { id: "tt", title: "Truth table", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [xor] }] };
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

const editable = () => screen.getAllByRole("gridcell").filter((c) => c.hasAttribute("tabindex"));

describe("truth-table kind in the stage (#217)", () => {
  it("fills A′, then B′, then F; a wrong column marks only its first wrong cell and keeps the entries", async () => {
    render(<Harness />);
    await screen.findByRole("grid", { name: "Truth table, filling column A′" });
    const user = userEvent.setup();
    const fillColumn = async (bits: string) => {
      editable()[0].focus();
      await user.keyboard(bits);
      await user.click(screen.getByRole("button", { name: "Check column" }));
    };

    await fillColumn("1100");
    expect(await screen.findByRole("grid", { name: "Truth table, filling column B′" })).toBeInTheDocument();

    await fillColumn("1001"); // B′ is 1010: rows 1 0 and 1 1 are wrong
    const wrong = editable().filter((c) => c.getAttribute("aria-invalid") === "true");
    expect(wrong).toHaveLength(1);
    expect(wrong[0]).toHaveAccessibleName("Row 1 0, column B′, 0");
    expect(editable()[3]).toHaveAccessibleName("Row 1 1, column B′, 1");

    await fillColumn("1010");
    await screen.findByRole("grid", { name: "Truth table, filling column F" });
    await fillColumn("0110");
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Truth table" })).toHaveAttribute("aria-readonly", "true");
    expect(screen.getAllByRole("row")[2]).toHaveTextContent(/^01101$/);
  });
});
