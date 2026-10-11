import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FigureSpec, figurePins } from "./figureSpec";
import { FigureView } from "./FigureView";

const figure = (f: object) => FigureSpec.parse(f);

describe("tracks figure: concentric rings or one spiral (Ch7 s.16, s.22, #615)", () => {
  it("spec: the two track shapes; no pins; no result", () => {
    const ok = (f: object) => FigureSpec.safeParse(f).success;
    expect(ok({ type: "tracks", tracks: "concentric" })).toBe(true);
    expect(ok({ type: "tracks", tracks: "spiral" })).toBe(true);
    expect(ok({ type: "tracks", tracks: "helical" })).toBe(false);
    expect(figurePins(figure({ type: "tracks", tracks: "spiral" }))).toEqual([]);
  });

  it("draws rings or a spiral; the name describes the shape and never the medium; the result state changes nothing", async () => {
    const { rerender } = render(<FigureView id="f" figure={figure({ type: "tracks", tracks: "concentric" })} />);
    let img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName("A platter with four separate rings, one inside the other, around a hub.");
    expect(document.querySelectorAll("[data-track='ring']")).toHaveLength(4);
    expect(img.getAttribute("aria-label")).not.toMatch(/magnetic|optical|CD|DVD/);
    const before = img.innerHTML;
    rerender(<FigureView id="f" figure={figure({ type: "tracks", tracks: "concentric" })} revealed />);
    expect(screen.getByRole("img").innerHTML).toBe(before);
    rerender(<FigureView id="f" figure={figure({ type: "tracks", tracks: "spiral" })} />);
    img = await screen.findByRole("img");
    expect(img).toHaveAccessibleName(/one track spiralling out/);
    expect(document.querySelectorAll("[data-track='spiral']")).toHaveLength(1);
    expect(document.querySelectorAll("[data-track='ring']")).toHaveLength(0);
  });
});
