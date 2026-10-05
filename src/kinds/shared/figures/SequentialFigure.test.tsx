import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";
import { SequentialFigure } from "./SequentialFigure";

const two = [
  { name: "A", ff: "d" as const, equations: ["DA = Ax + Bx"] },
  { name: "B", ff: "d" as const, equations: ["DB = A′x"] },
];

describe("SequentialFigure (#454, step 6)", () => {
  it("draws the gate block with its equations, one symbol and one feedback per flip-flop, and the clock", () => {
    render(<SequentialFigure flipFlops={two} input="x" focus="B" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAccessibleName("Sequential circuit. A gate block with the input equations DA = Ax + Bx, DB = A′x drives D flip-flops A, B. Their outputs feed back to the gate block, with the input x. One clock drives every flip-flop.");
    expect([...img.querySelectorAll("[data-equation]")].map((t) => t.textContent)).toEqual(["DA = Ax + Bx", "DB = A′x"]);
    expect([...img.querySelectorAll("[data-ff]")].map((g) => g.getAttribute("data-ff"))).toEqual(["A", "B"]);
    expect([...img.querySelectorAll("[data-feedback]")].map((g) => g.getAttribute("data-feedback"))).toEqual(["A", "B"]);
    expect(img.querySelector("[data-focus]")).toHaveAttribute("data-ff", "B");
    // dots at real branches only: one per Q tap, one where the clock branches to the second flip-flop
    expect(img.querySelectorAll("circle[r='3.5']")).toHaveLength(3);
    // the output is drawn only when asked for
    expect(img.querySelector("[data-line='y']")).toBeNull();
  });

  it("a JK flip-flop has two input wires, named JA and KA", () => {
    render(<SequentialFigure flipFlops={[{ name: "A", ff: "jk", equations: ["JA = B", "KA = Bx′"] }]} output="y" />);
    const ff = screen.getByRole("img").querySelector("[data-ff='A']")!;
    expect(ff).toHaveTextContent("JA");
    expect(ff).toHaveTextContent("KA");
    expect(screen.getByRole("img").querySelector("[data-line='y']")).not.toBeNull();
  });

  it("the spec checks the equations, the names and the focus", async () => {
    const ok = (f: object) => FigureSpec.safeParse({ type: "sequential", ...f }).success;
    expect(ok({ flipFlops: two, input: "x", focus: "gates" })).toBe(true);
    expect(ok({ flipFlops: [{ name: "A", ff: "jk", equations: ["JA = B"] }] })).toBe(false);
    expect(ok({ flipFlops: [two[0], two[0]] })).toBe(false);
    expect(ok({ flipFlops: two, focus: "C" })).toBe(false);
    const figure = FigureSpec.parse({ type: "sequential", flipFlops: two, input: "x" });
    expect(figurePins(figure)).toEqual(["A", "B", "gates"]);
    render(<FigureView id="f" figure={figure} focus="A" revealed />);
    expect((await screen.findByRole("img")).querySelector("[data-focus]")).toHaveAttribute("data-ff", "A");
  });
});
