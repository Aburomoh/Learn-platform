import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";

const figure = (f: object) => FigureSpec.parse(f);
const nodes = () => document.querySelectorAll("[data-node]").length;

describe("topology figure (Ch9 s.7–12, #615)", () => {
  it("spec: the five topologies, 4–8 nodes; no pins; no result", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    for (const t of ["star", "ring", "bus", "tree", "hybrid"]) expect(ok({ type: "topology", topology: t })).toBe(true);
    expect(ok({ type: "topology", topology: "mesh" })).toBe(false);
    expect(ok({ type: "topology", topology: "ring", nodes: 3 })).toBe(false);
    expect(ok({ type: "topology", topology: "ring", nodes: 9 })).toBe(false);
    expect(figurePins(figure({ type: "topology", topology: "star" }))).toEqual([]);
  });

  it("draws the right number of sites for each shape; the name never says the topology's word", async () => {
    const expected: Record<string, number> = { star: 7, ring: 6, bus: 8, tree: 6, hybrid: 8 }; // star: centre + 6; bus: 6 + 2 end points; hybrid: hub + 3 + 4
    for (const [t, n] of Object.entries(expected)) {
      const { unmount } = render(<FigureView id="f" figure={figure({ type: "topology", topology: t })} />);
      const img = await screen.findByRole("img");
      expect(nodes(), t).toBe(n);
      expect(img.getAttribute("aria-label"), t).not.toMatch(/star|ring|bus|tree|hybrid/i);
      expect(img.getAttribute("data-topology")).toBe(t);
      unmount();
    }
  });

  it("a star has one square centre; a ring's segments carry arrowheads; the result state changes nothing", async () => {
    const { rerender } = render(<FigureView id="f" figure={figure({ type: "topology", topology: "star", nodes: 5 })} />);
    let img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("A central node with 5 other nodes, each linked to the centre alone.");
    expect(document.querySelectorAll("[data-node='hub']")).toHaveLength(1);
    expect(document.querySelectorAll("[data-node='site']")).toHaveLength(5);
    expect(document.querySelectorAll("[marker-end]")).toHaveLength(0);
    const before = img.innerHTML;
    rerender(<FigureView id="f" figure={figure({ type: "topology", topology: "star", nodes: 5 })} revealed focus="hub" />);
    expect(screen.getByRole("img").innerHTML).toBe(before);
    rerender(<FigureView id="f" figure={figure({ type: "topology", topology: "ring", nodes: 4 })} />);
    img = await screen.findByRole("img");
    expect(document.querySelectorAll("[marker-end]")).toHaveLength(4);
    expect(document.querySelectorAll("[data-node='hub']")).toHaveLength(0);
  });
});
