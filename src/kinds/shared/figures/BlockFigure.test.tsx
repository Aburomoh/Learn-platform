import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { envFor, evaluate, parseBool } from "@/content/boolean";
import { AdderFigure, FlipFlopFigure } from "./BlockFigure";
import { adderOutputs, flipFlopNext } from "./blocks";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";

type Bit = 0 | 1;
const bits: Bit[] = [0, 1];
const pinTexts = () => [...screen.getByRole("img").querySelectorAll("[data-line]")].map((g) => g.querySelector("text")!.textContent);
const lit = () => [...document.querySelectorAll("[data-on]")].map((g) => g.getAttribute("data-line"));
const truth = (expr: string, vars: string[], values: Bit[]) => evaluate(parseBool(expr, { vars }), envFor(vars, values.reduce<number>((acc, b) => acc * 2 + b, 0)));

describe("adder and flip-flop outputs agree with the course equations (Boolean module)", () => {
  it("full adder: S = A ⊕ B ⊕ Ci, Co = AB + ACi + BCi; half adder: S = A ⊕ B, C = AB", () => {
    for (const a of bits)
      for (const b of bits) {
        expect(adderOutputs({ a, b })).toEqual({ s: truth("A ⊕ B", ["A", "B"], [a, b]), c: truth("AB", ["A", "B"], [a, b]) });
        for (const ci of bits) {
          const vars = ["A", "B", "C"];
          expect(adderOutputs({ a, b, ci })).toEqual({ s: truth("A ⊕ B ⊕ C", vars, [a, b, ci]), c: truth("AB + AC + BC", vars, [a, b, ci]) });
        }
      }
  });

  it("flip-flops: D, T ⊕ Q, S + R′Q, JQ′ + K′Q", () => {
    for (const q of bits)
      for (const x of bits) {
        expect(flipFlopNext("d", { q, inputs: [x] })).toBe(x);
        expect(flipFlopNext("t", { q, inputs: [x] })).toBe(truth("T ⊕ Q", ["T", "Q"], [x, q]));
        for (const y of bits) {
          expect(flipFlopNext("jk", { q, inputs: [x, y] })).toBe(truth("JQ' + K'Q", ["J", "K", "Q"], [x, y, q]));
          if (!(x && y)) expect(flipFlopNext("sr", { q, inputs: [x, y] })).toBe(truth("S + R'Q", ["S", "R", "Q"], [x, y, q]));
        }
      }
  });
});

describe("AdderFigure", () => {
  it("prints the given bits; the outputs read ? until the result state", () => {
    const { rerender } = render(<AdderFigure adder="full" given={{ a: 1, b: 0, ci: 1 }} />);
    expect(pinTexts()).toEqual(["A = 1", "B = 0", "Ci = 1", "S = ?", "Co = ?"]);
    expect(screen.getByRole("img")).toHaveAccessibleName("Full adder. Given: A = 1, B = 0, Ci = 1.");
    expect(lit()).toEqual([]);
    rerender(<AdderFigure adder="full" given={{ a: 1, b: 0, ci: 1 }} revealed />);
    expect(pinTexts()).toEqual(["A = 1", "B = 0", "Ci = 1", "S = 0", "Co = 1"]);
    expect(lit()).toEqual(["Co"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Answer: S = 0, Co = 1\.$/);
  });

  it("the half adder names its carry C; with nothing given it is the symbol alone", () => {
    render(<AdderFigure adder="half" focus="S" />);
    expect(pinTexts()).toEqual(["A", "B", "S", "C"]);
    expect(document.querySelector("[data-focus]")).toHaveAttribute("data-line", "S");
  });
});

describe("FlipFlopFigure", () => {
  it("JK: inputs above and below the clock; the next Q is drawn only in the result state", () => {
    const { rerender } = render(<FlipFlopFigure ff="jk" given={{ q: 0, inputs: [1, 1] }} />);
    expect(pinTexts()).toEqual(["J = 1", "K = 1", "Q(t) = 0", "Q′", "Clk"]);
    expect(screen.getByRole("img")).toHaveAccessibleName("JK flip-flop, rising-edge triggered. Given: J = 1, K = 1, Q(t) = 0.");
    rerender(<FlipFlopFigure ff="jk" given={{ q: 0, inputs: [1, 1] }} revealed />);
    expect(pinTexts()).toEqual(["J = 1", "K = 1", "Q(t+1) = 1", "Q′(t+1) = 0", "Clk"]);
    expect(lit()).toEqual(["Q"]);
  });

  it("a falling-edge trigger has the bubble, and the mini clock edge says so", () => {
    render(<FlipFlopFigure ff="d" edge="falling" />);
    const clk = document.querySelector("[data-line='Clk']")!;
    expect(clk).toHaveAttribute("data-edge", "falling");
    expect(clk.querySelectorAll("circle")).toHaveLength(1);
    expect(clk).toHaveTextContent("falling edge");
  });
});

describe("adder and flip-flop figures in the spec (ADR-0009)", () => {
  const ok = (f: object) => FigureSpec.safeParse(f).success;
  it("checks what is given and the focus pin", () => {
    expect(ok({ type: "adder", adder: "full", given: { a: 1, b: 0, ci: 1 }, focus: "Co" })).toBe(true);
    expect(ok({ type: "adder", adder: "full", given: { a: 1, b: 0 } })).toBe(false);
    expect(ok({ type: "adder", adder: "half", given: { a: 1, b: 0, ci: 1 } })).toBe(false);
    expect(ok({ type: "adder", adder: "half", focus: "Co" })).toBe(false);
    expect(ok({ type: "flip-flop", ff: "jk", given: { q: 0, inputs: [1, 1] }, focus: "Clk" })).toBe(true);
    expect(ok({ type: "flip-flop", ff: "d", given: { q: 0, inputs: [1, 1] } })).toBe(false);
    expect(ok({ type: "flip-flop", ff: "sr", given: { q: 0, inputs: [1, 1] } })).toBe(false);
    expect(ok({ type: "flip-flop", ff: "t", focus: "D" })).toBe(false);
    expect(figurePins(FigureSpec.parse({ type: "flip-flop", ff: "sr" }))).toEqual(["S", "R", "Clk", "Q", "Q′"]);
  });

  it("FigureView draws them, lazily", async () => {
    render(<FigureView id="f" figure={FigureSpec.parse({ type: "flip-flop", ff: "t", edge: "falling", given: { q: 1, inputs: [1] } })} revealed />);
    expect(await screen.findByRole("img")).toHaveAccessibleName("T flip-flop, falling-edge triggered. Given: T = 1, Q(t) = 1. After the clock edge: Q(t+1) = 0, Q′(t+1) = 1.");
  });
});
