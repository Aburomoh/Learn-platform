# Current State — QA / Test Engineer

Current assignment: QA on wake:qa alarms. Kinds queue (2026-10-04, round 2 on main b411eb3): #323 expression passed (edb88a9), #324 derivation passed (66cf8e3), #328 bit-grouping reverse/point passed, logic half (0026dce), #331 truth-table tutor messages passed (1ffcfd8). #332 base-to-decimal messages not QA'd: no Reviewer approval yet (Reviewer alarmed; stacked on #331).
Recent important decision: QA every PR merged into origin/main (not the head alone); low memory: no local `next build`/Playwright, CI is authoritative for build/e2e. Kind PRs: random cases checked against my own throwaway evaluator; tutor PRs: random wrong submissions through the runner reducer, no missing/unfilled/generic lines.
Blocker: none. Use a private `npm ci --ignore-scripts` in the worktree (about 2 min), never a junction.
Relevant issue/PR: follow-ups (Backend alarmed): #324 spec does not enforce authored-line equivalence; #328 lacks the Reviewer's temporary to-bits/point content guard, and `bits` allows leading zeros. #323: no `en` messages for `expression-*` nudges yet; `maxLength` nit open. #268, #271, #273 still with Backend.
Next expected action: QA #332 once the Reviewer approves (check every base-to-decimal step tag/detector has an `en` line, no reveal); re-check #324/#328 follow-ups when pushed.
