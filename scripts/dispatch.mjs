#!/usr/bin/env node
// Team V2 dispatcher (ADR-0010): the only process that polls GitHub for wakes. It writes each new or
// updated wake as one line into that role's local inbox file; sessions stream their inbox
// (scripts/inbox.mjs) instead of polling GitHub themselves.
//   node scripts/dispatch.mjs            run in the foreground (one instance per machine, lock-protected)
//   npm run dispatch:start               start it detached (Windows: hidden window) and return
// Files live in <tmp>/cet-wake/: inbox/<role>.log, dispatch.pid, dispatch-seen.json, status.json.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ROLES, labelRole } from "./roles.mjs";

const DIR = join(tmpdir(), "cet-wake");
const INBOX = join(DIR, "inbox");
mkdirSync(INBOX, { recursive: true });
const every = (Number(process.env.DISPATCH_SECONDS) || 60) * 1000;
const staleMinutes = Number(process.env.DISPATCH_STALE_MINUTES) || 30;

// One dispatcher per machine: if the pid in the lock file is alive, exit.
const LOCK = join(DIR, "dispatch.pid");
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
if (existsSync(LOCK)) {
  const other = Number(readFileSync(LOCK, "utf8"));
  if (other && other !== process.pid && alive(other)) {
    console.log(`dispatcher already running (pid ${other})`);
    process.exit(0);
  }
}
writeFileSync(LOCK, String(process.pid));

const gh = (...args) => execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000, windowsHide: true });
const labels = Object.values(ROLES).flatMap((r) => [r.alarm, ...r.labels]).filter((l) => l !== "ready");
const SEEN = join(DIR, "dispatch-seen.json");
const seen = new Map(existsSync(SEEN) ? Object.entries(JSON.parse(readFileSync(SEEN, "utf8"))) : []);
const escalated = new Set([...seen].filter(([, v]) => v.escalated).map(([k]) => k)); // survives restarts
// Inboxes are not trimmed: listeners keep a byte cursor, and a few KB a day needs no rotation.
const deliver = (role, line) => appendFileSync(join(INBOX, `${role}.log`), `${new Date().toISOString().slice(11, 16)}Z ${line}\n`);

function poll() {
  const search = "label:" + labels.map((l) => `"${l}"`).join(",");
  const items = [];
  for (const kind of ["issue", "pr"]) {
    items.push(...JSON.parse(gh(kind, "list", "--state", "open", "--search", search, "--json", "number,title,url,updatedAt,labels", "--limit", "100") || "[]"));
  }
  const status = {};
  const now = Date.now();
  for (const it of items) {
    for (const l of it.labels.map((x) => x.name).filter((n) => labels.includes(n))) {
      const role = labelRole(l);
      if (!role) continue;
      const key = `${role}#${it.number}`;
      const prev = seen.get(key);
      if (!prev || prev.updatedAt !== it.updatedAt) {
        // On-demand specialists have no permanent session: their wakes go to the Lead, who decides
        // whether to start that specialist.
        const target = ROLES[role].onDemand ? "lead" : role;
        const tag = ROLES[role].onDemand ? `SPECIALIST ${ROLES[role].title} needed` : `WAKE ${role}`;
        deliver(target, `${tag} ${prev ? "(updated) " : ""}[${l}] #${it.number} ${it.title}  ${it.url}`);
        seen.set(key, { updatedAt: it.updatedAt, since: prev?.since ?? now, escalated: prev?.escalated });
      }
      const age = Math.round((now - (seen.get(key).since ?? now)) / 60000);
      (status[role] ??= []).push({ number: it.number, label: l, ageMinutes: age });
      // 30-minute rule (owner, 2026-10-05): an unacknowledged wake starts a Lead health check.
      if (age >= staleMinutes && !ROLES[role].onDemand && role !== "lead" && !escalated.has(key)) {
        escalated.add(key);
        seen.get(key).escalated = true;
        deliver("lead", `STALE ${role} #${it.number} unacknowledged for ${age} min: run the health check`);
      }
    }
  }
  // Forget acknowledged wakes, so a later re-wake is delivered again.
  const open = new Set(Object.entries(status).flatMap(([r, xs]) => xs.map((x) => `${r}#${x.number}`)));
  for (const k of [...seen.keys()]) if (!open.has(k)) { seen.delete(k); escalated.delete(k); }
  writeFileSync(SEEN, JSON.stringify(Object.fromEntries(seen)));
  writeFileSync(join(DIR, "status.json"), JSON.stringify({ lastPoll: new Date().toISOString(), pid: process.pid, open: status }, null, 1));
}

let failures = 0;
for (;;) {
  if (Number(readFileSync(LOCK, "utf8")) !== process.pid) process.exit(0); // replaced by a newer dispatcher
  try {
    poll();
    if (failures >= 3) deliver("lead", "DISPATCH RECOVERED: GitHub reachable again");
    failures = 0;
  } catch (e) {
    const cause = String(e.stderr || e.message).trim().split("\n")[0];
    if (++failures === 3) deliver("lead", `DISPATCH ERROR: 3 polls failed (${cause})`);
  }
  await new Promise((r) => setTimeout(r, every));
}
