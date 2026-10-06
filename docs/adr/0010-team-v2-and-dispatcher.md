# 0010 — Team V2 and one dispatcher
Status: Accepted · Date: 2026-10-06 · Owner: Lead (owner decision after the ECET111 retrospective)

## Context
ECET111 ran on 14 permanent LLM sessions, each polling GitHub through its own 30-minute watcher. The
post-project review (2026-10-06) measured 23% of all token cost in idle watcher turns, six roles
mostly idle, the slowest gates in the weakest sessions (QA p90 108 min, Pedagogy p90 531 min), 48
state-file PRs, and 110 conflict/refresh wakes from stacked branches.

## Decision
1. **Five permanent roles:** Lead, Content Engineer, UI / Interaction Engineer, Independent Reviewer,
   Independent QA (`agents/TEAM_V2.md`). Pedagogy, UX (Fable), Material Analyst, Security, Performance
   and DevOps are on demand and run no permanent session.
2. **One non-LLM dispatcher** (`scripts/dispatch.mjs`) is the only process that polls GitHub. It
   writes each role's wakes to a local inbox; sessions stream it with `scripts/inbox.mjs` (no network).
   On-demand wakes, 30-minute stale wakes and dispatcher errors go to the Lead. Roles and labels live
   in `scripts/roles.mjs`; Team V1 names and labels map to their new owner.
3. **State board #519** replaces `agents/state/*.md`: one comment per role, edited in place.
4. **Gates:** Reviewer always; QA by risk; Pedagogy only for new learning behaviour. Merges wake
   nobody; a Reviewer approval no longer auto-wakes QA; workflows never remove another role's wake.

## Consequences
Fewer sessions and no per-session GitHub polling; a single place to see health (`npm run wake:health`).
The dispatcher is a single point of failure: if it stops, the Lead sees it in `wake:health`, and
session-start still lists open wakes (`npm run wake:pending`). Listeners run as background Bash commands that complete only when a real wake
arrives, so idle sessions take no model turns (a Monitor would expire every 30 minutes and cost a turn
each time; `--stream` remains as a fallback only).
