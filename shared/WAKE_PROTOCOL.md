# Wake / Trigger Protocol (Team V2, ADR-0010)

Wake operations are idempotent. Labels on issues/PRs are the durable queue.

## Normal flow
TASK READY → Content Engineer (`wake:content`) or UI / Interaction Engineer (`wake:ui`), assigned by the Lead
PR OPENED or READY FOR REVIEW → Independent Reviewer (`wake:reviewer`, automatic)
REVIEWER VERDICT → "Ready to merge" → Lead (`wake:lead`) · "Ready for QA" → QA (`wake:qa`) · "Changes needed" → author
QA PASSED (`qa:passed`) → Lead (automatic) → merge
MERGED → nobody (the Lead merged it; the Lead updates coverage)

## Escalation (all reach the Lead)
`blocked`, `blocked:architecture`, `blocked:product`, `owner-decision`, and every on-demand label:
`wake:pedagogy`, `wake:ux`, `wake:material`, `wake:security`, `wake:performance`, `wake:devops`
(plus `pedagogy-review`, `security-sensitive`, `performance-risk`, `release-ready`). The Lead decides
whether to start that specialist for the named task.

## Mechanism
- **Dispatcher** (`scripts/dispatch.mjs`, one per machine, `npm run dispatch:start`): the only process that polls GitHub (every 60 s). It appends each new or updated wake to `<tmp>/cet-wake/inbox/<role>.log`, sends on-demand wakes, 30-minute stale wakes and its own errors to the Lead's inbox, and writes `<tmp>/cet-wake/status.json`.
- **Listener** (`node scripts/inbox.mjs <role>`): each permanent session runs it as a background Bash command. It waits with no time limit and no network calls, completes once when new wakes arrive (a saved read position means nothing is lost), and the session starts it again after acting. No model turns while idle. Newest listener per role wins; it exits with its session. `--stream` is a Monitor fallback only.
- **Health:** `npm run wake:health`: dispatcher status, each listener, each role's open wakes and their age.
- **Session start:** the SessionStart hook prints open wakes (`npm run wake:pending`).
- **Commands:** `npm run alarm <role> <#> "<done> / <needed>" <your-role>` (adds only that role's label, never removes another's), `npm run wake:ack <role> <#…>`, `npm run wake <role>`. Short names and retired Team V1 names map to their Team V2 owner (`scripts/roles.mjs`).
- `node scripts/wake.mjs --watch` is retired.

## Reliability
One session per permanent role; no stand-ins. A wake unacknowledged for 30 minutes reaches the Lead as
a STALE line: the Lead diagnoses and recovers that same role, and asks the owner only for manual action.
