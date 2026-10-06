#!/usr/bin/env node
// Team V2 listener (ADR-0010): a passive local reader of this role's inbox, which only the dispatcher
// writes. It makes no GitHub calls and costs no model tokens while waiting.
//   node scripts/inbox.mjs <role>            DEFAULT: wait (no time limit) until new wakes arrive, print
//                                            them, and exit. Run it as a background Bash command: the
//                                            session is woken once per real event and re-launches it.
//   node scripts/inbox.mjs <role> --stream   fallback for the Monitor tool (exits after 35 min).
// A saved read position (<role>.cursor) means nothing is lost between runs. One listener per role
// (newest wins); it exits when its session's shell is gone. It touches <role>.seen every minute for
// `npm run wake:health`.
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { ROLES, roleOf } from "./roles.mjs";

const role = roleOf(process.argv[2]);
const stream = process.argv.includes("--stream");
if (!role || ROLES[role].onDemand) {
  console.error("Usage: node scripts/inbox.mjs <lead|content-engineer|ui-engineer|code-architecture-reviewer|qa-test-engineer> [--stream]");
  process.exit(1);
}
const DIR = join(tmpdir(), "cet-wake", "inbox");
mkdirSync(DIR, { recursive: true });
const file = join(DIR, `${role}.log`);
const cursor = join(DIR, `${role}.cursor`);
const lock = join(DIR, `${role}.listener`);
if (!existsSync(file)) writeFileSync(file, "");
writeFileSync(lock, String(process.pid));

const cwd = process.cwd();
if (/learn_platform/i.test(cwd) && !/Learn_platform/.test(cwd)) console.log(`INBOX WARNING for ${role}: path casing "${cwd}"; use .../Claude/Learn_platform`);
if (role !== "lead" && /^learn_platform$/i.test(basename(cwd))) console.log(`INBOX WARNING for ${role}: running from the main checkout; work in ../Learn_platform-${role}`);

const parent = process.ppid;
const deadline = stream ? Date.now() + (Number(process.env.WAKE_MAX_MINUTES) || 35) * 60_000 : Infinity;
const parentAlive = () => {
  try {
    process.kill(parent, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
process.stdout.on("error", () => process.exit(0));
// First run ever starts at the end (open items are listed by `npm run wake <role>` at startup).
let pos = existsSync(cursor) ? Math.min(Number(readFileSync(cursor, "utf8")) || 0, statSync(file).size) : statSync(file).size;
writeFileSync(cursor, String(pos));
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
    writeFileSync(cursor, String(pos));
    if (!stream) process.exit(0); // one notification per event; the session re-launches the listener
  }
  if (Date.now() - beat > 60_000) {
    writeFileSync(join(DIR, `${role}.seen`), new Date().toISOString());
    beat = Date.now();
  }
  await new Promise((r) => setTimeout(r, 2000));
}
