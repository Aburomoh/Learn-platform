import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import type { Activity } from "@/content/schema";
import { complement100101 } from "@/content/fixtures/onesComplement";
import { createRunnerReducer, initialRunnerState, currentVariant } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";
import { BitRow } from "./BitRow";

const column = (el: Element | null) => (el?.closest("[style]") as HTMLElement).style.gridColumn;

describe("BitRow", () => {
  it("puts one answer cell under each source bit, in the same grid column", () => {
    render(<BitRow id="r" bits="100101" onAnswer={() => {}} />);
    const cells = screen.getAllByRole("textbox");
    expect(cells).toHaveLength(6);
    cells.forEach((cell, i) => {
      expect(column(cell)).toBe(String(i + 1));
      expect(column(document.querySelector(`[data-focus-target='bit-source-${i}']`))).toBe(String(i + 1));
    });
    expect(screen.getByLabelText("Bit 3 of 6, under 0")).toBe(cells[2]);
  });

  it("types across the row: one bit per cell, auto-advance, arrows and Backspace, Enter to check", async () => {
    const onAnswer = vi.fn();
    render(<BitRow id="r" bits="1001" onAnswer={onAnswer} />);
    const user = userEvent.setup();
    const cells = screen.getAllByRole("textbox");
    cells[0].focus();
    await user.keyboard("0x1");
    expect(cells[2]).toHaveFocus();
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    await user.keyboard("{ArrowLeft}{ArrowRight}1{Backspace}");
    // Backspace in an empty cell clears the cell before it and goes back there
    expect(cells[2]).toHaveValue("");
    expect(cells[2]).toHaveFocus();
    await user.keyboard("10{Enter}");
    expect(onAnswer).toHaveBeenCalledWith("0110");
  });

  it("retyping over a filled row replaces every cell, also where the digit is the same (#151)", async () => {
    const onAnswer = vi.fn();
    render(<BitRow id="r" bits="010101" onAnswer={onAnswer} />);
    const user = userEvent.setup();
    const cells = screen.getAllByRole("textbox");
    const row = () => cells.map((c) => (c as HTMLInputElement).value).join("");
    cells[0].focus();
    await user.keyboard("101010");
    expect(row()).toBe("101010");
    // QA's cases: same digits in most places, then a mixed overwrite
    cells[0].focus();
    await user.keyboard("101011");
    expect(row()).toBe("101011");
    cells[0].focus();
    await user.keyboard("011110");
    expect(row()).toBe("011110");
    expect(cells[5]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onAnswer).toHaveBeenCalledWith("011110");
  });

  it("points at the first wrong cell and keeps what was typed", () => {
    const { rerender } = render(<BitRow id="r" bits="1001" onAnswer={() => {}} />);
    rerender(<BitRow id="r" bits="1001" onAnswer={() => {}} state="incorrect" wrongBit={2} />);
    const cells = screen.getAllByRole("textbox");
    expect(cells[2]).toHaveAttribute("aria-invalid", "true");
    expect(cells[2]).toHaveFocus();
    expect(cells.filter((c) => c.getAttribute("aria-invalid"))).toHaveLength(1);
  });

  it("is read-only for explanations and reveals the answer cell by cell", () => {
    render(<BitRow id="r" bits="1001" answer="0110" revealed={2} attention={2} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(["0", "1", "2", "3"].map((i) => document.querySelector(`[data-focus-target='bit-cell-${i}']`)!.textContent)).toEqual(["0", "1", "?", "?"]);
  });

  it("can show the source row alone", () => {
    render(<BitRow id="r" bits="1001" sourceOnly />);
    expect(document.querySelector("[data-focus-target='bit-cell-0']")).toBeNull();
    expect(document.querySelector("[data-focus-target='bit-source-3']")).toHaveTextContent("1");
  });
});

// The 1's complement fixture (100101 → 011010) through the real runner and stage view.
const activity: Activity = { id: "c", title: "", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [complement100101] }] };
const reducer = createRunnerReducer(activity);

function Harness() {
  const [state, dispatch] = useReducer(reducer, activity, initialRunnerState);
  const variant = currentVariant(activity, state);
  const stage = state.tutor.stage;
  return (
    <>
      <QuestionView
        key={`${variant.id}-${state.interactionKey}`}
        variant={variant}
        last={state.last}
        stepIndex={state.stepIndex}
        locked={stage === "complete" || stage === "explaining"}
        explanation={state.explanation}
        onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })}
        onPredict={() => {}}
        onContinue={() => {}}
      />
      <output data-testid="stage">{stage}</output>
      <output data-testid="message">{state.message}</output>
    </>
  );
}

describe("stage: 1's complement in a bit row", () => {
  it("a wrong row highlights the first wrong bit, keeps the other cells, and is fixed in place", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    const cells = screen.getAllByRole("textbox");
    cells[0].focus();
    await user.keyboard("010010{Enter}"); // bit 3 should be 1
    expect(screen.getByTestId("message")).toHaveTextContent("Look at bit 3 from the left.");
    expect(cells[2]).toHaveAttribute("aria-invalid", "true");
    expect(cells[2]).toHaveFocus();
    expect(cells.map((c) => (c as HTMLInputElement).value).join("")).toBe("010010");
    await user.keyboard("1");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByTestId("stage")).toHaveTextContent("complete");
    expect(screen.getAllByRole("textbox").every((c) => (c as HTMLInputElement).disabled)).toBe(true);
  });
});
