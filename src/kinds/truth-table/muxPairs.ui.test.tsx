import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

// ch4 pack §6 (s.48–51): F(x, y, z) = Σ(1, 2, 6, 7) with a 4→1 mux: I0 = z, I1 = z′, I2 = 0, I3 = 1
const v = VariantSchema.parse({
  id: "v-mux",
  prompt: "Implement F with a 4-to-1 multiplexer: x and y select, z is the data variable.",
  spec: { kind: "truth-table", inputs: ["x", "y", "z"], mode: "mux-pairs", target: "f", columns: [{ id: "f", label: "F", values: [0, 1, 1, 0, 0, 0, 1, 1], given: true }] },
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
});
const activity: Activity = { id: "mx", title: "Mux", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [v] }] };
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

const pairCells = () => [...document.querySelectorAll("[data-pair]")].map((c) => c.textContent);

describe("truth-table mux-pairs mode in the stage (#308 view)", () => {
  it("one pair of rows per goal: chips named by the data variable; done pairs show their input", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await screen.findByText("Pair 1 of 4: what goes on I0?");
    expect(screen.getByRole("grid", { name: "Truth table, MUX input per pair of rows" })).toHaveAttribute("aria-readonly", "true");
    expect(pairCells()).toEqual(["I0 = ?", "I1", "I2", "I3"]);
    // the active pair's two rows carry the halo marker
    expect(document.querySelectorAll("[data-pair-now]")).toHaveLength(2);
    const chips = () => screen.getByRole("radiogroup", { name: /Data input I\d/ });
    expect(within(chips()).getAllByRole("radio").map((r) => r.parentElement!.textContent)).toEqual(["0", "1", "z", "z′"]);
    const answer = async (name: string) => {
      await user.click(within(chips()).getByRole("radio", { name }));
      await user.click(screen.getByRole("button", { name: "Check input" }));
    };

    await answer("z′"); // rows 0 1 → F follows z, not its complement
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await answer("z");
    await screen.findByText("Pair 2 of 4: what goes on I1?");
    expect(pairCells()).toEqual(["I0 = z", "I1 = ?", "I2", "I3"]);
    // a fresh choice for each pair
    expect(within(chips()).getAllByRole("radio").every((r) => !(r as HTMLInputElement).checked)).toBe(true);

    await answer("z′");
    await answer("0");
    await answer("1");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(pairCells()).toEqual(["I0 = z", "I1 = z′", "I2 = 0", "I3 = 1"]);
    expect(screen.queryByRole("button", { name: "Check input" })).toBeNull();
  });
});
