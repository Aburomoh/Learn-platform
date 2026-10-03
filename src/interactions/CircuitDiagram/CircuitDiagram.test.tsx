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
});
