import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PredictionBeforeReveal } from "./PredictionBeforeReveal";

describe("PredictionBeforeReveal", () => {
  it("hides the reveal until a prediction is committed", async () => {
    const onPredict = vi.fn();
    const { rerender } = render(
      <PredictionBeforeReveal id="p" prompt="Does 32 fit in 45?" options={["Yes", "No"]} onPredict={onPredict} />,
    );
    expect(screen.queryByRole("status")).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "Yes" }));
    expect(onPredict).toHaveBeenCalledWith(0);
    rerender(
      <PredictionBeforeReveal id="p" prompt="Does 32 fit in 45?" options={["Yes", "No"]} onPredict={onPredict}
        result={{ chosenIndex: 0, correct: true, reveal: "Yes. 13 remains." }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("13 remains");
    expect(screen.getByRole("button", { name: "Yes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
  });
});
