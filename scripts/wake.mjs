#!/usr/bin/env node
// Wake tooling (ADR-0006). Labels are the durable signal; this script reads and writes them.
//   npm run wake <role>                              charter, state and open items for a role
//   npm run alarm <role> <issue|pr #> "<reason>" [from-role]   wake a role (idempotent)
//   node scripts/wake.mjs --watch <role>             live session: one line per new/updated item (run node directly:
//                                                    an npm wrapper outlives its Monitor and leaks watchers, #350)
//   npm run wake:ack <role> <issue|pr #>             clear the role's alarm label once picked up
//   npm run wake:pending                             every open alarm, all roles (SessionStart hook)
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

// `alarm` is the label any agent may apply to wake that role directly; `labels` are its other triggers.
const ROLES = {
  "product-engineering-director": { title: "Product / Engineering Director", file: "product_engineering_director", alarm: "wake:director", labels: ["blocked", "owner-decision"] },
  "product-manager": { title: "Product Manager", file: "product_manager", alarm: "wake:product-manager", labels: ["blocked:product"] },
  "course-material-analyst": { title: "Course Material Analyst", file: "course_material_analyst", alarm: "wake:material", labels: [] },
  "pedagogy-engineer": { title: "Educational / Pedagogy Engineer", file: "pedagogy_engineer", alarm: "wake:pedagogy", labels: ["pedagogy-review"] },
  "ux-design-engineer": { title: "UX / Design Engineer", file: "ux_design_engineer", alarm: "wake:ux", labels: [] },
  "technical-lead": { title: "Technical Lead", file: "technical_lead", alarm: "wake:tech-lead", labels: ["blocked:architecture"] },
  "frontend-interaction-engineer": { title: "Frontend / Interaction Engineer", file: "frontend_interaction_engineer", alarm: "wake:frontend", labels: ["ready"] },
  "backend-data-engineer": { title: "Backend / Data Engineer", file: "backend_data_engineer", alarm: "wake:backend", labels: ["ready"] },
  "ai-tutor-engineer": { title: "AI Tutor Engineer", file: "ai_tutor_engineer", alarm: "wake:tutor", labels: ["ready"] },
  "code-architecture-reviewer": { title: "Code / Architecture Reviewer", file: "code_architecture_reviewer", alarm: "wake:reviewer", labels: [] },
  "qa-test-engineer": { title: "QA / Test Engineer", file: "qa_test_engineer", alarm: "wake:qa", labels: [] },
  "security-privacy-engineer": { title: "Security / Privacy Engineer", file: "security_privacy_engineer", alarm: "wake:security", labels: ["security-sensitive"] },
  "performance-stress-engineer": { title: "Performance / Stress Engineer", file: "performance_stress_engineer", alarm: "wake:performance", labels: ["performance-risk"] },
  "release-devops-engineer": { title: "Release / DevOps Engineer", file: "release_devops_engineer", alarm: "wake:devops", labels: ["release-ready"] },
};

// Timeout so a stalled network call surfaces as an error instead of silently freezing a watcher.
const gh = (...args) => execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
const ISSUE = (n) => `repos/{owner}/{repo}/issues/${n}`;

// Issues and PRs carrying any of `labels`: open ones, plus PRs merged in the last 7 days, because
// wake.yml labels the PR itself on merge (#94). The window keeps old unacked merges from flooding.
// The search index lags label changes, so results are re-checked against each item's actual
// labels (a just-acked item must not wake anyone). The session-start check skips merged PRs.
// Labels .github/workflows/wake.yml sets on a PR when it merges. Only watchers of these labels
// query merged PRs, to keep every watcher to 2 searches per poll (shared search rate limit).
const MERGE_LABELS = ["wake:product-manager"];

function openItems(labels, { merged = false } = {}) {
  const search = "label:" + labels.map((l) => `"${l}"`).join(",");
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const lists = [
    ["issue", "--state", "open", "--search", search],
    ["pr", "--state", "open", "--search", search],
    ...(merged && labels.some((l) => MERGE_LABELS.includes(l)) ? [["pr", "--state", "merged", "--search", `${search} merged:>=${since}`]] : []),
  ];
  const out = [];
  for (const args of lists) {
    const json = gh(...args.slice(0, 1), "list", ...args.slice(1), "--json", "number,title,url,updatedAt,labels", "--limit", "50");
    out.push(...JSON.parse(json || "[]"));
  }
  return out.filter((it) => it.labels.some((l) => labels.includes(l.name)));
}
const line = (it, labels) => {
  const hit = it.labels.map((l) => l.name).filter((n) => labels.includes(n));
  return `[${hit.join(", ")}] #${it.number} ${it.title}  ${it.url}`;
};

function usage() {
  console.error(
    'Usage:\n  npm run wake <role>\n  npm run alarm <role> <issue|pr #> "<reason>" [from-role]\n' +
      "  node scripts/wake.mjs --watch <role>\n  npm run wake:ack <role> <issue|pr #>\n  npm run wake:pending\nRoles:\n  " +
      Object.keys(ROLES).join("\n  "),
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const mode = argv[0]?.startsWith("--") ? argv.shift() : "--show";

if (mode === "--pending") {
  // Runs at every session start, resume and context compaction (SessionStart hook). Compaction drops
  // the standing "re-arm every 30 min" instruction, which silently stopped role sessions' watchers
  // (Pedagogy and QA on 2026-10-04), so the reminder is printed every time.
  console.log(
    "Wake watcher: if this session holds a team role, make sure exactly one watcher runs now (Monitor tool, 30 min) and re-arm it at every expiry:\n" +
      "  WAKE_POLL_SECONDS=120 node scripts/wake.mjs --watch <your-role-slug>\n" +
      "Recover from repository truth: your charter agents/<role>.md, state agents/state/<role>.md, rules agents/SESSION_PROMPTS.md.",
  );
  // Never fails a session start: without gh there is simply nothing to report.
  try {
    const alarms = Object.values(ROLES).map((r) => r.alarm);
    const items = openItems(alarms);
    if (items.length) console.log("Open wake alarms (npm run wake <role> for context):\n" + items.map((it) => "  " + line(it, alarms)).join("\n"));
  } catch {}
  process.exit(0);
}

// Short names are accepted too: the label suffix (qa, pedagogy, ux, tech-lead, ...) names the role.
const ALIASES = Object.fromEntries(Object.entries(ROLES).map(([slug, r]) => [r.alarm.slice("wake:".length), slug]));
const roleOf = (name) => (ROLES[name] ? name : ALIASES[name]);
const role = roleOf(argv[0]);
if (argv[3] && roleOf(argv[3])) argv[3] = roleOf(argv[3]);
if (!role) usage();
const { title, file, alarm, labels } = ROLES[role];
const all = [alarm, ...labels];
const number = Number(argv[1]);

if (mode === "--alarm") {
  const reason = argv[2]?.trim();
  if (!Number.isInteger(number) || !reason) usage();
  const from = ROLES[argv[3]]?.title ?? argv[3];
  const body = `WAKE → ${title}: ${reason}` + (from ? ` (from ${from})` : "");
  gh("api", "-X", "POST", `${ISSUE(number)}/labels`, "-f", `labels[]=${alarm}`); // adding a present label is a no-op
  const seen = JSON.parse(gh("api", "--paginate", "--slurp", `${ISSUE(number)}/comments`)).flat();
  if (!seen.some((c) => c.body === body)) gh("api", "-X", "POST", `${ISSUE(number)}/comments`, "-f", `body=${body}`);
  console.log(`#${number} now carries ${alarm}. ${title} sees it via its watcher, at session start, and in npm run wake ${role}.`);
} else if (mode === "--ack") {
  // Several numbers at once, e.g. to clear a backlog of merge wakes.
  const numbers = argv.slice(1).map(Number);
  if (!numbers.length || !numbers.every(Number.isInteger)) usage();
  for (const n of numbers) {
    try {
      gh("api", "-X", "DELETE", `${ISSUE(n)}/labels/${encodeURIComponent(alarm)}`);
    } catch {} // already cleared
    console.log(`#${n}: ${alarm} cleared.`);
  }
} else if (mode === "--watch") {
  // Each stdout line is one alarm, so a session can stream this (e.g. Claude Code Monitor).
  const every = Number(process.env.WAKE_POLL_SECONDS) || 60;
  // `ready` is shared by all engineer roles, so it is listed by `npm run wake <role>` but never alarms.
  const watched = all.filter((l) => l !== "ready");
  const seen = new Map();
  // Brief connection blips are normal (#60): only report once 3 polls in a row have failed.
  let failures = 0;
  // A watcher must not outlive its session (#350): leaked watchers piled up to 174 processes.
  // It exits when the parent shell is gone (process.kill(pid, 0) works on Windows and Unix), when
  // stdout is closed, or after a maximum lifetime (the session re-arms it).
  const parent = process.ppid;
  const deadline = Date.now() + (Number(process.env.WAKE_MAX_MINUTES) || 35) * 60_000;
  const parentAlive = () => {
    try {
      process.kill(parent, 0);
      return true;
    } catch (e) {
      return e.code === "EPERM"; // exists but not ours to signal
    }
  };
  process.stdout.on("error", () => process.exit(0));
  // One watcher per role (owner, 2026-10-05): a role that re-armed on events ran 92 watchers. The
  // newest watcher wins, because a re-armed Monitor only reads its own watcher. An older watcher sees
  // that the lock names another pid and exits within 5 s (no kill: a stale pid may be reused).
  const lockDir = join(tmpdir(), "cet-wake");
  const lock = join(lockDir, `${role}.pid`);
  mkdirSync(lockDir, { recursive: true });
  writeFileSync(lock, String(process.pid));
  const ownsLock = () => {
    try {
      return Number(readFileSync(lock, "utf8")) === process.pid;
    } catch {
      return false;
    }
  };
  // Identity (owner, 2026-10-05): sessions run from the canonical root casing, and a role other than
  // the Technical Lead works in its own sibling worktree, never in the main checkout. Warn once.
  const cwd = process.cwd();
  if (/learn_platform/i.test(cwd) && !/Learn_platform/.test(cwd))
    console.log(`WAKE-WATCH WARNING for ${role}: path casing is "${cwd}"; use C:/Users/mnabu/OneDrive/Documents/Claude/Learn_platform (or its sibling worktree)`);
  if (role !== "technical-lead" && /^learn_platform$/i.test(basename(cwd)))
    console.log(`WAKE-WATCH WARNING for ${role}: running from the main checkout; work only in ../Learn_platform-${role} (git worktree add ../Learn_platform-${role} origin/main)`);
  const pause = async (ms) => {
    for (const end = Date.now() + ms; Date.now() < end; ) {
      if (!parentAlive() || Date.now() > deadline || !ownsLock()) process.exit(0);
      await new Promise((r) => setTimeout(r, Math.min(5000, end - Date.now())));
    }
  };
  for (;;) {
    try {
      for (const it of openItems(watched, { merged: true })) {
        if (seen.get(it.number) === it.updatedAt) continue;
        console.log(`WAKE ${role} ${seen.has(it.number) ? "(updated) " : ""}${line(it, watched)}`);
        seen.set(it.number, it.updatedAt);
      }
      if (failures >= 3) console.log(`WAKE-WATCH RECOVERED for ${role}: alarms are being seen again`);
      failures = 0;
    } catch (e) {
      // gh's stderr says whether it is the connection, auth or a rate limit.
      const cause = String(e.stderr || "").trim().split("\n")[0] || String(e.message).split("\n")[0];
      if (++failures === 3) console.log(`WAKE-WATCH ERROR for ${role}: 3 polls failed, alarms are not being seen (${cause})`);
    }
    await pause(every * 1000);
  }
} else if (mode === "--show") {
  const show = (heading, path) => {
    console.log(`\n=== ${heading} (${path}) ===`);
    console.log(existsSync(path) ? readFileSync(path, "utf8").trim() : "(missing)");
  };
  show("CHARTER", `agents/${file}.md`);
  show("STATE", `agents/state/${file}.md`);

  console.log("\n=== ACTIVE ADRs ===");
  for (const f of readdirSync("docs/adr").filter((n) => /^\d{4}-/.test(n))) console.log("  docs/adr/" + f);

  console.log("\n=== OPEN ITEMS ===");
  try {
    const open = openItems(all, { merged: true }).map((it) => "  " + line(it, all));
    console.log(open.length ? open.join("\n") : "  (none)");
  } catch {
    console.log("  (gh unavailable or not authenticated)");
  }
  console.log(`\nWake another role: npm run alarm <role> <issue|pr #> "<reason>" ${role}`);
  console.log(`Picked up an alarm? npm run wake:ack ${role} <#>. Live session: node scripts/wake.mjs --watch ${role} (Monitor; re-arm only on expiry)`);
  console.log("Start in a task branch. Update agents/state/" + file + ".md minimally before stopping.");
} else {
  usage();
}
