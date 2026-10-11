import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Integrity of the owner-approved Arabic package (#649). The Arabic is not edited here: this test
 * only checks that the package still lines up with the Phase 1 inventory and keeps what a
 * translation must keep (English source, slots, Western digits).
 */
const DIR = path.resolve(process.cwd(), "docs/localization/ar");
type Entry = { id: string; english: string; arabic?: string; type: string; slots?: string[]; course: string };
const read = (name: string) => JSON.parse(readFileSync(path.join(DIR, name), "utf8")) as Entry[];

const source = read("source-texts.json");
const arabic = read("source-texts.ar.json");
const byId = new Map(arabic.map((e) => [e.id, e]));

/** Slot expressions of a string: {name} and ${…}, in order. */
const slotsOf = (s: string) => [...s.matchAll(/\$\{[^}]*\}|\{[A-Za-z0-9_.]+\}/g)].map((m) => m[0]);

describe("Arabic translation package (#649)", () => {
  it("has the same entries as the Phase 1 inventory, in the same order, with the English unchanged", () => {
    expect(arabic.length).toBe(source.length);
    expect(new Set(arabic.map((e) => e.id)).size).toBe(arabic.length);
    source.forEach((s, i) => {
      expect(arabic[i].id, `index ${i}`).toBe(s.id);
      expect(arabic[i].english, s.id).toBe(s.english);
      expect(arabic[i].type, s.id).toBe(s.type);
    });
    for (const s of source) expect(byId.has(s.id), s.id).toBe(true);
  });

  it("every entry has an Arabic text", () => {
    const empty = arabic.filter((e) => typeof e.arabic !== "string" || e.arabic.trim() === "").map((e) => e.id);
    expect(empty).toEqual([]);
  });

  it("uses Western digits only: no Arabic-Indic (٠–٩) or extended Arabic-Indic (۰–۹) digits", () => {
    const bad = arabic.filter((e) => /[٠-٩۰-۹]/.test(e.arabic ?? "")).map((e) => e.id);
    expect(bad).toEqual([]);
  });

  it("keeps every {slot} and ${…} expression of the English, none lost, renamed or added", () => {
    const bad: string[] = [];
    for (const e of arabic) {
      const want = slotsOf(e.english).sort();
      const got = slotsOf(e.arabic ?? "").sort();
      if (JSON.stringify(want) !== JSON.stringify(got)) bad.push(`${e.id}: ${want.join(" ")} / ${got.join(" ")}`);
    }
    expect(bad).toEqual([]);
  });

  it("contains no machine-translation placeholder or leftover marker", () => {
    const bad = arabic.filter((e) => /\b(TODO|TRANSLATE|FIXME|lorem)\b/i.test(e.arabic ?? "")).map((e) => e.id);
    expect(bad).toEqual([]);
  });
});
