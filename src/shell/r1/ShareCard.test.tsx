import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import jsQR from "jsqr";
import { QUIET, qrPath, SHARE_HOST, SHARE_URL, ShareCard } from "./ShareCard";

/** Rasterises the drawn symbol (dark modules from the path) into RGBA pixels, `scale` px per module. */
function rasterise(d: string, side: number, scale: number): { data: Uint8ClampedArray; width: number; height: number } {
  const px = side * scale;
  const data = new Uint8ClampedArray(px * px * 4).fill(255);
  for (const m of d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const [x, y] = [Number(m[1]), Number(m[2])];
    for (let dy = 0; dy < scale; dy++)
      for (let dx = 0; dx < scale; dx++) {
        const i = ((y * scale + dy) * px + x * scale + dx) * 4;
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
  }
  return { data, width: px, height: px };
}

describe("landing-page QR code (#657)", () => {
  it("the drawn symbol decodes to the public address, with a 4-module quiet zone, from a build-time path (no runtime library)", () => {
    const { size, d } = qrPath(SHARE_URL);
    expect(size).toBeGreaterThanOrEqual(21);
    // every module sits inside the quiet zone
    for (const m of d.matchAll(/M(\d+) (\d+)h/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(QUIET);
      expect(Number(m[1])).toBeLessThan(size + QUIET);
      expect(Number(m[2])).toBeGreaterThanOrEqual(QUIET);
    }
    const { data, width, height } = rasterise(d, size + QUIET * 2, 4);
    const decoded = jsQR(data, width, height);
    expect(decoded?.data).toBe(SHARE_URL);
  });

  it("renders the code on the page with an accessible name, a caption, and the address as a link", () => {
    render(<ShareCard />);
    const img = screen.getByRole("img", { name: `QR code: opens ${SHARE_HOST}` });
    expect(img.tagName).toBe("svg");
    expect(img.querySelector("path")!.getAttribute("d")).toMatch(/^M\d+ \d+h1v1h-1z/);
    expect(screen.getByRole("heading", { level: 2, name: /Scan to open CET Learn/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SHARE_HOST })).toHaveAttribute("href", SHARE_URL);
    // the symbol on the page is the same decodable one
    const side = Number(img.getAttribute("viewBox")!.split(" ")[2]);
    const { data, width, height } = rasterise(img.querySelector("path")!.getAttribute("d")!, side, 4);
    expect(jsQR(data, width, height)?.data).toBe(SHARE_URL);
  });
});
