#!/usr/bin/env node
// Regenerates docs/localization/ar/UNTRANSLATED.md: the supportive strings on this branch that have
// no Arabic yet (ADR-0011 §7). Information for the owner, not a gate: untranslated text falls back to
// English. The report needs the loaded course objects (TypeScript, path aliases), so it runs the
// vitest file that builds it with L10N_DRIFT_WRITE set. Usage: npm run l10n:drift
import { spawnSync } from "node:child_process";

const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["vitest", "run", "src/l10n/drift.test.ts", "--reporter=dot"], {
  stdio: "inherit",
  env: { ...process.env, L10N_DRIFT_WRITE: "1" },
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
