#!/usr/bin/env node
// Wake tooling (ADR-0006). Labels are the durable signal; this script reads and writes them.
//   npm run wake <role>                              charter, state and open items for a role
//   npm run alarm <role> <issue|pr #> "<reason>" [from-role]   wake a role (idempotent)
//   npm run wake:watch <role>                        live session: one line per new/updated item
//   npm run wake:ack <role> <issue|pr #>             clear the role's alarm label once picked up
//   npm run wake:pending                             every open alarm, all roles (SessionStart hook)
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

// `alarm` is the label any agent may apply to wake that role directly; `labels` are its other triggers.
const ROLES = {
  "product-engineering-director": { title: "Product / Engineering Director", file: "product_engineering_director", alarm: "wake:director", labels: ["blocked", "owner-decision"] },
  "product-manager": { title: "Product Manager", file: "product_manager", alarm: "wake:product-manager", labels: ["blocked:product"] },
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

// Open issues and PRs matching a search query, e.g. label:"wake:qa".
function openItems(search) {
  const out = [];
  for (const kind of ["issue", "pr"]) {
    const json = gh(kind, "list", "--state", "open", "--search", search, "--json", "number,title,url,updatedAt,labels", "--limit", "50");
    out.push(...JSON.parse(json || "[]"));
  }
  return out;
}
const anyOf = (labels) => "label:" + labels.map((l) => `"${l}"`).join(",");
const line = (it, labels) => {
  const hit = it.labels.map((l) => l.name).filter((n) => labels.includes(n));
  return `[${hit.join(", ")}] #${it.number} ${it.title}  ${it.url}`;
};

function usage() {
  console.error(
    'Usage:\n  npm run wake <role>\n  npm run alarm <role> <issue|pr #> "<reason>" [from-role]\n' +
      "  npm run wake:watch <role>\n  npm run wake:ack <role> <issue|pr #>\n  npm run wake:pending\nRoles:\n  " +
      Object.keys(ROLES).join("\n  "),
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const mode = argv[0]?.startsWith("--") ? argv.shift() : "--show";

if (mode === "--pending") {
  // Never fails a session start: without gh there is simply nothing to report.
  try {
    const alarms = Object.values(ROLES).map((r) => r.alarm);
    const items = openItems(anyOf(alarms));
    if (items.length) console.log("Open wake alarms (npm run wake <role> for context):\n" + items.map((it) => "  " + line(it, alarms)).join("\n"));
  } catch {}
  process.exit(0);
}

const role = argv[0];
if (!role || !ROLES[role]) usage();
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
  console.log(`#${number} now carries ${alarm}. ${title} sees it via wake:watch, at session start, and in npm run wake ${role}.`);
} else if (mode === "--ack") {
  if (!Number.isInteger(number)) usage();
  try {
    gh("api", "-X", "DELETE", `${ISSUE(number)}/labels/${encodeURIComponent(alarm)}`);
  } catch {} // already cleared
  console.log(`#${number}: ${alarm} cleared.`);
} else if (mode === "--watch") {
  // Each stdout line is one alarm, so a session can stream this (e.g. Claude Code Monitor).
  const every = Number(process.env.WAKE_POLL_SECONDS) || 60;
  const seen = new Map();
  // Brief connection blips are normal (#60): only report once 3 polls in a row have failed.
  let failures = 0;
  for (;;) {
    try {
      for (const it of openItems(anyOf(all))) {
        if (seen.get(it.number) === it.updatedAt) continue;
        console.log(`WAKE ${role} ${seen.has(it.number) ? "(updated) " : ""}${line(it, all)}`);
        seen.set(it.number, it.updatedAt);
      }
      if (failures >= 3) console.log(`WAKE-WATCH RECOVERED for ${role}: alarms are being seen again`);
      failures = 0;
    } catch (e) {
      // gh's stderr says whether it is the connection, auth or a rate limit.
      const cause = String(e.stderr || "").trim().split("\n")[0] || String(e.message).split("\n")[0];
      if (++failures === 3) console.log(`WAKE-WATCH ERROR for ${role}: 3 polls failed, alarms are not being seen (${cause})`);
    }
    await new Promise((r) => setTimeout(r, every * 1000));
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
    const open = openItems(anyOf(all)).map((it) => "  " + line(it, all));
    console.log(open.length ? open.join("\n") : "  (none)");
  } catch {
    console.log("  (gh unavailable or not authenticated)");
  }
  console.log(`\nWake another role: npm run alarm <role> <issue|pr #> "<reason>" ${role}`);
  console.log(`Picked up an alarm? npm run wake:ack ${role} <#>. Live session: npm run wake:watch ${role}`);
  console.log("Start in a task branch. Update agents/state/" + file + ".md minimally before stopping.");
} else {
  usage();
}
