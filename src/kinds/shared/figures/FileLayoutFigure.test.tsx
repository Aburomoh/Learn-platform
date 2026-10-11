import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";
import { hash } from "./FileLayoutFigure";

const figure = (f: object) => FigureSpec.parse(f);
const records = ["10", "20", "30", "40", "50", "60"];
const lit = () => [...document.querySelectorAll("[data-on]")].map((g) => g.getAttribute("data-record") ?? g.getAttribute("data-slot") ?? `index${g.getAttribute("data-index")}`);

describe("file-layout figure (Ch8 s.7–9, #605)", () => {
  it("spec: distinct keys, the searched key in the file, an ordered indexed file, enough slots; no result field", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok({ type: "file-layout", layout: "sequential", records, key: "40" })).toBe(true);
    expect(ok({ type: "file-layout", layout: "sequential", records, key: "45" })).toBe(false);
    expect(ok({ type: "file-layout", layout: "sequential", records: ["10", "10"] })).toBe(false);
    expect(ok({ type: "file-layout", layout: "indexed", records: ["30", "10", "20"] })).toBe(false);
    expect(ok({ type: "file-layout", layout: "indexed", records, blockSize: 3, key: "50" })).toBe(true);
    expect(ok({ type: "file-layout", layout: "direct", records, slots: 4 })).toBe(false);
    expect(ok({ type: "file-layout", layout: "direct", records, slots: 7, key: "45" })).toBe(true); // a direct lookup may miss
    expect(figurePins(figure({ type: "file-layout", layout: "indexed", records }))).toEqual(["index", "blocks"]);
    expect(FigureSpec.parse({ type: "file-layout", layout: "sequential", records, address: 3 })).not.toHaveProperty("address");
  });

  it("sequential: the records in a row; the search sweeps from the start to the key", async () => {
    const f = figure({ type: "file-layout", layout: "sequential", records, key: "40" });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Sequential file: records 10, 20, 30, 40, 50, 60 one after another. Finding 40 reads 4 records from the start.");
    expect(lit()).toEqual(["40"]);
    expect(img.textContent).toContain("4 records read");
    const before = img.innerHTML;
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img").innerHTML).toBe(before); // a picture only
  });

  it("direct: the address is computed from the key and the slot lights; two keys on one slot are a collision", async () => {
    expect(hash("45", 7)).toBe(3);
    const f = figure({ type: "file-layout", layout: "direct", records: ["10", "20", "33", "17"], slots: 7, key: "17" });
    render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName(/^Direct file with 7 slots: each key's address is computed from the key\. 17 goes to address 3\. Collision at 10\/17\.$/);
    expect(lit()).toEqual(["3"]);
    expect(img.textContent).toContain("address = f(17) = 3");
    // the colliding keys stack on two lines; nothing shrinks
    expect(img.querySelectorAll("[data-slot='3'] tspan")).toHaveLength(2);
  });

  it("no text is set below 15 units in any layout (12 px at the 0.8 floor, #610)", async () => {
    for (const f of [
      figure({ type: "file-layout", layout: "sequential", records: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], key: "12" }),
      figure({ type: "file-layout", layout: "direct", records: ["10", "20", "33", "17"], slots: 7, key: "17" }),
      figure({ type: "file-layout", layout: "indexed", records, blockSize: 3, key: "50" }),
    ]) {
      const { unmount } = render(<FigureView id="f" figure={f} />);
      const img = await screen.findByRole("img");
      const sizes = [...img.querySelectorAll("text")].map((t) => parseFloat((t as SVGElement).style.fontSize || "15"));
      expect(sizes.length).toBeGreaterThan(0);
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(15);
      unmount();
    }
  });

  it("indexed: blocks of equal size, an index of the highest key per block; the path lights the index entry, then the record; focus from the stage", async () => {
    const f = figure({ type: "file-layout", layout: "indexed", records, blockSize: 3, key: "50", focus: "index" });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Indexed sequential file: 2 blocks of 3 ordered records (10, 20, 30, 40, 50, 60) with an index of the highest key per block. Finding 50: the index points to block 1, then the record.");
    expect(lit()).toEqual(["index1", "50"]);
    expect(img.textContent).toContain("≤ 30");
    expect(img.textContent).toContain("≤ 60");
    const focused = () => [...document.querySelectorAll("[data-part][data-focus]")].map((g) => g.getAttribute("data-part"));
    expect(focused()).toEqual(["index"]);
    rerender(<FigureView id="f" figure={f} focus="blocks" />);
    expect(focused()).toEqual(["blocks"]);
  });
});
