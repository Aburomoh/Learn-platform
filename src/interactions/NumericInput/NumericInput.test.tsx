import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumericInput } from "./NumericInput";

describe("NumericInput", () => {
  it("accepts only characters of the base and upper-cases hex", async () => {
    render(<NumericInput id="n" prompt="Hex?" base={16} onAnswer={() => {}} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Hex?");
    await user.type(input, "2dz!");
    expect(input).toHaveValue("2D");
  });

  it("rejects non-binary digits for base 2", async () => {
    render(<NumericInput id="n" prompt="Binary?" base={2} onAnswer={() => {}} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Binary?");
    await user.type(input, "1021");
    expect(input).toHaveValue("101");
  });

  it("submits on Enter and on Check", async () => {
    const onAnswer = vi.fn();
    render(<NumericInput id="n" prompt="Hex?" base={16} onAnswer={onAnswer} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Hex?"), "2D{Enter}");
    expect(onAnswer).toHaveBeenCalledWith("2D");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(onAnswer).toHaveBeenCalledTimes(2);
  });

  it("marks incorrect state for assistive tech", () => {
    render(<NumericInput id="n" prompt="Hex?" base={16} onAnswer={() => {}} state="incorrect" submittedText="45" />);
    expect(screen.getByLabelText("Hex?")).toHaveAttribute("aria-invalid", "true");
  });
});
