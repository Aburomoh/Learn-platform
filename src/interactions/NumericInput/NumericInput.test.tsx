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

  it("is unsigned and whole by default", async () => {
    render(<NumericInput id="n" prompt="Dec?" base={10} onAnswer={() => {}} />);
    const input = screen.getByLabelText("Dec?");
    await userEvent.setup().type(input, "-1.5");
    expect(input).toHaveValue("15");
  });

  it("signed: one leading minus only, and a typed U+2212 becomes a minus", async () => {
    render(<NumericInput id="n" prompt="Reg?" base={10} signed onAnswer={() => {}} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Reg?");
    await user.type(input, "\u22128-192-");
    expect(input).toHaveValue("-8192");
    expect(input).toHaveAttribute("inputmode", "text");
  });

  it("decimals: one point and at most n places", async () => {
    render(<NumericInput id="n" prompt="Avg?" base={10} decimals={2} onAnswer={() => {}} />);
    const input = screen.getByLabelText("Avg?");
    await userEvent.setup().type(input, "16.6.678");
    expect(input).toHaveValue("16.66");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("ignores signed and decimals outside base 10", async () => {
    render(<NumericInput id="n" prompt="Bin?" base={2} signed decimals={2} onAnswer={() => {}} />);
    const input = screen.getByLabelText("Bin?");
    await userEvent.setup().type(input, "-1.01");
    expect(input).toHaveValue("101");
  });
});
