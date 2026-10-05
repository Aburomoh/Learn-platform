import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";
import { FigureSpec } from "./figureSpec";
import { FigureView } from "./FigureView";

const figure = (f: object) => FigureSpec.parse(f);
const lit = () => [...document.querySelectorAll("[data-on]")].map((g) => g.getAttribute("data-line"));

describe("FigureSpec (ADR-0009)", () => {
  it("accepts a device or a latch and checks what is given", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok({ type: "device", device: "decoder", bits: 3, given: 5 })).toBe(true);
    expect(ok({ type: "device", device: "decoder", bits: 3, given: 8 })).toBe(false);
    expect(ok({ type: "device", device: "decoder", bits: 1, given: 0 })).toBe(false);
    expect(ok({ type: "device", device: "mux", bits: 2, given: 2, data: [0, 1, 1, 0] })).toBe(true);
    expect(ok({ type: "device", device: "encoder", bits: 2, given: 2, data: [0, 1, 1, 0] })).toBe(false);
    expect(ok({ type: "latch", latch: "gated-sr", values: { s: 1, r: 0, q: 0 } })).toBe(false);
    // a result is never authored: there is no field for it
    expect(FigureSpec.parse({ type: "device", device: "decoder", bits: 2, given: 1, answer: 1 })).not.toHaveProperty("answer");
  });
});

describe("FigureView", () => {
  it("decoder: the code is on the pins; the active output is computed and drawn only in the result state", async () => {
    const f = figure({ type: "device", device: "decoder", bits: 3, given: 5 });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    expect(await screen.findByRole("img")).toHaveAccessibleName("3 to 8 DEC. Given: x = 1, y = 0, z = 1.");
    expect(lit()).toEqual([]);
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img")).toHaveAccessibleName("3 to 8 DEC. Given: x = 1, y = 0, z = 1. Answer: D5.");
    expect(lit()).toEqual(["D5"]);
  });

  it("mux: the focus halo sits on one named pin, from the figure or the Explain stage", async () => {
    const f = figure({ type: "device", device: "mux", bits: 2, given: 2, focus: "S1" });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    await screen.findByRole("img");
    const focused = () => [...document.querySelectorAll("[data-focus]")].map((g) => g.getAttribute("data-line"));
    expect(focused()).toEqual(["S1"]);
    rerender(<FigureView id="f" figure={f} focus="I2" />);
    expect(focused()).toEqual(["I2"]);
    expect(lit()).toEqual([]);
  });

  it("latch: the same figure as the latch context", async () => {
    render(<FigureView id="f" figure={figure({ type: "latch", latch: "nand-sr", values: { s: 0, r: 1, q: 0 } })} />);
    expect(await screen.findByRole("img")).toHaveAccessibleName(/^NAND SR latch/);
  });
});

// A truth-table question (a kind with no drawing of its own) that shows the decoder it is about.
const variant = VariantSchema.parse({
  id: "v-dec",
  prompt: "Fill D1 for the 2-to-4 decoder.",
  figure: { type: "device", device: "decoder", bits: 2, given: 1, names: ["x", "y"] },
  spec: { kind: "truth-table", inputs: ["x", "y"], columns: [{ id: "d1", label: "D1", expr: "x'y" }] },
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One.", stage: { figureFocus: "y" } },
    { id: "s2", say: "Two." },
  ],
});
const activity: Activity = { id: "fg", title: "Figure", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
const reducer = createRunnerReducer(activity);

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, (a) => reducer(initialRunnerState(a), { type: "OPEN" }));
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

describe("a figure on a question of any kind (ADR-0009)", () => {
  it("is drawn before the answer area and lights its result only after a correct answer", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    const img = await screen.findByRole("img", { name: /2 to 4 DEC/ });
    const grid = await screen.findByRole("grid");
    expect(img.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lit()).toEqual([]);

    const cells = () => screen.getAllByRole("gridcell").filter((c) => c.hasAttribute("tabindex"));
    // wrong first: still nothing lit
    for (const c of cells()) await user.click(c);
    await user.click(screen.getByRole("button", { name: "Check column" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(lit()).toEqual([]);
    // D1 = 0 1 0 0
    cells()[1].focus();
    await user.keyboard("1");
    cells()[0].focus();
    await user.keyboard("0100");
    await user.click(screen.getByRole("button", { name: "Check column" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(lit()).toEqual(["D1"]);
  });

  it("Explain Slowly: the stage moves the focus; the last stage shows the result", async () => {
    const props = { variant, last: undefined, stepIndex: 0, locked: false, onSubmit: () => {}, onPredict: () => {}, onContinue: () => {} };
    const { rerender } = render(<QuestionView {...props} explanation={{ step: 0 }} />);
    await screen.findByRole("img", { name: /2 to 4 DEC/ });
    expect(document.querySelector("[data-focus]")).toHaveAttribute("data-line", "y");
    expect(lit()).toEqual([]);
    rerender(<QuestionView {...props} explanation={{ step: 1 }} />);
    expect(lit()).toEqual(["D1"]);
  });
});
