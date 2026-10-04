import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";

// The pack's F2 (ch2 §10), one law per line, through the stage: registry, steps, grader, lazy view.
const variant = (lineMode: "choose" | "type") =>
  VariantSchema.parse({
    id: `v-${lineMode}`,
    prompt: "Simplify x'y'z + x'yz + xy', one law per line.",
    spec: {
      kind: "derivation",
      vars: ["x", "y", "z"],
      start: "x'y'z + x'yz + xy'",
      lineMode,
      lines: [
        { law: "distributive", expr: "x'z(y' + y) + xy'", lawOptions: ["distributive", "commutative", "absorb"], wrongLines: [{ id: "w1", expr: "x'(y'z + yz) + xy'" }] },
        { law: "or-not", expr: "x'z·1 + xy'", lawOptions: ["or-not", "and-not", "or-1"], wrongLines: [{ id: "w1", expr: "x'z·0 + xy'" }] },
      ],
    },
    hints: [{ rung: 2, text: "Not yet." }],
    explanation: [
      { id: "s1", say: "One." },
      { id: "s2", say: "Two." },
    ],
  });

function Harness({ lineMode }: { lineMode: "choose" | "type" }) {
  const activity: Activity = { id: "dv", title: "Derivation", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant(lineMode)] }] };
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

const lines = () => within(screen.getByRole("list", { name: "Derivation" })).getAllByRole("listitem");

describe("derivation kind in the stage (#221)", () => {
  it("each line is two goals: the law, then the line; later lines stay hidden", async () => {
    render(<Harness lineMode="choose" />);
    const user = userEvent.setup();
    await screen.findByRole("list", { name: "Derivation" });
    expect(lines().map((l) => l.textContent)).toEqual(["1x'y'z + x'yz + xy'Given", "2next line (to find)Law: ?", "3…"]);
    expect(lines()[1]).toHaveAttribute("aria-current", "step");

    // goal 1: the law (a wrong law is retried in place)
    await user.click(screen.getByRole("radio", { name: "Commutative" }));
    await user.click(screen.getByRole("button", { name: "Check law" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Distributive/ }));
    await user.click(screen.getByRole("button", { name: "Check law" }));
    // goal 2: the line it gives; the law now shows on the line
    expect(await screen.findByRole("button", { name: "Check line" })).toBeInTheDocument();
    expect(lines()[1]).toHaveTextContent(/Distributive/);
    await user.click(screen.getByRole("radio", { name: "x'z(y' + y) + xy'" }));
    await user.click(screen.getByRole("button", { name: "Check line" }));
    expect(await screen.findByRole("button", { name: "Check law" })).toBeInTheDocument();
    expect(lines()[1]).toHaveTextContent("x'z(y' + y) + xy'");
    expect(lines()[2]).toHaveAttribute("aria-current", "step");
  });

  it("type mode takes the line as text, in any term order", async () => {
    render(<Harness lineMode="type" />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("radio", { name: /Distributive/ }));
    await user.click(screen.getByRole("button", { name: "Check law" }));
    await user.type(await screen.findByRole("textbox", { name: /Line 2/ }), "xy' + x'z(y + y')");
    await user.click(screen.getByRole("button", { name: "Check line" }));
    expect(await screen.findByRole("button", { name: "Check law" })).toBeInTheDocument();
    expect(lines()[1]).toHaveTextContent("x'z(y' + y) + xy'");
  });
});
