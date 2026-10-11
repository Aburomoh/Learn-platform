import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";
import { depth, leaves, operations, parseExpression, print, schedule, stepOf } from "./opTree";

const figure = (f: object) => FigureSpec.parse(f);
const S22 = "A = 3 * B * C + 4 / (D + E) ** (F − G)";
const S24 = "A = 3 * B + (C + 4) / (D + E) ** (F − G)";

describe("opTree: the pack's two expressions (Ch6 s.22–24)", () => {
  it("s.22: 7 operations, 4 steps, 3 processors under earliest-step scheduling", () => {
    const { name, root } = parseExpression(S22);
    expect(name).toBe("A");
    expect(operations(root)).toHaveLength(7);
    expect(leaves(root)).toEqual(["3", "B", "C", "4", "D", "E", "F", "G"]);
    expect(stepOf(root)).toBe(4);
    const { steps, widest } = schedule(root);
    expect(steps.map((s) => s.map((o) => `${print(o.left)}${o.op}${print(o.right)}`))).toEqual([["3*B", "D+E", "F-G"], ["3 * B*C", "D + E**F − G"], ["4/(D + E) ** (F − G)"], ["3 * B * C+4 / (D + E) ** (F − G)"]]);
    expect(widest).toBe(3);
    expect(print(root)).toBe("3 * B * C + 4 / (D + E) ** (F − G)");
  });

  it("s.24: 7 operations, 4 steps, 4 processors", () => {
    const { root } = parseExpression(S24);
    expect(operations(root)).toHaveLength(7);
    expect(stepOf(root)).toBe(4);
    expect(schedule(root).widest).toBe(4);
    expect(depth(root)).toBe(4);
  });

  it("precedence and errors: ** binds right and tightest; unbalanced or empty expressions are refused", () => {
    expect(print(parseExpression("a ** b ** c").root)).toBe("a ** b ** c");
    expect(stepOf(parseExpression("a ** b ** c").root)).toBe(2);
    expect(print(parseExpression("(a - b) - c").root)).toBe("a − b − c");
    expect(print(parseExpression("a - (b - c)").root)).toBe("a − (b − c)");
    expect(print(parseExpression("(a + b) * c").root)).toBe("(a + b) * c");
    expect(() => parseExpression("3 *")).toThrow(/ends too early/);
    expect(() => parseExpression("(D + E")).toThrow(/Missing/);
    expect(() => parseExpression("A B")).toThrow(/Unexpected/);
    expect(() => parseExpression("A")).toThrow(/no operation/);
  });
});

describe("op-tree figure in FigureView (#615)", () => {
  it("spec: an expression that parses, at most 10 leaves and 6 levels; no focus pins; no authored steps", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok({ type: "op-tree", expression: S22 })).toBe(true);
    expect(ok({ type: "op-tree", expression: "3 *" })).toBe(false);
    expect(ok({ type: "op-tree", expression: "a+b+c+d+e+f+g+h+i+j+k" })).toBe(false); // 11 leaves
    expect(ok({ type: "op-tree", expression: "a+(b+(c+(d+(e+(f+(g+h))))))" })).toBe(false); // 7 levels
    expect(figurePins(figure({ type: "op-tree", expression: S22 }))).toEqual([]);
    expect(FigureSpec.parse({ type: "op-tree", expression: S22, steps: 4 })).not.toHaveProperty("steps");
  });

  it("draws the leaves in reading order under their operations; the step numbers appear in the result state only", async () => {
    const f = figure({ type: "op-tree", expression: S22 });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("A = 3 * B * C + 4 / (D + E) ** (F − G) as a tree of 7 operations.");
    expect([...document.querySelectorAll("[data-leaf]")].map((g) => g.getAttribute("data-leaf"))).toEqual(["3", "B", "C", "4", "D", "E", "F", "G"]);
    expect(document.querySelectorAll("[data-op]")).toHaveLength(7);
    expect(document.querySelectorAll("[data-step]")).toHaveLength(0);
    expect(img.textContent).not.toMatch(/[1-4]$/);
    rerender(<FigureView id="f" figure={f} revealed />);
    const steps = [...document.querySelectorAll("[data-step]")].map((g) => `${g.getAttribute("data-op")}${g.getAttribute("data-step")}`);
    // parent first: + (4) over * (2) over * (1), then / (3) over ** (2) over + (1) and − (1)
    expect(steps).toEqual(["+4", "*2", "*1", "/3", "**2", "+1", "−1"]);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Earliest-step schedule, 4 steps: step 1: 3 \* B, D \+ E, F − G;/);
  });
});
