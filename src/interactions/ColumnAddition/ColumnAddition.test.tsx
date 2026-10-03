import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnAddition, type AdditionColumn } from "./ColumnAddition";

// 1101 + 0111 = 10100 (the Chapter 1 example), rightmost column first, then the final carry.
const col = (a: 0 | 1, b: 0 | 1, carryIn: 0 | 1, sum: 0 | 1, carryOut: 0 | 1, final = false): AdditionColumn => ({ a, b, carryIn, sum, carryOut, final });
const columns = [col(1, 1, 0, 0, 1), col(0, 1, 1, 0, 1), col(1, 1, 1, 1, 1), col(1, 0, 1, 0, 1), col(0, 0, 1, 1, 0, true)];
const base = { id: "add", a: "1101", b: "0111", columns };
const column = (el: Element | null) => (el?.closest("[style]") as HTMLElement).style.gridColumn;
const row = (el: Element | null) => (el?.closest("[style]") as HTMLElement).style.gridRow;

describe("ColumnAddition", () => {
  it("starts on the rightmost column with no sums or carries shown", () => {
    render(<ColumnAddition {...base} stepIndex={0} onStep={() => {}} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(document.querySelector("[data-focus-target^='add-sum-']")).toBeNull();
    expect(document.querySelector("[data-focus-target^='add-carry-']")).toBeNull();
    const sum = screen.getByLabelText("the first column from the right, 1 + 1: sum bit");
    const carry = screen.getByLabelText("the first column from the right: carry to the next column");
    // sum under the active (rightmost) column, carry above the next column to its left
    expect([row(sum), column(sum)]).toEqual(["5", "6"]);
    expect([row(carry), column(carry)]).toEqual(["1", "5"]);
    expect(document.body).toHaveFocus();
  });

  it("submits sum and carry for one column by keyboard, in the order sum, carry, Check", async () => {
    const onStep = vi.fn();
    render(<ColumnAddition {...base} stepIndex={1} onStep={onStep} />);
    const user = userEvent.setup();
    const sum = screen.getByLabelText("the second column from the right, 0 + 1 + carry 1: sum bit");
    expect(sum).toHaveFocus();
    await user.keyboard("0");
    expect(screen.getByRole("button", { name: "Check step" })).toBeDisabled();
    await user.tab();
    expect(screen.getByLabelText("the second column from the right: carry to the next column")).toHaveFocus();
    await user.keyboard("1{Enter}");
    expect(onStep).toHaveBeenCalledWith(0, 1);
  });

  it("keeps earlier columns and shows the carry that came in, but nothing for later columns", () => {
    render(<ColumnAddition {...base} stepIndex={2} onStep={() => {}} />);
    expect(document.querySelector("[data-focus-target='add-sum-0']")).toHaveTextContent("0");
    expect(document.querySelector("[data-focus-target='add-sum-1']")).toHaveTextContent("0");
    expect(document.querySelector("[data-focus-target='add-carry-2']")).toHaveTextContent("1");
    expect(document.querySelector("[data-focus-target='add-sum-2']")).toBeNull();
    expect(document.querySelector("[data-focus-target='add-carry-3']")).toBeNull();
  });

  it("lets a 2 be typed as a sum so the mistake can be recognised, but only 0 or 1 as a carry", async () => {
    const onStep = vi.fn();
    render(<ColumnAddition {...base} stepIndex={0} onStep={onStep} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/sum bit/), "x25");
    expect(screen.getByLabelText(/sum bit/)).toHaveValue("2");
    await user.type(screen.getByLabelText(/carry to the next column/), "7a0{Enter}");
    expect(onStep).toHaveBeenCalledWith(2, 0);
  });

  it("asks only for the bit to bring down on the final carry step", async () => {
    const onStep = vi.fn();
    render(<ColumnAddition {...base} stepIndex={4} onStep={onStep} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    const last = screen.getByLabelText("Final carry: bit to bring down");
    expect(column(last)).toBe("2");
    await userEvent.setup().keyboard("1{Enter}");
    expect(onStep).toHaveBeenCalledWith(1, undefined);
  });

  it("when done shows the full result including the extra leftmost bit", () => {
    render(<ColumnAddition {...base} stepIndex={5} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector("[data-focus-target='add-result']")).toHaveTextContent("1101 + 0111 = 10100");
    expect(document.querySelector("[data-focus-target='add-sum-4']")).toHaveTextContent("1");
  });

  it("is read-only without onStep (explanation mode)", () => {
    render(<ColumnAddition {...base} stepIndex={1} attention={1} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByText("?")).toHaveLength(1);
  });
});
