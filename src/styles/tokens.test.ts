import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/** Parses `--name: value;` pairs from one CSS block. */
function block(css: string, start: string): Record<string, string> {
  const from = css.indexOf(start);
  if (from < 0) throw new Error(`block not found: ${start}`);
  const open = css.indexOf("{", from);
  const close = css.indexOf("}", open);
  const out: Record<string, string> = {};
  for (const m of css.slice(open + 1, close).matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const css = readFileSync("src/styles/tokens.css", "utf8");
const light = block(css, ":root {");
const dark = { ...light, ...block(css, ':root[data-theme="dark"] {') };
const system = block(css, ':root[data-theme="system"] {');

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio]
const TEXT_PAIRS: [string, string, number][] = [
  ["--text", "--bg", 4.5],
  ["--text", "--surface", 4.5],
  ["--text", "--surface-2", 4.5],
  ["--text", "--surface-sunk", 4.5],
  ["--text-muted", "--bg", 4.5],
  ["--text-muted", "--surface", 4.5],
  ["--accent-contrast", "--accent", 4.5],
  ["--accent", "--surface", 4.5],
  ["--accent", "--accent-soft", 4.5],
  ["--success", "--surface", 4.5],
  // on its soft fill --success is a border or a check mark, not body text (light: 4.3:1)
  ["--success", "--success-soft", 3],
  ["--error", "--surface", 4.5],
  ["--error", "--error-bg", 4.5],
  ["--warning", "--warning-bg", 4.5],
  ["--signal-high", "--surface", 4.5],
  // --brand is used as text only at 13 px bold or larger, and as rings and fills
  ["--brand", "--bg", 3],
  ["--brand", "--surface", 3],
  ["--brand", "--brand-soft", 3],
  // focus ring against the surfaces it sits on
  ["--focus", "--surface", 3],
  ["--focus", "--bg", 3],
];

describe("design tokens", () => {
  it.each([
    ["light", light],
    ["dark", dark],
  ])("%s theme text and UI colours meet their contrast floor", (_name, theme) => {
    for (const [fg, bg, min] of TEXT_PAIRS) {
      const ratio = contrast(theme[fg], theme[bg]);
      expect(ratio, `${fg} ${theme[fg]} on ${bg} ${theme[bg]} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
    }
  });

  it("is light by default: dark values apply only under data-theme", () => {
    expect(css).toMatch(/:root \{\s*color-scheme: light;/);
    expect(css).not.toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root \{/);
  });

  it("keeps the two dark blocks identical (chosen dark, and match-device dark)", () => {
    expect(system).toEqual(block(css, ':root[data-theme="dark"] {'));
  });

  it("keeps the names existing modules use", () => {
    for (const name of ["--shadow", "--success-bg", "--error-bg", "--warning-bg", "--highlight-soft", "--focus-halo", "--signal-high", "--signal-low", "--pending-opacity", "--diagram-text-min", "--topbar-h", "--tutor-strip-h", "--sticky-offset"]) {
      expect(light[name], name).toBeDefined();
    }
  });
});
