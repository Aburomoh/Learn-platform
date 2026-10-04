import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

const base = {
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
const decoder = VariantSchema.parse({ id: "v-dec", prompt: "3-to-8 decoder: which output is active?", spec: { kind: "device", device: "decoder", bits: 3, asks: [5, 2] }, ...base });
const mux = VariantSchema.parse({ id: "v-mux", prompt: "4-to-1 multiplexer: which input reaches Y?", spec: { kind: "device", device: "mux", bits: 2, asks: [2] }, ...base });
const encoder = VariantSchema.parse({ id: "v-enc", prompt: "8-to-3 encoder: what is the output code?", spec: { kind: "device", device: "encoder", bits: 3, asks: [6] }, ...base });

function Harness({ variant }: { variant: typeof decoder }) {
  const activity: Activity = { id: "dv", title: "Device", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
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

const lit = () => [...document.querySelectorAll("[data-on]")].map((g) => g.getAttribute("data-line"));
const answer = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole("radio", { name }));
  await user.click(screen.getByRole("button", { name: "Check" }));
};

describe("device kind in the stage (#381, #382)", () => {
  it("decoder: the code is printed on the inputs; the output is picked from D0…D7; one ask per goal", async () => {
    render(<Harness variant={decoder} />);
    const user = userEvent.setup();
    await screen.findByText("1 of 2: x = 1, y = 0, z = 1, which output is 1?");
    expect(screen.getByRole("img", { name: "3 to 8 DEC. Given: x = 1, y = 0, z = 1." })).toBeInTheDocument();
    expect(within(screen.getByRole("radiogroup", { name: "Which output is 1?" })).getAllByRole("radio")).toHaveLength(8);
    expect(lit()).toEqual([]); // nothing is drawn before the answer

    await answer(user, "D6"); // counted from one
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await answer(user, "D5");
    await screen.findByText("2 of 2: x = 0, y = 1, z = 0, which output is 1?");
    await answer(user, "D2");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    // finished: the last ask's line is drawn with its value
    expect(lit()).toEqual(["D2"]);
    expect(screen.getByRole("img", { name: /Answer: D2\./ })).toBeInTheDocument();
  });

  it("mux: the selects are printed under the body; the routed input is drawn to Y", async () => {
    render(<Harness variant={mux} />);
    const user = userEvent.setup();
    await screen.findByText("1 of 1: S1 = 1, S0 = 0, which input reaches Y?");
    // tapping a line picks it, the same as its chip
    await user.click(document.querySelector("[data-line='I2']")!);
    expect(screen.getByRole("radio", { name: "I2" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(document.querySelector("[data-path]")).toHaveAttribute("data-path", "I2");
    expect(lit()).toEqual(["I2", "Y"]);
  });

  it("encoder: the active input is marked; the code is picked from the chips", async () => {
    render(<Harness variant={encoder} />);
    const user = userEvent.setup();
    await screen.findByText("1 of 1: I6 is active, what is the output code?");
    expect(lit()).toEqual(["I6"]);
    await answer(user, "011"); // bits reversed
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await answer(user, "110");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(lit()).toEqual(["I6", "x", "y"]);
  });
});
