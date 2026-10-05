import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LatchFigure } from "./LatchFigure";
import { NumericContext } from "../contextSpec";
import { latchAfter } from "./latch";

const texts = () => [...screen.getByRole("img").querySelectorAll("text")].map((t) => t.textContent);

describe("LatchFigure (#440)", () => {
  it("prints the given state and keeps the answer back until revealed", () => {
    const { rerender } = render(<LatchFigure id="l" latch="nand-sr" values={{ s: 0, r: 1, q: 0 }} />);
    expect(texts()).toEqual(["S = 0", "R = 1", "Q = 0", "Q′"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/^NAND SR latch: .* Given: S = 0, R = 1, Q = 0\.$/);
    // two branch dots only: the crossing has none
    expect(screen.getByRole("img").querySelectorAll("circle[r='3.5']")).toHaveLength(2);

    rerender(<LatchFigure id="l" latch="nand-sr" values={{ s: 0, r: 1, q: 0 }} revealed />);
    expect(texts()).toEqual(["S = 0", "R = 1", "Q = 1", "Q′ = 0"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Now Q = 1 and Q′ = 0\.$/);
  });

  it("the gated latch adds the input NANDs and the enable line", () => {
    render(<LatchFigure id="g" latch="gated-sr" values={{ s: 1, r: 0, q: 0, en: 0 }} />);
    expect(texts()).toEqual(["S = 1", "En = 0", "R = 0", "Q = 0", "Q′"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/^Gated SR latch/);
    expect(screen.getByRole("img").querySelectorAll("circle[r='3.5']")).toHaveLength(3);
  });

  it("is a context content can name; en goes with the gated latch only", () => {
    const ctx = (latch: string, values: object) => NumericContext.safeParse({ type: "latch", latch, values }).success;
    expect(ctx("nand-sr", { s: 0, r: 0, q: 1 })).toBe(true);
    expect(ctx("gated-sr", { s: 0, r: 0, q: 1, en: 1 })).toBe(true);
    expect(ctx("gated-sr", { s: 0, r: 0, q: 1 })).toBe(false);
    expect(ctx("nand-sr", { s: 0, r: 0, q: 1, en: 1 })).toBe(false);
    expect(ctx("d", { s: 0, r: 0, q: 1 })).toBe(false);
  });
});

describe("latchAfter", () => {
  it("NAND SR: a 0 acts; 0 0 forces both outputs to 1; 1 1 holds", () => {
    expect(latchAfter("nand-sr", { s: 0, r: 1, q: 0 })).toEqual({ q: 1, qn: 0 });
    expect(latchAfter("nand-sr", { s: 1, r: 0, q: 1 })).toEqual({ q: 0, qn: 1 });
    expect(latchAfter("nand-sr", { s: 1, r: 1, q: 1 })).toEqual({ q: 1, qn: 0 });
    expect(latchAfter("nand-sr", { s: 0, r: 0, q: 0 })).toEqual({ q: 1, qn: 1 });
  });

  it("gated SR: En = 0 holds; En = 1 sets on S, resets on R, 1 1 is invalid", () => {
    expect(latchAfter("gated-sr", { en: 0, s: 1, r: 0, q: 0 })).toEqual({ q: 0, qn: 1 });
    expect(latchAfter("gated-sr", { en: 1, s: 1, r: 0, q: 0 })).toEqual({ q: 1, qn: 0 });
    expect(latchAfter("gated-sr", { en: 1, s: 0, r: 1, q: 1 })).toEqual({ q: 0, qn: 1 });
    expect(latchAfter("gated-sr", { en: 1, s: 0, r: 0, q: 1 })).toEqual({ q: 1, qn: 0 });
    expect(latchAfter("gated-sr", { en: 1, s: 1, r: 1, q: 0 })).toEqual({ q: 1, qn: 1 });
  });
});
