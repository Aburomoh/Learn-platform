import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

type Bit = 0 | 1;
const perEdge = (values: Bit[]): Bit[] => values.flatMap((v) => [v, v]);
const base = {
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
// s.17–20: SR, rising, Q starts at 0 → Q = 0 1 0 (first three edges)
const sr = VariantSchema.parse({
  id: "v-sr",
  prompt: "Positive-edge triggered SR flip-flop. Give Q after each rising edge.",
  spec: { kind: "timing", flipFlop: "SR", edge: "rising", initialQ: 0, edgeCount: 3, inputs: [{ name: "S", levels: perEdge([0, 1, 0, 1, 1]) }, { name: "R", levels: perEdge([0, 0, 1, 0, 0]) }] },
  ...base,
});
// two flip-flops asked together at each edge (#316): A(t+1) = x, B(t+1) = A
const machine = VariantSchema.parse({
  id: "v-m",
  prompt: "Give A and B after each rising edge.",
  spec: { kind: "timing", edge: "rising", edgeCount: 2, inputs: [{ name: "x", levels: perEdge([1, 0, 1]) }], machine: { stateVars: ["A", "B"], next: ["x", "A"], initial: [0, 0] } },
  ...base,
});

function Harness({ variant }: { variant: typeof sr }) {
  const activity: Activity = { id: "t", title: "Timing", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
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

const drawn = (name: string) => Number(document.querySelector(`[data-output='${name}']`)!.getAttribute("data-drawn"));
const pick = async (user: ReturnType<typeof userEvent.setup>, group: RegExp, bit: Bit) => user.click(within(group).getByRole("radio", { name: String(bit) }));
const within = (group: RegExp) => ({ getByRole: (role: string, o: { name: string }) => screen.getByRole("radiogroup", { name: group }).querySelector<HTMLInputElement>(`input[value='${o.name}']`)! }) as const;

describe("timing kind in the stage (#237 view)", () => {
  it("one edge per goal: a right answer draws Q to the next edge, a wrong one draws nothing", async () => {
    render(<Harness variant={sr} />);
    const user = userEvent.setup();
    await screen.findByText("Edge 1 of 3 (rising)");
    expect(screen.getByRole("img", { name: /rising-edge triggered.*Q starts at 0.*0 of 3 edges answered/ })).toBeInTheDocument();
    // Q is drawn only up to edge 1 (column 1); the edge has the halo
    expect(drawn("Q")).toBe(1);
    expect(document.querySelector("[data-active-edge]")).toHaveAttribute("data-active-edge", "1");
    const check = screen.getByRole("button", { name: "Check edge" });
    expect(check).toBeDisabled();

    await pick(user, /Q after edge 1/, 0);
    await user.click(check);
    await screen.findByText("Edge 2 of 3 (rising)");
    expect(drawn("Q")).toBe(3);

    await pick(user, /Q after edge 2/, 0); // S = 1, R = 0 sets Q: 0 is wrong
    await user.click(screen.getByRole("button", { name: "Check edge" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(drawn("Q")).toBe(3);
    expect(screen.getByRole("radiogroup", { name: /Q after edge 2/ })).toHaveAttribute("aria-invalid", "true");
    await pick(user, /Q after edge 2/, 1);
    await user.click(screen.getByRole("button", { name: "Check edge" }));

    await pick(user, /Q after edge 3/, 0);
    await user.click(screen.getByRole("button", { name: "Check edge" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(drawn("Q")).toBe(10); // the whole trace
    expect(screen.queryByRole("button", { name: "Check edge" })).toBeNull();
  });

  it("several flip-flops: one labelled control per output, one Check; only the first wrong one is marked", async () => {
    render(<Harness variant={machine} />);
    const user = userEvent.setup();
    await screen.findByText("Edge 1 of 2 (rising)");
    expect(screen.getAllByRole("radiogroup").map((g) => g.getAttribute("aria-label"))).toEqual(["A after edge 1", "B after edge 1"]);
    await pick(user, /A after edge 1/, 0);
    await pick(user, /B after edge 1/, 1);
    await user.click(screen.getByRole("button", { name: "Check edge" })); // right is A = 1, B = 0
    expect(screen.getAllByRole("radiogroup").filter((g) => g.getAttribute("aria-invalid") === "true").map((g) => g.getAttribute("aria-label"))).toEqual(["A after edge 1"]);
  });
});
