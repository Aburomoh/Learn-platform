import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calculator } from "./Calculator";
import { CalcError, evaluateExpression, formatResult, normaliseExpression } from "./calc";

describe("calc: content notation and arithmetic", () => {
  it("reads × ÷ − · and superscript powers", () => {
    expect(normaliseExpression("3 × 8² + 2 × 8¹ + 7 × 8⁰")).toBe("3 * 8^2 + 2 * 8^1 + 7 * 8^0");
    expect(evaluateExpression("3 × 8² + 2 × 8¹ + 7 × 8⁰")).toBe(215);
    expect(evaluateExpression("1 × 2⁻¹")).toBe(0.5);
    expect(evaluateExpression("1 × 2^−2")).toBe(0.25);
    expect(evaluateExpression("(26 − 4) ÷ 2 · 3")).toBe(33);
  });

  it("follows precedence: power before product before sum; a leading minus applies to the power", () => {
    expect(evaluateExpression("2 + 3 * 4")).toBe(14);
    expect(evaluateExpression("2 ^ 3 ^ 2")).toBe(512);
    expect(evaluateExpression("-2 ^ 2")).toBe(-4);
    expect(evaluateExpression("(5 + 9 + 13) / 3")).toBeCloseTo(9);
    expect(evaluateExpression("0.5 + 0.125")).toBe(0.625);
  });

  it("rejects anything that is not arithmetic", () => {
    for (const bad of ["2 +", "abc", "2 ** 2", "(2 + 3", "1 / 0", "2 3", ".", "12."]) expect(() => evaluateExpression(bad), bad).toThrow(CalcError);
    expect(() => evaluateExpression("12.")).toThrow("Finish the number after the point");
  });

  it("formats results the way a student writes them", () => {
    expect(formatResult(215)).toBe("215");
    expect(formatResult(16.666666666666668)).toBe("16.66666667");
    expect(formatResult(5.625)).toBe("5.625");
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
  });
});

describe("Calculator component (#579)", () => {
  it("opens pre-loaded with the expression, '=' shows the result and reports it; the result is never typed anywhere", async () => {
    const onResult = vi.fn();
    render(<Calculator expression="3 × 8² + 2 × 8¹" onResult={onResult} />);
    const user = userEvent.setup();
    const details = document.querySelector("details")!;
    expect(details.open).toBe(false);
    await user.click(screen.getByText("Calculator"));
    expect(details.open).toBe(true);
    const field = screen.getByRole("textbox", { name: "Expression" });
    expect(field).toHaveValue("3 × 8² + 2 × 8¹");
    await user.click(screen.getByRole("button", { name: "Equals" }));
    expect(screen.getByText("= 208")).toBeInTheDocument();
    expect(onResult).toHaveBeenCalledWith(208, "208");
  });

  it("a new expression (next step) resets the field and the result (#584 review)", async () => {
    const { rerender } = render(<Calculator expression="2 + 3" open />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Equals" }));
    expect(screen.getByText("= 5")).toBeInTheDocument();
    rerender(<Calculator expression="4 × 5" open />);
    expect(screen.getByRole("textbox", { name: "Expression" })).toHaveValue("4 × 5");
    expect(screen.queryByText("= 5")).toBeNull();
    await user.type(screen.getByRole("textbox", { name: "Expression" }), "{Enter}");
    expect(screen.getByText("= 20")).toBeInTheDocument();
  });

  it("the student may edit the expression; Enter also computes; Reset restores the step's expression; errors are plain", async () => {
    render(<Calculator expression="(5 + 9 + 13) / 3" open />);
    const user = userEvent.setup();
    const field = screen.getByRole("textbox", { name: "Expression" });
    await user.clear(field);
    await user.type(field, "7 +{Enter}");
    expect(screen.getByText("Unfinished expression")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(field).toHaveValue("(5 + 9 + 13) / 3");
    await user.type(field, "{Enter}");
    expect(screen.getByText("= 9")).toBeInTheDocument();
  });
});
