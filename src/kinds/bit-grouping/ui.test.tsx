import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
// s.22: (10110.11)_2 → (26.6)_8, grouped outward from the point
const withPoint = VariantSchema.parse({ id: "v-pt", prompt: "Convert (10110.11)_2 to octal.", spec: { kind: "bit-grouping", bits: "10110.11", groupSize: 3, answer: "26.6" }, ...base });
// s.21: (246)_8 → binary, one digit at a time
const toBits = VariantSchema.parse({ id: "v-tb", prompt: "Convert (246)_8 to binary.", spec: { kind: "bit-grouping", bits: "10100110", groupSize: 3, answer: "246", direction: "to-bits" }, ...base });

function Harness({ variant }: { variant: typeof withPoint }) {
  const activity: Activity = { id: "bg", title: "Grouping", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
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

describe("bit-grouping view: binary point (#211)", () => {
  it("groups outward from the point: zeros in front of the whole part and after the fraction", async () => {
    render(<Harness variant={withPoint} />);
    const user = userEvent.setup();
    await screen.findByRole("img", { name: "binary point" });
    expect(screen.getByText(/outward from the point/)).toBeInTheDocument();

    // fraction padded on the wrong side is not possible here: zeros go on at the far ends only
    await user.click(screen.getByRole("button", { name: "Add a leading zero" }));
    await user.click(screen.getByRole("button", { name: "Add a trailing zero" }));
    // 010 | 110 . 110 : one cut in the whole part, before its 4th bit
    await user.click(screen.getByRole("button", { name: /Bit 4 of 9: 1\. Start a new group here/ }));
    await user.click(screen.getByRole("button", { name: "Check groups" }));

    // digits: the point sits between the whole and fraction groups
    const digit = async (d: string) => {
      await user.type(await screen.findByRole("textbox"), d);
      await user.click(screen.getByRole("button", { name: "Check digit" }));
    };
    await digit("2");
    expect(screen.getByRole("img", { name: "binary point" })).toBeInTheDocument();
    await digit("6");
    await digit("6");
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/Put the digits side by side/)).toHaveTextContent("(26.6)8");
  });
});

describe("bit-grouping view: digits to bits (#211)", () => {
  it("shows the digit row and asks the bits of one digit at a time; later digits stay empty", async () => {
    render(<Harness variant={toBits} />);
    const user = userEvent.setup();
    const field = () => screen.findByRole("textbox", { name: /its 3 bits/ });
    expect(await field()).toHaveAccessibleName("Digit 1 of 3, 2: its 3 bits");
    expect([...document.querySelectorAll("form strong")].map((e) => e.textContent)).toEqual(["digit 2", "digit 4", "digit 6"]);

    // 2 written without its leading zero: retried in place
    await user.type(await field(), "10");
    await user.click(screen.getByRole("button", { name: "Check bits" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    await user.clear(await field());
    await user.type(await field(), "010x1"); // only 0 and 1 are accepted, three at most
    expect(await field()).toHaveValue("010");
    await user.click(screen.getByRole("button", { name: "Check bits" }));

    expect(await field()).toHaveAccessibleName("Digit 2 of 3, 4: its 3 bits");
    expect(await field()).toHaveFocus();
    await user.type(await field(), "100");
    await user.click(screen.getByRole("button", { name: "Check bits" }));
    await user.type(await field(), "110");
    await user.click(screen.getByRole("button", { name: "Check bits" }));

    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/Put the groups side by side/)).toHaveTextContent("(010100110)2");
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
