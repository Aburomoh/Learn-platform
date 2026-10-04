# Current State — QA / Test Engineer

Current assignment: QA on wake:qa alarms. #260 (kind registry, ADR-0008 part 1) passed; queue from Technical Lead: #257 → #268, then #271, #273, #272.
Recent important decision: QA every PR merged into origin/main (not the head alone); seed localStorage with addInitScript before load; per-worktree `PW_PORT`, `CI=1`. Per kind: retry-remount test + grading parity against main's `grade`.
Blocker: Main checkout `node_modules` is a partial install (no react/typescript/.bin); junction worktrees to `Learn_platform-qa-test-engineer/node_modules` (same lockfile) instead.
Relevant issue/PR: #260 (added `src/stage/circuitRemount.test.tsx`); guest-flow network assert seen failing twice under load, URL never captured.
Next expected action: #257; pointer-drag e2e once a shipped activity uses DragToTarget; keep the 320 px no-overflow check on every new page.
