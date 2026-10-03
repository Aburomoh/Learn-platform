import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DivisionChain } from "./DivisionChain";

const steps = [
  { dividend: 26, quotient: 13, remainder: 0 as const },
  { dividend: 13, quotient: 6, remainder: 1 as const },
  { dividend: 6, quotient: 3, remainder: 0 as const },
  { dividend: 3, quotient: 1, remainder: 1 as const },
  { dividend: 1, quotient: 0, remainder: 1 as const },
];

describe("DivisionChain", () => {
  it("shows only the first number at the start and does not reveal the chain length", () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={0} onStep={() => {}} />);
    expect(screen.getByText("26")).toBeInTheDocument();
    expect(screen.queryByText("13")).toBeNull();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("submits one step with quotient and remainder, by keyboard", async () => {
    const onStep = vi.fn();
    render(<DivisionChain id="d" steps={steps} stepIndex={0} onStep={onStep} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("26 divided by 2: result"), "13");
    expect(screen.getByRole("button", { name: "Check step" })).toBeDisabled();
    await user.type(screen.getByLabelText("26 divided by 2: remainder"), "0{Enter}");
    expect(onStep).toHaveBeenCalledWith(13, 0);
  });

  it("accepts digits only and a single remainder digit", async () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={0} onStep={() => {}} />);
    const user = userEvent.setup();
    const r = screen.getByLabelText("26 divided by 2: remainder");
    await user.type(r, "a12");
    expect(r).toHaveValue("1");
  });

  it("shows completed rows and the active one mid-chain", () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={2} onStep={() => {}} />);
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByLabelText("6 divided by 2: result")).toBeInTheDocument();
    expect(document.querySelector("[data-focus-target='div-active']")).toHaveTextContent("6");
  });

  it("when done shows the final 0 and, on request, LSB / MSB labels", () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={5} showOrder />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByText(/LSB/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MSB/).length).toBeGreaterThan(0);
    expect(document.querySelector("[data-focus-target='div-zero']")).toHaveTextContent("0");
  });

  it("is read-only without onStep (explanation mode)", () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={1} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByText("?").length).toBe(2);
  });

  it("lays the chain out as a vertical ladder: numbers down, remainder beside, result in the next row", () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={2} onStep={() => {}} />);
    const row = (el: Element | null) => (el?.closest("[style]") as HTMLElement).style.gridRow;
    const col = (el: Element | null) => (el?.closest("[style]") as HTMLElement).style.gridColumn;
    expect(row(screen.getByText("26"))).toBe("1 / span 1");
    expect(row(screen.getByText("13"))).toBe("2 / span 1");
    expect(row(document.querySelector("[data-focus-target='div-active']"))).toBe("3 / span 1");
    const result = screen.getByLabelText("6 divided by 2: result");
    const remainder = screen.getByLabelText("6 divided by 2: remainder");
    expect([row(result), col(result)]).toEqual(["4 / span 1", "2"]);
    expect([row(remainder), col(remainder)]).toEqual(["3 / span 1", "3"]);
  });

  it("moves focus to the new step's result and keeps the order result, remainder, Check", async () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={1} onStep={() => {}} />);
    const user = userEvent.setup();
    expect(screen.getByLabelText("13 divided by 2: result")).toHaveFocus();
    await user.keyboard("6");
    await user.tab();
    expect(screen.getByLabelText("13 divided by 2: remainder")).toHaveFocus();
    await user.keyboard("1");
    await user.tab();
    expect(screen.getByRole("button", { name: "Check step" })).toHaveFocus();
  });

  it("does not take focus on the first step", () => {
    render(<DivisionChain id="d" steps={steps} stepIndex={0} onStep={() => {}} />);
    expect(document.body).toHaveFocus();
  });
});
