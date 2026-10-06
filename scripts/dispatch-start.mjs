#!/usr/bin/env node
// Starts the Team V2 dispatcher detached from the calling shell, so it survives the session that
// started it (one per machine; scripts/dispatch.mjs exits at once if another is already running).
import { spawn } from "node:child_process";
const child = spawn(process.execPath, ["scripts/dispatch.mjs"], { detached: true, stdio: "ignore", windowsHide: true });
child.unref();
console.log(`dispatcher starting (pid ${child.pid}); check with npm run wake:health in about a minute`);
