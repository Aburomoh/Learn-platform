import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");
const sheets = (readdirSync(root, { recursive: true }) as string[]).filter((f) => f.endsWith(".css")).map((f) => join(root, f));

describe("stylesheets", () => {
  // An unclosed block does not fail the build: CSS nesting silently scopes every later rule under
  // it (a missing "}" once limited the phone rules of r1.module.css to the home panel, #272).
  it("every block is closed", () => {
    expect(sheets.length).toBeGreaterThan(10);
    for (const file of sheets) {
      const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"]*"|'[^']*'/g, "");
      let depth = 0;
      for (const ch of css) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        expect(depth, file).toBeGreaterThanOrEqual(0);
      }
      expect(depth, file).toBe(0);
    }
  });
});
