#!/usr/bin/env node
// Arabic maps for the app (ADR-0011, #650). Reads the owner-approved package
// docs/localization/ar/source-texts.ar.json and writes compact {english: arabic} maps, one per
// course plus "shared" (tutor catalog and component text), to public/l10n/ar/<name>.<hash>.json
// with public/l10n/ar/index.json naming the current files (cache-busting: a changed map gets a new
// name; the index is fetched with no-cache). Only the English bundle is unchanged by this: nothing
// here is imported by the app. Runs as `prebuild`; also `node scripts/build-l10n.mjs [outDir]`.
// The Arabic is never edited here. When one English string has two different Arabic texts the
// first in inventory order is kept and the pair is printed for the owner.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGE = process.argv[3] ?? "docs/localization/ar/source-texts.ar.json";
const OUT = process.argv[2] ?? "public/l10n/ar";

export function buildMaps(entries) {
  const maps = new Map(); // course → Map(english → arabic)
  const conflicts = [];
  for (const e of entries) {
    if (typeof e.english !== "string" || typeof e.arabic !== "string" || !e.arabic.trim()) continue;
    const course = typeof e.course === "string" && e.course ? e.course : "shared";
    if (!maps.has(course)) maps.set(course, new Map());
    const m = maps.get(course);
    const prev = m.get(e.english);
    if (prev === undefined) m.set(e.english, e.arabic);
    else if (prev !== e.arabic) conflicts.push({ course, english: e.english, kept: prev, dropped: e.arabic, id: e.id });
  }
  return { maps, conflicts };
}

function main() {
  if (!existsSync(PACKAGE)) {
    console.warn(`build-l10n: ${PACKAGE} not found; no Arabic maps written (the app falls back to English).`);
    return;
  }
  const entries = JSON.parse(readFileSync(PACKAGE, "utf8"));
  const { maps, conflicts } = buildMaps(entries);
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const index = {};
  for (const [course, m] of [...maps].sort(([a], [b]) => a.localeCompare(b))) {
    const json = JSON.stringify(Object.fromEntries(m));
    const hash = createHash("sha256").update(json).digest("hex").slice(0, 10);
    const name = `${course}.${hash}.json`;
    writeFileSync(join(OUT, name), json);
    index[course] = name;
    console.log(`build-l10n: ${name} ${m.size} strings, ${(Buffer.byteLength(json) / 1024).toFixed(0)} kB raw`);
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
  for (const c of conflicts) console.warn(`build-l10n: two Arabic texts for one English (kept the first): [${c.course}] ${c.english.slice(0, 70)}… (dropped ${c.id})`);
  console.log(`build-l10n: ${readdirSync(OUT).length} files in ${OUT}${conflicts.length ? `, ${conflicts.length} owner decision(s) pending` : ""}`);
}

if (process.argv[1]?.endsWith("build-l10n.mjs")) main();
