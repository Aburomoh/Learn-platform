# Current State — QA / Test Engineer

Current assignment: QA on wake:qa alarms. Kinds queue (2026-10-04): #321 passed (merged), #322 passed on a627f59 (now conflicts; TL resolving), #325 passed; #323, #324 conflict with main after #321 (Frontend alarmed, not QA'd yet).
Recent important decision: QA every PR merged into origin/main (not the head alone); low memory: no local `next build`/Playwright, CI is authoritative for build/e2e. Kind PRs: random cases checked against my own throwaway evaluator; grading parity checked by recording on main and comparing on the merge.
Blocker: none. Main `node_modules` was wiped by a worktree removal that followed a junction (TL reinstalling). Prefer a private `npm ci --ignore-scripts` in the worktree; if you use a junction, remove it with `cmd /c rmdir node_modules` before the worktree goes.
Relevant issue/PR: #322 follow-up: `wrongCells.count` never reaches the student (needs runner -> tutor vars like `wrongBitNumber`) before the first C2 table ships. #268, #271, #273 still with Backend.
Next expected action: re-run tsc/lint/unit on new heads of #322; full QA of #323 (meaning-based grading, lowercase per #261, not-simplified, 201-char/deep-nesting limits) and #324 (two goals per line, wrong-line vs skipped, structure-graded order-insensitive) once they merge main.
