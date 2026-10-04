import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LatchFigure } from "./LatchFigure";
import { NumericContext } from "./contextSpec";

const texts = () => [...screen.getByRole("img").querySelectorAll("text")].map((t) => t.textContent);

describe("LatchFigure (#440)", () => {
  it("prints the given state and keeps the answer back until revealed", () => {
    const { rerender } = render(<LatchFigure id="l" latch="nand-sr" values={{ s: 0, r: 1, q: 0 }} after={{ q: 1, qn: 0 }} />);
    expect(texts()).toEqual(["S = 0", "R = 1", "Q = 0", "Q′"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/^NAND SR latch: .* Given: S = 0, R = 1, Q = 0\.$/);
    // two branch dots only: the crossing has none
    expect(screen.getByRole("img").querySelectorAll("circle[r='3.5']")).toHaveLength(2);

    rerender(<LatchFigure id="l" latch="nand-sr" values={{ s: 0, r: 1, q: 0 }} after={{ q: 1, qn: 0 }} revealed />);
    expect(texts()).toEqual(["S = 0", "R = 1", "Q = 1", "Q′ = 0"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Now Q = 1 and Q′ = 0\.$/);
  });

  it("the gated latch adds the input NANDs and the enable line", () => {
    render(<LatchFigure id="g" latch="gated-sr" values={{ s: 1, r: 0, q: 0, en: 0 }} after={{ q: 0, qn: 1 }} />);
    expect(texts()).toEqual(["S = 1", "En = 0", "R = 0", "Q = 0", "Q′"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/^Gated SR latch/);
    expect(screen.getByRole("img").querySelectorAll("circle[r='3.5']")).toHaveLength(3);
  });

  it("is a context content can name", () => {
    expect(NumericContext.safeParse({ type: "latch", latch: "nand-sr", values: { s: 0, r: 0, q: 1 }, after: { q: 1, qn: 1 } }).success).toBe(true);
    expect(NumericContext.safeParse({ type: "latch", latch: "d", values: { s: 0, r: 0, q: 1 }, after: { q: 1, qn: 1 } }).success).toBe(false);
  });
});
