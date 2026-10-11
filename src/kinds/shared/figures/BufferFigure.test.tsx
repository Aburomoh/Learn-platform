import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";

const figure = (f: object) => FigureSpec.parse(f);

describe("buffer figure: producer, buffer, consumer (Ch6 s.17–18, #615)", () => {
  it("spec: filled within the slots; the three pins; no state word is authored", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok({ type: "buffer", slots: 6, filled: 4 })).toBe(true);
    expect(ok({ type: "buffer", slots: 6, filled: 7 })).toBe(false);
    expect(ok({ type: "buffer", slots: 1, filled: 0 })).toBe(false);
    expect(ok({ type: "buffer", slots: 6, filled: 0, focus: "consumer" })).toBe(true);
    expect(ok({ type: "buffer", slots: 6, filled: 0, focus: "queue" })).toBe(false);
    expect(figurePins(figure({ type: "buffer", slots: 6, filled: 4 }))).toEqual(["producer", "buffer", "consumer"]);
    expect(FigureSpec.parse({ type: "buffer", slots: 6, filled: 6, state: "full" })).not.toHaveProperty("state");
  });

  it("draws the filled positions from the left, names the sides, prints no state word, and the result state changes nothing", async () => {
    const f = figure({ type: "buffer", slots: 6, filled: 4, producer: "CPU", consumer: "printer", focus: "buffer" });
    const { rerender } = render(<FigureView id="f" figure={f} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("CPU, a buffer of 6 positions with 4 filled, printer. Data flows from the CPU to the printer.");
    expect([...document.querySelectorAll("[data-slot][data-on]")].map((g) => g.getAttribute("data-slot"))).toEqual(["0", "1", "2", "3"]);
    expect(img.textContent).toContain("CPU");
    expect(img.textContent).toContain("printer");
    expect(img.textContent).not.toMatch(/full|empty/i);
    expect([...document.querySelectorAll("[data-part][data-focus]")].map((g) => g.getAttribute("data-part"))).toEqual(["buffer"]);
    const before = img.innerHTML;
    rerender(<FigureView id="f" figure={f} revealed />);
    expect(screen.getByRole("img").innerHTML).toBe(before);
    rerender(<FigureView id="f" figure={f} focus="producer" />);
    expect([...document.querySelectorAll("[data-part][data-focus]")].map((g) => g.getAttribute("data-part"))).toEqual(["producer"]);
  });
});
