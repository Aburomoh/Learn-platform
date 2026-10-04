# Current State — QA / Test Engineer

Current assignment: QA on wake:qa alarms. TL queue done: #257 passed (merged), #268 passed (conflicts after #257: re-run unit on new head), #271 content pass, label held (needs merge main + #213 first), #273 failed ('Name the law' answer always first), #272 passed.
Recent important decision: QA every PR merged into origin/main (not the head alone); low memory: no local `next build`/Playwright, CI is authoritative for build/e2e. Content PRs: recompute every number set; Boolean content via `equivalent`.
Blocker: none. Main checkout `node_modules` is complete again; junction via Node `fs.symlinkSync(target, 'node_modules', 'junction')` (cmd/powershell mklink is refused in isolated worktrees).
Relevant issue/PR: #268, #271, #273 back with Backend; guest-flow network assert seen failing twice under load, URL never captured.
Next expected action: re-QA #268/#271/#273 on new heads; pointer-drag e2e once a shipped activity uses DragToTarget; keep the 320 px no-overflow check on every new page.
