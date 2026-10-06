#!/usr/bin/env node
// Team V2 listener (ADR-0010): streams this role's inbox, written by the dispatcher. It makes no
// GitHub calls; run it in the Claude Code Monitor tool and re-arm it only when the Monitor expires.
//   node scripts/inbox.mjs <role>
// One listener per role (newest wins); exits when the parent session is gone or after 35 minutes.
// It touches <tmp>/cet-wake/inbox/<role>.seen every minute, which `npm run wake:health` reads.
import { existsSync, mkdirSync, openSync, readSync, statSync, writeFileSync, readFileSync, closeSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { ROLES, roleOf } from "./roles.mjs";

const role = roleOf(process.argv[2]);
if (!role || ROLES[role].onDemand) {
  console.error(`Usage: node scripts/inbox.mjs <lead|content-engineer|ui-engineer|code-architecture-reviewer|qa-test-engineer>`);
  process.exit(1);
}
const DIR = join(tmpdir(), "cet-wake", "inbox");
mkdirSync(DIR, { recursive: true });
const file = join(DIR, `${role}.log`);
const lock = join(DIR, `${role}.listener`);
writeFileSync(lock, String(process.pid));
if (!existsSync(file)) writeFileSync(file, "");

const cwd = process.cwd();
if (/learn_platform/i.test(cwd) && !/Learn_platform/.test(cwd)) console.log(`INBOX WARNING for ${role}: path casing "${cwd}"; use .../Claude/Learn_platform`);
if (role !== "lead" && /^learn_platform$/i.test(basename(cwd))) console.log(`INBOX WARNING for ${role}: running from the main checkout; work in ../Learn_platform-${role}`);

const parent = process.ppid;
const deadline = Date.now() + (Number(process.env.WAKE_MAX_MINUTES) || 35) * 60_000;
const parentAlive = () => {
  try {
    process.kill(parent, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
process.stdout.on("error", () => process.exit(0));
let pos = statSync(file).size; // only new lines; open items are listed by `npm run wake <role>` at startup
let beat = 0;
for (;;) {
  if (!parentAlive() || Date.now() > deadline || readFileSync(lock, "utf8") !== String(process.pid)) process.exit(0);
  const size = statSync(file).size;
  if (size > pos) {
    const fd = openSync(file, "r");
    const buf = Buffer.alloc(size - pos);
    readSync(fd, buf, 0, buf.length, pos);
    closeSync(fd);
    pos = size;
    for (const l of buf.toString("utf8").split("\n").filter(Boolean)) console.log(l);
  }
  if (Date.now() - beat > 60_000) {
    writeFileSync(join(DIR, `${role}.seen`), new Date().toISOString());
    beat = Date.now();
  }
  await new Promise((r) => setTimeout(r, 2000));
}
