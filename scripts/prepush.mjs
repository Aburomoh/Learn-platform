// Cheap local gate before a push (shared/COMMUNICATION.md, CI policy): typecheck and lint when the
// push carries code, nothing for docs/state-only pushes. CI stays the verification gate; this only
// keeps preventable failures (syntax, merge markers, type errors) from costing a remote run.
// Run by .githooks/pre-push (core.hooksPath); also `npm run prepush`.
import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const NON_RUNTIME = /^(agents\/|docs\/|shared\/|\.claude\/agents\/|[^/]+\.md$)/;
const sh = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

let files = [];
try {
  sh("git fetch -q origin main");
  files = sh("git diff --name-only origin/main...HEAD").split("\n").filter(Boolean);
} catch {
  files = ["(unknown)"]; // can't tell: check
}
if (files.length && files.every((f) => NON_RUNTIME.test(f))) process.exit(0);

if (!existsSync("node_modules/typescript") || !existsSync("node_modules/eslint")) {
  console.warn("prepush: node_modules missing here, local checks skipped (install to enable them).");
  process.exit(0);
}
for (const [name, cmd] of [["typecheck", "npx tsc --noEmit"], ["lint", "npx eslint"]]) {
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`prepush: ${name} failed. Fix it before pushing: CI is the verification gate, not the first debugger.`);
    process.exit(1);
  }
}
