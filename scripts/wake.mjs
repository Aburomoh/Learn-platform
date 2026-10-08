#!/usr/bin/env node
// Wake tooling (ADR-0006, Team V2: ADR-0010). Labels are the durable queue; this script reads and writes them.
//   npm run wake <role>                              charter, open items and state-board pointer for a role
//   npm run alarm <role> <issue|pr #> "<reason>" [from-role]   wake a role (idempotent)
//   npm run wake:ack <role> <issue|pr #...>          clear the role's alarm label once picked up
//   npm run wake:pending                             every open alarm, all roles (SessionStart hook)
//   npm run wake:health                              dispatcher + listener health and wake ages, all roles
// Live sessions stream `node scripts/inbox.mjs <role>` (fed by scripts/dispatch.mjs); they never poll GitHub.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gh, openItems } from "./github.mjs";
import { ROLES, RETIRED, roleOf } from "./roles.mjs";

const BOARD = 519; // Team V2 state board (pinned issue): one comment per role, edited in place.
const ISSUE = (n) => `repos/{owner}/{repo}/issues/${n}`;
const line = (it, labels) => `[${it.labels.map((l) => l.name).filter((n) => labels.includes(n)).join(", ")}] #${it.number} ${it.title}  ${it.url}`;

function usage() {
  console.error(
    'Usage:\n  npm run wake <role>\n  npm run alarm <role> <issue|pr #> "<reason>" [from-role]\n  npm run wake:ack <role> <issue|pr #...>\n' +
      "  npm run wake:pending\n  npm run wake:health\nPermanent roles: lead, content-engineer, ui-engineer, code-architecture-reviewer (reviewer), qa-test-engineer (qa)\n" +
      "On demand (wakes go to the Lead): pedagogy, ux, material, security, performance, devops",
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const mode = argv[0]?.startsWith("--") ? argv.shift() : "--show";

if (mode === "--pending") {
  // SessionStart hook: runs at every session start, resume and context compaction.
  console.log(
    "Team V2 (ADR-0010): if this session holds a permanent role, run ONE listener as a background Bash command (run_in_background);\n" +
      "it completes once per real wake: read it, act, start it again. No Monitor, no polling:\n" +
      "  node scripts/inbox.mjs <lead|content-engineer|ui-engineer|code-architecture-reviewer|qa-test-engineer>\n" +
      `Recover from repository truth: agents/SESSION_PROMPTS.md, your charter agents/<role>.md, and your comment on state board #${BOARD}.`,
  );
  try {
    const alarms = Object.values(ROLES).map((r) => r.alarm).concat(Object.keys(RETIRED).filter((k) => !k.includes("-")).map((k) => `wake:${k}`));
    const items = openItems([...new Set(alarms)]);
    if (items.length) console.log("Open wake alarms:\n" + items.map((it) => "  " + line(it, alarms)).join("\n"));
  } catch {}
  process.exit(0);
}

if (mode === "--health") {
  const dir = join(tmpdir(), "cet-wake");
  const status = existsSync(join(dir, "status.json")) ? JSON.parse(readFileSync(join(dir, "status.json"), "utf8")) : null;
  const ago = (iso) => (iso ? Math.round((Date.now() - Date.parse(iso)) / 60000) : null);
  const d = status ? ago(status.lastPoll) : null;
  console.log(`Dispatcher: ${d === null ? "NOT RUNNING (no status)" : d <= 3 ? `ok, last poll ${d} min ago (pid ${status.pid})` : `STALE, last poll ${d} min ago: npm run dispatch:start`}`);
  console.log("Role                         listener   open wakes (oldest)");
  for (const [slug, r] of Object.entries(ROLES)) {
    const seen = join(dir, "inbox", `${slug}.seen`);
    const s = existsSync(seen) ? ago(new Date(statSync(seen).mtime).toISOString()) : null;
    const listener = r.onDemand ? "on demand" : s === null ? "none" : s <= 2 ? "alive" : `DOWN ${s}m`;
    const open = [...new Map((status?.open?.[slug] ?? []).map((x) => [x.number, x])).values()]; // one row per item
    const oldest = open.length ? Math.max(...open.map((x) => x.ageMinutes)) : 0;
    const flag = oldest >= 30 && !r.onDemand ? "  <- 30-min rule: health check" : "";
    console.log(`${slug.padEnd(28)} ${listener.padEnd(10)} ${open.length ? `${open.length} (${oldest} min) ${open.map((x) => "#" + x.number).join(" ")}` : "-"}${flag}`);
  }
  process.exit(0);
}

if (mode === "--watch") {
  // Team V1 self-polling watcher, retired by ADR-0010.
  const r = roleOf(argv[0]);
  console.log(`--watch is retired (ADR-0010). ${r ? `Stream your inbox instead: node scripts/inbox.mjs ${r}` : "Your role is retired or on demand: stop your watcher."}`);
  process.exit(0);
}

const role = roleOf(argv[0]);
if (argv[3] && roleOf(argv[3])) argv[3] = roleOf(argv[3]);
if (!role) usage();
const { title, charter, alarm, labels } = ROLES[role];
const all = [alarm, ...labels];
const number = Number(argv[1]);

if (mode === "--alarm") {
  const reason = argv[2]?.trim();
  if (!Number.isInteger(number) || !reason) usage();
  const from = ROLES[argv[3]]?.title ?? argv[3];
  const body = `WAKE → ${title}: ${reason}` + (from ? ` (from ${from})` : "");
  // Adds only this role's label; never removes another role's wake (owner, 2026-10-05).
  gh("api", "-X", "POST", `${ISSUE(number)}/labels`, "-f", `labels[]=${alarm}`);
  const seen = JSON.parse(gh("api", "--paginate", "--slurp", `${ISSUE(number)}/comments`)).flat();
  if (!seen.some((c) => c.body === body)) gh("api", "-X", "POST", `${ISSUE(number)}/comments`, "-f", `body=${body}`);
  console.log(`#${number} now carries ${alarm}.${ROLES[role].onDemand ? " On-demand role: the Lead is notified and decides whether to start it." : ""}`);
} else if (mode === "--ack") {
  const numbers = argv.slice(1).map(Number);
  if (!numbers.length || !numbers.every(Number.isInteger)) usage();
  for (const n of numbers) {
    try {
      gh("api", "-X", "DELETE", `${ISSUE(n)}/labels/${encodeURIComponent(alarm)}`);
    } catch {} // already cleared
    console.log(`#${n}: ${alarm} cleared.`);
  }
} else if (mode === "--show") {
  const path = `agents/${charter}.md`;
  console.log(`\n=== CHARTER (${path}) ===\n` + (existsSync(path) ? readFileSync(path, "utf8").trim() : "(missing)"));
  console.log(`\n=== STATE: your comment on board #${BOARD} (gh api --paginate repos/{owner}/{repo}/issues/${BOARD}/comments) ===`);
  console.log("\n=== ACTIVE ADRs ===");
  for (const f of readdirSync("docs/adr").filter((n) => /^\d{4}-/.test(n))) console.log("  docs/adr/" + f);
  console.log("\n=== OPEN ITEMS ===");
  try {
    const open = openItems(all).map((it) => "  " + line(it, all));
    console.log(open.length ? open.join("\n") : "  (none)");
  } catch {
    console.log("  (gh unavailable or not authenticated)");
  }
  console.log(`\nWake: npm run alarm <role> <#> "<done> / <needed>" ${role}. Ack: npm run wake:ack ${role} <#>. Listener (background Bash, restart after each wake): node scripts/inbox.mjs ${role}`);
} else {
  usage();
}
