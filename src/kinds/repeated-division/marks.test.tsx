import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getActivity } from "@/content";
import { DivisionChain } from "@/interactions/DivisionChain/DivisionChain";
import { Practice, wrongFieldOf } from "./ui";

// #723 (Auditor): the mark sits on the cell that is wrong, never on one the tutor says is right.
const ref = getActivity("ecet111", "number-systems", "decimal-to-binary")!;
const variant = ref.activity.questions[0].variants[0] as Parameters<typeof Practice>[0]["variant"];
const step0 = variant.spec.steps[0];
const wrongCells = () => [...document.querySelectorAll("input")].filter((i) => /wrong/.test(i.className)).map((i) => i.labels?.[0]?.textContent?.trim());

describe("division chain marks (#723)", () => {
  it("names the wrong cell from the grader's mistake, both for a swap or an unknown mistake", () => {
    expect(wrongFieldOf("div.remainder")).toBe("remainder");
    expect(wrongFieldOf("div.quotient")).toBe("quotient");
    expect(wrongFieldOf("div.swapped")).toBe("both");
    expect(wrongFieldOf(undefined)).toBe("both");
  });

  it("DivisionChain marks only the named cell; both by default", () => {
    const { rerender } = render(<DivisionChain id="d" steps={variant.spec.steps} stepIndex={0} onStep={() => {}} state="incorrect" wrongField="remainder" />);
    expect(wrongCells()).toEqual([`${step0.dividend} divided by 2: remainder`]);
    rerender(<DivisionChain id="d" steps={variant.spec.steps} stepIndex={0} onStep={() => {}} state="incorrect" wrongField="quotient" />);
    expect(wrongCells()).toEqual([`${step0.dividend} divided by 2: result`]);
    rerender(<DivisionChain id="d" steps={variant.spec.steps} stepIndex={0} onStep={() => {}} state="incorrect" />);
    expect(wrongCells()).toHaveLength(2);
    rerender(<DivisionChain id="d" steps={variant.spec.steps} stepIndex={0} onStep={() => {}} state="idle" />);
    expect(wrongCells()).toHaveLength(0);
  });

  it("the kind view: a wrong remainder with the right result marks the remainder only; a swap marks both", () => {
    const answer = { kind: "repeated-division" as const, step: 0, quotient: step0.quotient, remainder: step0.remainder === 0 ? 1 : 0 };
    const last = { answer, result: { correct: false, normalized: "", misconceptionId: "div.remainder" } };
    const { rerender } = render(<Practice variant={variant} prompt="p" state="incorrect" last={last} stepIndex={0} locked={false} onSubmit={() => {}} />);
    expect(wrongCells()).toEqual([`${step0.dividend} divided by 2: remainder`]);
    expect(screen.getByLabelText(`${step0.dividend} divided by 2: result`)).not.toHaveClass(/wrong/);
    rerender(<Practice variant={variant} prompt="p" state="incorrect" last={{ ...last, result: { ...last.result, misconceptionId: "div.swapped" } }} stepIndex={0} locked={false} onSubmit={() => {}} />);
    expect(wrongCells()).toHaveLength(2);
  });
});
