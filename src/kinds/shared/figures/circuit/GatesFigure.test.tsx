import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatBool, parseBool } from "@/content/boolean";
import { FigureSpec } from "../figureSpec";
import { FigureView } from "../FigureView";
import { circuitFromExpression, gateExpressions } from "./circuit";
import { GatesFigure } from "./GatesFigure";

const build = (expr: string, vars: string[], output = "DA") => circuitFromExpression(parseBool(expr, { vars }), output);
const shape = (expr: string, vars: string[]) => {
  const c = build(expr, vars);
  return { inputs: c.inputs.map((i) => i.label), gates: c.gates.map((g) => g.type), out: formatBool(gateExpressions(c)[c.outputGateId]) };
};

describe("circuitFromExpression (#489)", () => {
  it("one input per literal, two-input gates, the last gate drives the pin", () => {
    expect(shape("Ax + Bx", ["A", "B", "x"])).toEqual({ inputs: ["A", "x", "B"], gates: ["AND", "AND", "OR"], out: "Ax + Bx" });
    const c = build("Ax + Bx", ["A", "B", "x"]);
    expect(c.gates.find((g) => g.id === c.outputGateId)).toMatchObject({ type: "OR", label: "DA" });
    // x feeds both AND gates from the one input
    expect(c.gates.filter((g) => g.from.includes(c.inputs[1].id))).toHaveLength(2);
  });

  it("a complemented variable is its own input; NOT of a two-input AND or OR is a NAND or NOR", () => {
    expect(shape("A'x", ["A", "x"])).toEqual({ inputs: ["A′", "x"], gates: ["AND"], out: "A′x" });
    expect(shape("(A + B)x'", ["A", "B", "x"])).toMatchObject({ inputs: ["A", "B", "x′"], gates: ["OR", "AND"] });
    expect(shape("(AB)'", ["A", "B"]).gates).toEqual(["NAND"]);
    expect(shape("A ⊕ x", ["A", "x"]).gates).toEqual(["XOR"]);
    expect(shape("xAB'", ["A", "B", "x"]).gates).toEqual(["AND", "AND"]);
  });

  it("refuses what it cannot draw: a bare literal, or more than 3 inputs or 4 gates", () => {
    expect(() => build("x'", ["x"])).toThrow(/single literal/);
    expect(() => build("AB + CD", ["A", "B", "C", "D"])).toThrow(/holds 3 and 4/);
  });
});

describe("GatesFigure", () => {
  it("shows the gates and the pin name; the expressions appear only in the result state", () => {
    const { rerender } = render(<GatesFigure id="g" output="DA" expr="Ax + Bx" vars={["A", "B", "x"]} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAccessibleName("Circuit with AND, AND, OR gates");
    expect(img).toHaveTextContent("DA");
    expect(img.querySelectorAll("[data-expression]")).toHaveLength(0);
    rerender(<GatesFigure id="g" output="DA" expr="Ax + Bx" vars={["A", "B", "x"]} revealed />);
    expect([...img.querySelectorAll("[data-expression]")].map((t) => t.textContent)).toEqual(["Ax", "Bx", "Ax + Bx"]);
  });

  it("is a figure content can name, checked at build", async () => {
    const ok = (f: object) => FigureSpec.safeParse({ type: "gates", ...f }).success;
    expect(ok({ output: "DA", expr: "Ax + Bx", vars: ["A", "B", "x"] })).toBe(true);
    expect(ok({ output: "JA", expr: "x'", vars: ["A", "B", "x"] })).toBe(false);
    expect(ok({ output: "DA", expr: "Ax + Bz", vars: ["A", "B", "x"] })).toBe(false);
    render(<FigureView id="f" figure={FigureSpec.parse({ type: "gates", output: "y", expr: "(A + B)x'", vars: ["A", "B", "x"] })} />);
    expect(await screen.findByRole("img")).toHaveTextContent("y");
  });
});
