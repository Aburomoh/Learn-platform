import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";
import { tapeBlocks } from "./TapeFigure";

const figure = (f: object) => FigureSpec.parse(f);

describe("tape figure: records and gaps (Ch7 s.11–12, #615)", () => {
  it("blocks: one per record (IRG), or `block` records at a time (IBG), the last block shorter", () => {
    expect(tapeBlocks(10)).toHaveLength(10);
    expect(tapeBlocks(10, 5)).toEqual([5, 5]);
    expect(tapeBlocks(10, 4)).toEqual([4, 4, 2]);
  });

  it("spec: 2–12 records, a block no larger than the records; no pins; the gap count is never authored", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok({ type: "tape", records: 10 })).toBe(true);
    expect(ok({ type: "tape", records: 10, block: 5 })).toBe(true);
    expect(ok({ type: "tape", records: 1 })).toBe(false);
    expect(ok({ type: "tape", records: 13 })).toBe(false);
    expect(ok({ type: "tape", records: 4, block: 5 })).toBe(false);
    expect(figurePins(figure({ type: "tape", records: 10 }))).toEqual([]);
    expect(FigureSpec.parse({ type: "tape", records: 10, gaps: 9 })).not.toHaveProperty("gaps");
  });

  it("10 records → 9 gaps, numbered only in the result state (s.11)", async () => {
    const f = figure({ type: "tape", records: 10 });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Tape with 10 records stored one by one; a gap between each record and the next (IRG).");
    expect(document.querySelectorAll("[data-record]")).toHaveLength(10);
    expect(document.querySelectorAll("[data-gap]")).toHaveLength(9);
    expect(document.querySelectorAll("[data-count]")).toHaveLength(0);
    expect(img.getAttribute("aria-label")).not.toContain("9 gaps");
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/\(IRG\)\. 9 gaps\.$/);
    expect([...document.querySelectorAll("[data-count]")].map((g) => g.getAttribute("data-count"))).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("blocks of 5 (s.12): two blocks, one inter-block gap", async () => {
    render(<FigureView id="f" figure={figure({ type: "tape", records: 10, block: 5 })} revealed />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("Tape with 10 records in blocks of 5; a gap between each block and the next (IBG). 1 gap.");
    expect(document.querySelectorAll("[data-gap]")).toHaveLength(1);
    expect(img.textContent).toContain("IBG");
  });
});
