import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";
import { translate } from "./memoryTable";

const figure = (f: object) => FigureSpec.parse(f);
// Ch3 s.13: page size 512, PMT 0 → 5, 1 → 3; byte 518 → page 1, displacement 6, frame 3, 1536 + 6 = 1542
const pmt = { type: "memory-table", table: "page", size: 512, unit: "bytes", rows: [{ id: 0, at: 5 }, { id: 1, at: 3 }], address: 518 };
// Ch3 s.17: SMT 0 main program 350 at 4000, 1 subroutine A 200 at 7000, 2 subroutine B 100 at 6000; A line 100 → 7100
const smt = { type: "memory-table", table: "segment", rows: [{ id: 0, name: "main program", size: 350, at: 4000 }, { id: 1, name: "subroutine A", size: 200, at: 7000 }, { id: 2, name: "subroutine B", size: 100, at: 6000 }], address: { part: 1, offset: 100 } };

describe("memory-table figure: the translation is computed from the pack's examples (Ch3 s.11, s.13, s.17)", () => {
  it("paging: page = ⌊address ÷ size⌋, displacement, frame × size + displacement", () => {
    expect(translate({ table: "page", size: 512, rows: [{ id: 0, at: 5 }, { id: 1, at: 3 }], address: 518 })).toEqual({ part: 1, displacement: 6, at: 3, start: 1536, physical: 1542 });
    expect(translate({ table: "page", size: 512, rows: [{ id: 0, at: 5 }, { id: 1, at: 3 }], address: 25 })).toMatchObject({ part: 0, displacement: 25, physical: 2585 });
    expect(translate({ table: "page", size: 1024, rows: Array.from({ length: 13 }, (_, id) => ({ id, at: id + 1 })), address: 12345 })).toMatchObject({ part: 12, displacement: 57 });
  });

  it("segmentation: base + displacement", () => {
    const f = { table: "segment" as const, rows: smt.rows, address: { part: 1, offset: 100 } };
    expect(translate(f)).toEqual({ part: 1, displacement: 100, at: 7000, start: 7000, physical: 7100 });
    expect(translate({ ...f, address: { part: 2, offset: 99 } })).toMatchObject({ physical: 6099 });
  });

  it("spec: pages need a size, segments give sizes and take { part, offset }, the address must fall inside", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok(pmt)).toBe(true);
    expect(ok(smt)).toBe(true);
    expect(ok({ ...pmt, size: undefined })).toBe(false);
    expect(ok({ ...pmt, address: 2000 })).toBe(false); // page 3: not in the table
    expect(ok({ ...smt, address: 100 })).toBe(false);
    expect(ok({ ...smt, address: { part: 1, offset: 200 } })).toBe(false); // beyond subroutine A
    expect(ok({ ...smt, rows: [{ id: 0, at: 4000 }] })).toBe(false); // no size
    expect(ok({ ...pmt, focus: "number" })).toBe(true);
    expect(ok({ ...pmt, focus: "D3" })).toBe(false);
    expect(figurePins(figure(pmt))).toEqual(["row", "number", "displacement", "physical"]);
    // a result is never authored
    expect(FigureSpec.parse({ ...pmt, physical: 1542 })).not.toHaveProperty("physical");
  });
});

describe("MemoryTableFigure in FigureView (ADR-0009)", () => {
  it("draws the table and the address; the page, displacement, frame and physical address read ? until the result state", async () => {
    const f = figure(pmt);
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Page map table: page 0 in frame 5; page 1 in frame 3. Page size 512 bytes. Address 518.");
    expect(img.textContent).not.toContain("1542");
    expect(img.textContent).toContain("?");
    expect(document.querySelectorAll("[data-on]")).toHaveLength(0);
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/page 1, displacement 6, frame 3, physical address 1542\.$/);
    expect([...document.querySelectorAll("[data-on]")].map((g) => g.getAttribute("data-row"))).toEqual(["1"]);
    expect(screen.getByRole("img").textContent).toContain("1542");
  });

  it("segment table: names and sizes in the rows; the focus halo moves with the Explain stage", async () => {
    const f = figure({ ...smt, focus: "row" });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName(/^Segment map table: segment 0 \(main program\), 350 at 4000; segment 1 \(subroutine A\), 200 at 7000/);
    expect([...document.querySelectorAll("[data-focus]")].map((g) => g.getAttribute("data-row") ?? g.getAttribute("data-line"))).toEqual(["1"]);
    rerender(<FigureView id="f" figure={f} focus="physical" />);
    expect([...document.querySelectorAll("[data-focus]")].map((g) => g.getAttribute("data-line"))).toEqual(["physical"]);
    expect(img.textContent).not.toContain("7100");
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img").textContent).toContain("7100");
  });

  it("a table without an address draws the table alone", async () => {
    render(<FigureView id="f" figure={figure({ ...pmt, address: undefined })} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Page map table: page 0 in frame 5; page 1 in frame 3. Page size 512 bytes.");
    expect(document.querySelectorAll("[data-line]")).toHaveLength(0);
  });
});
