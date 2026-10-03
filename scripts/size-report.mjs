#!/usr/bin/env node
// First-load JS per route, measured from the static export (COST_RULES, issue #50).
// For each exported HTML page, sums every unique /_next/static/chunks/*.js it references
// (script tags, preloads and the inline RSC payload), raw and gzipped. noModule scripts
// (legacy polyfills) are excluded: modern browsers never download them.
// Usage: node scripts/size-report.mjs [outDir]   — prints a Markdown table.
// Report only: never exits non-zero for size (budget enforcement needs an ADR).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";

const OUT = process.argv[2] ?? "out";
const BUDGET_KB = 200; // gzipped, COST_RULES "M1 budget"
const CHUNK = /\/_next\/static\/chunks\/[\w.\-/]+?\.js/g;
const NOMODULE = /<script[^>]*src="([^"]+)"[^>]*noModule/gi;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "_next" ? [] : htmlFiles(p);
    return name.endsWith(".html") ? [p] : [];
  });
}

const gz = new Map(); // chunk path → [raw, gzip] bytes, measured once
function size(chunk) {
  if (!gz.has(chunk)) {
    const buf = readFileSync(join(OUT, chunk));
    gz.set(chunk, [buf.length, gzipSync(buf, { level: 9 }).length]);
  }
  return gz.get(chunk);
}

const kb = (n) => (n / 1024).toFixed(1);
const rows = htmlFiles(OUT)
  .map((file) => {
    const html = readFileSync(file, "utf8");
    const legacy = new Set([...html.matchAll(NOMODULE)].map((m) => m[1]));
    const chunks = [...new Set(html.match(CHUNK) ?? [])].filter((c) => !legacy.has(c));
    const [raw, gzip] = chunks.map(size).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
    const route = "/" + relative(OUT, file).split(sep).join("/").replace(/(^|\/)index\.html$/, "");
    return { route: route.replace(/\/$/, "") || "/", chunks: chunks.length, raw, gzip };
  })
  .sort((a, b) => b.gzip - a.gzip);

const lines = [
  `### First-load JS per route (budget ${BUDGET_KB} kB gzip)`,
  "",
  "| Route | Chunks | Raw kB | Gzip kB | |",
  "|---|---:|---:|---:|---|",
  ...rows.map((r) => `| \`${r.route}\` | ${r.chunks} | ${kb(r.raw)} | ${kb(r.gzip)} | ${r.gzip > BUDGET_KB * 1024 ? "⚠️ over" : "ok"} |`),
];
console.log(lines.join("\n"));
for (const r of rows.filter((r) => r.gzip > BUDGET_KB * 1024)) {
  console.error(`::warning::${r.route} first-load JS ${kb(r.gzip)} kB gzip exceeds ${BUDGET_KB} kB budget`);
}
