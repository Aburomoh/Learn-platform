import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CircuitDiagram } from "./CircuitDiagram";
import type { CircuitSpec } from "@/content/schema";

const spec: CircuitSpec = {
  kind: "circuit-predict",
  inputs: [
    { id: "a", label: "A", value: 1 },
    { id: "b", label: "B", value: 0 },
    { id: "c", label: "C", value: 1 },
  ],
  gates: [
    { id: "n1", type: "NOT", from: ["b"] },
    { id: "g1", type: "AND", from: ["a", "n1"] },
    { id: "g2", type: "OR", from: ["g1", "c"], label: "Y" },
  ],
  outputGateId: "g2",
  answer: 1,
  inputsToggleable: true,
};

describe("CircuitDiagram", () => {
  it("renders gates with focus targets and hides the output until revealed", () => {
    render(<CircuitDiagram id="c" spec={spec} />);
    expect(document.querySelector("[data-focus-target='gate-n1']")).not.toBeNull();
    expect(screen.getByText("Y")).toBeInTheDocument();
    expect(screen.queryByText("Y = 1")).toBeNull();
  });

  it("exposes toggleable inputs as switches operable by keyboard", async () => {
    const onToggle = vi.fn();
    render(<CircuitDiagram id="c" spec={spec} onToggleInput={onToggle} />);
    const sw = screen.getByRole("switch", { name: /Input B/ });
    expect(sw).toHaveAttribute("aria-checked", "false");
    sw.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledWith("b", 1);
  });

  it("shows evaluated values for lit gates and the output when revealed", () => {
    render(<CircuitDiagram id="c" spec={spec} lit={["n1", "g1", "g2"]} revealOutput />);
    expect(screen.getByText("Y = 1")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-focus-target^='gate-'] text").length).toBeGreaterThanOrEqual(6);
  });

  it("marks only the active gate", () => {
    render(<CircuitDiagram id="c" spec={spec} activeGateId="g1" />);
    expect(document.querySelectorAll("[data-active]")).toHaveLength(1);
    expect(document.querySelector("[data-focus-target='gate-g1']")).toHaveAttribute("data-active");
  });

  it("gives nothing away during a walk: the active gate's output and everything after it stay neutral", () => {
    const order = ["n1", "g1", "g2"];
    for (let step = 0; step < order.length; step++) {
      const { unmount } = render(<CircuitDiagram id="c" spec={spec} lit={order.slice(0, step)} activeGateId={order[step]} />);
      const notYet = order.slice(step);
      for (const id of notYet) {
        // no coloured wire leaves a gate that has not been answered
        for (const w of document.querySelectorAll(`[data-wire^='${id}-']`)) expect(w).not.toHaveAttribute("data-signal");
        // and no value is printed on it
        const texts = [...document.querySelectorAll(`[data-focus-target='gate-${id}'] text`)].map((t) => t.textContent);
        expect(texts.some((t) => t === "0" || t === "1")).toBe(false);
      }
      expect(document.querySelector("[data-wire='output']")).not.toHaveAttribute("data-signal");
      // wires into the active gate do show their (known) values
      for (const w of document.querySelectorAll(`[data-wire$='-${order[step]}']`)) expect(w).toHaveAttribute("data-signal");
      expect(document.querySelector("[data-active]")).toHaveTextContent("?");
      unmount();
    }
  });

  it("colours wires only when their value is known", () => {
    render(<CircuitDiagram id="c" spec={spec} lit={["n1", "g1", "g2"]} revealOutput />);
    expect(document.querySelector("[data-wire='b-n1']")).toHaveAttribute("data-signal", "0");
    expect(document.querySelector("[data-wire='n1-g1']")).toHaveAttribute("data-signal", "1");
    expect(document.querySelector("[data-wire='output']")).toHaveAttribute("data-signal", "1");
  });

  it("renders the title as a single text node, so the pre-rendered page hydrates cleanly (#100)", () => {
    render(<CircuitDiagram id="c" spec={spec} />);
    const title = document.querySelector("svg title")!;
    expect(title.childNodes).toHaveLength(1);
    expect(title).toHaveTextContent("Circuit with NOT, AND, OR gates");
  });

  it("draws a stub and label for every output: S and C of a half adder (#357)", () => {
    const half: CircuitSpec = {
      kind: "circuit-predict",
      inputs: [
        { id: "a", label: "A", value: 1 },
        { id: "b", label: "B", value: 1 },
      ],
      gates: [
        { id: "gs", type: "XOR", from: ["a", "b"], label: "S" },
        { id: "gc", type: "AND", from: ["a", "b"], label: "C" },
      ],
      outputGateId: "gc",
      answer: 1,
      inputsToggleable: false,
    };
    const { rerender } = render(<CircuitDiagram id="h" spec={half} lit={[]} activeGateId="gs" />);
    const s = document.querySelector("[data-wire='output-gs']")!;
    const c = document.querySelector("[data-wire='output']")!;
    expect(s).toHaveTextContent(/^S$/);
    expect(c).toHaveTextContent(/^C$/);
    // S shows its value once its gate is answered; C only at the end
    rerender(<CircuitDiagram id="h" spec={half} lit={["gs"]} activeGateId="gc" />);
    expect(s).toHaveTextContent("S = 0");
    expect(c).not.toHaveAttribute("data-signal");
    rerender(<CircuitDiagram id="h" spec={half} lit={["gs", "gc"]} revealOutput />);
    expect(c).toHaveTextContent("C = 1");
  });
});
