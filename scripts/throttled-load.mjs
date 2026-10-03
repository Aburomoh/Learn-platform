#!/usr/bin/env node
// Cold load of a route on a throttled mid-range phone profile (issue #50, COST_RULES).
// Manual tool, not run in CI. Needs `npm run build` (./out) and `npx playwright install chromium`.
// Usage: node scripts/throttled-load.mjs [route] [runs]
// Profile: Pixel 7 viewport, DevTools "Slow 4G" (562.5 ms RTT, 1.47 Mbps down), 4× CPU slowdown.
// Files are served gzipped, as a CDN would; prints the median of each metric.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import { chromium, devices } from "@playwright/test";

const ROUTE = process.argv[2] ?? "/courses/ecet111/number-systems/decimal-to-binary/";
const RUNS = Number(process.argv[3] ?? 5);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain", ".ico": "image/x-icon", ".svg": "image/svg+xml" };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  for (const file of [join("out", path), join("out", path, "index.html")]) {
    try {
      const body = gzipSync(await readFile(file));
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "content-encoding": "gzip" });
      return res.end(body);
    } catch {}
  }
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}${ROUTE}`;

const browser = await chromium.launch();
const samples = [];
for (let i = 0; i < RUNS; i++) {
  const context = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 562.5, downloadThroughput: (1.4744 * 1024 * 1024) / 8, uploadThroughput: (0.675 * 1024 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let jsBytes = 0;
  cdp.on("Network.loadingFinished", (e) => { jsBytes += e.encodedDataLength; });
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, longTasks: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.longTasks += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "load" });
  // hydrated = React has attached to the server-rendered stage
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-testid=learning-stage]");
    return el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
  }, null, { timeout: 60_000, polling: 50 });
  const hydrated = Date.now() - t0;
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    return { ttfb: nav.responseStart, fcp, lcp: window.__perf.lcp, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, tbt: window.__perf.longTasks };
  });
  samples.push({ ...m, hydrated, kB: jsBytes / 1024 });
  await context.close();
}
await browser.close();
server.close();

const median = (k) => samples.map((s) => s[k]).sort((a, b) => a - b)[Math.floor(samples.length / 2)];
console.log(`${ROUTE} — Pixel 7, Slow 4G, 4× CPU, cold cache, median of ${RUNS}`);
for (const k of ["ttfb", "fcp", "lcp", "dcl", "load", "hydrated", "tbt"]) console.log(`${k.padEnd(9)} ${Math.round(median(k))} ms`);
console.log(`transfer  ${median("kB").toFixed(1)} kB (all requests, gzip)`);
