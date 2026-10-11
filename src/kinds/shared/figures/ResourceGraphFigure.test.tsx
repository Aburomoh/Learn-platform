import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";

const figure = (f: object) => FigureSpec.parse(f);
// Ch5 s.19, circular wait: P1 holds R1 and wants R2; P2 holds R2 and wants R1
const circular = {
  type: "resource-graph",
  processes: ["P1", "P2"],
  resources: ["R1", "R2"],
  edges: [
    { process: "P1", resource: "R1", kind: "holds", label: "holds" },
    { process: "P1", resource: "R2", kind: "requests", label: "requests" },
    { process: "P2", resource: "R2", kind: "holds" },
    { process: "P2", resource: "R1", kind: "requests" },
  ],
};

describe("resource-graph figure (Ch5 sketches, #605)", () => {
  it("spec: nodes must be distinct and edges name them; no result field exists", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok(circular)).toBe(true);
    expect(ok({ ...circular, processes: ["P1", "R1"] })).toBe(false);
    expect(ok({ ...circular, edges: [{ process: "P9", resource: "R1", kind: "holds" }] })).toBe(false);
    expect(ok({ ...circular, focus: "R2" })).toBe(true);
    expect(ok({ ...circular, focus: "F1" })).toBe(false);
    expect(figurePins(figure(circular))).toEqual(["P1", "P2", "R1", "R2"]);
    expect(FigureSpec.parse({ ...circular, deadlock: true })).not.toHaveProperty("deadlock");
  });

  it("draws circles for processes, boxes for resources, solid held arrows and dashed request arrows; revealed changes nothing", async () => {
    const f = figure(circular);
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Processes P1, P2; resources R1, R2. R1 is allocated to P1; P1 requests R2; R2 is allocated to P2; P2 requests R1.");
    expect([...document.querySelectorAll("[data-node]")].map((n) => `${n.getAttribute("data-node")}:${n.getAttribute("data-shape")}`)).toEqual(["P1:process", "P2:process", "R1:resource", "R2:resource"]);
    expect([...document.querySelectorAll("[data-edge]")].map((e) => `${e.getAttribute("data-edge")}:${e.getAttribute("data-kind")}:${e.querySelector("path")!.getAttribute("class")?.includes("dashed") ? "dashed" : "solid"}`)).toEqual(["P1-R1:holds:solid", "P1-R2:requests:dashed", "P2-R2:holds:solid", "P2-R1:requests:dashed"]);
    expect(img.textContent).toContain("holds");
    const before = img.innerHTML;
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img").innerHTML).toBe(before); // a picture only: no result state
    expect(document.querySelectorAll("[data-on]")).toHaveLength(0);
  });

  it("the focus halo sits on one node, from the figure or the Explain stage; a caption replaces the generated summary", async () => {
    const f = figure({ ...circular, focus: "P1", caption: "Circular wait: each process waits for the resource the other holds." });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    expect(await screen.findByRole("img")).toHaveAccessibleName("Circular wait: each process waits for the resource the other holds.");
    const focused = () => [...document.querySelectorAll("[data-node][data-focus]")].map((n) => n.getAttribute("data-node"));
    expect(focused()).toEqual(["P1"]);
    rerender(<FigureView id="f" figure={f} focus="R2" />);
    expect(focused()).toEqual(["R2"]);
  });
});
