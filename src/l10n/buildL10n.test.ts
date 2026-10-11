import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SCRIPT = path.resolve(process.cwd(), "scripts/build-l10n.mjs");

describe("scripts/build-l10n.mjs (ADR-0011 §3)", () => {
  it("writes one compact {english: arabic} map per course plus shared, content-hashed, with an index; keeps the first of two Arabic texts for one English", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "l10n-"));
    const pkg = path.join(dir, "package.json");
    writeFileSync(
      pkg,
      JSON.stringify([
        { id: "a", course: "ecet111", english: "Look at {bits}.", arabic: "انظر إلى {bits}." },
        { id: "b", course: "ecet111", english: "Same English", arabic: "first" },
        { id: "c", course: "ecet111", english: "Same English", arabic: "second" },
        { id: "d", course: "cpet181", english: "Not yet.", arabic: "ليس بعد." },
        { id: "e", course: "shared", english: "Correct.", arabic: "صحيح." },
        { id: "f", course: "shared", english: "Untranslated", arabic: "" },
      ]),
    );
    const out = path.join(dir, "out");
    const log = execFileSync(process.execPath, [SCRIPT, out, pkg], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const files = readdirSync(out).sort();
    expect(files).toHaveLength(4);
    const index = JSON.parse(readFileSync(path.join(out, "index.json"), "utf8"));
    expect(Object.keys(index).sort()).toEqual(["cpet181", "ecet111", "shared"]);
    expect(index.ecet111).toMatch(/^ecet111\.[0-9a-f]{10}\.json$/);
    const ecet = JSON.parse(readFileSync(path.join(out, index.ecet111), "utf8"));
    expect(ecet).toEqual({ "Look at {bits}.": "انظر إلى {bits}.", "Same English": "first" });
    const shared = JSON.parse(readFileSync(path.join(out, index.shared), "utf8"));
    expect(shared).toEqual({ "Correct.": "صحيح." }); // an empty Arabic is not a translation
    expect(log).toMatch(/ecet111\.[0-9a-f]{10}\.json 2 strings/);
    expect(log).toContain("1 owner decision(s) pending");
    // the same input builds the same file name: a changed map gets a new one
    execFileSync(process.execPath, [SCRIPT, out, pkg], { stdio: "ignore" });
    expect(readdirSync(out).sort()).toEqual(files);
  });

  it("without the package it writes nothing and exits 0 (the app falls back to English)", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "l10n-"));
    const out = path.join(dir, "out");
    execFileSync(process.execPath, [SCRIPT, out, path.join(dir, "missing.json")], { stdio: "ignore" });
    expect(() => readdirSync(out)).toThrow();
  });
});
