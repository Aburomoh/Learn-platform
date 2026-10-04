// Cheap local gate before a push (shared/COMMUNICATION.md, CI policy): typecheck and lint when the
// pushed commits carry code, nothing for docs/state-only pushes. CI stays the verification gate; this
// only keeps preventable failures (syntax, merge markers, type errors) from costing a remote run.
// Run by .githooks/pre-push (core.hooksPath), which passes the pushed refs on stdin; also `npm run prepush`.
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const NON_RUNTIME = /^(agents\/|docs\/|shared\/|\.claude\/agents\/|[^/]+\.md$)/;
const ZERO = /^0+$/;
const sh = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

// git pre-push stdin: "<local ref> <local sha> <remote ref> <remote sha>" per pushed ref.
let stdin = "";
try {
  if (!process.stdin.isTTY) stdin = readFileSync(0, "utf8");
} catch {}
const head = sh("git rev-parse HEAD");
const pushed = stdin
  .split("\n")
  .map((l) => l.trim().split(/\s+/))
  .filter((p) => p.length === 4 && !ZERO.test(p[1]))
  .map((p) => p[1]);
const shas = pushed.length ? pushed : [head]; // `npm run prepush` by hand: check HEAD

try {
  sh("git fetch -q origin main");
} catch {}
const changed = (sha) => {
  try {
    return sh(`git diff --name-only origin/main...${sha}`).split("\n").filter(Boolean);
  } catch {
    return ["(unknown)"]; // can't tell: treat as code
  }
};
const code = shas.filter((sha) => changed(sha).some((f) => !NON_RUNTIME.test(f)));
if (!code.length) process.exit(0);

// The checks run on the working tree, so they only describe the checked-out commit.
if (code.some((sha) => sha !== head)) {
  console.warn("prepush: pushing code that isn't checked out here; local checks skipped (CI will run them).");
  process.exit(0);
}
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
