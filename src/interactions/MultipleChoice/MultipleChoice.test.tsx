import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultipleChoice } from "./MultipleChoice";

const options = [
  { id: "and", text: "AND" },
  { id: "or", text: "OR" },
];

describe("MultipleChoice", () => {
  it("submits only on explicit Check, not on selection", async () => {
    const onAnswer = vi.fn();
    render(<MultipleChoice id="q" prompt="Which gate?" options={options} onAnswer={onAnswer} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("OR"));
    expect(onAnswer).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(onAnswer).toHaveBeenCalledWith("or");
  });

  it("is keyboard operable: arrows move, Enter submits", async () => {
    const onAnswer = vi.fn();
    render(<MultipleChoice id="q" prompt="Which gate?" options={options} onAnswer={onAnswer} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByLabelText("AND")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByLabelText("OR")).toBeChecked();
    await user.keyboard("{Enter}");
    expect(onAnswer).toHaveBeenCalledWith("or");
  });

  it("disables Check until a choice is made and when disabled", () => {
    render(<MultipleChoice id="q" prompt="?" options={options} onAnswer={() => {}} />);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  it("marks the submitted option by state", () => {
    render(<MultipleChoice id="q" prompt="?" options={options} onAnswer={() => {}} submittedOptionId="or" state="incorrect" />);
    expect(screen.getByRole("radio", { name: /^OR/ }).closest("label")).toHaveClass("incorrect");
  });
});
