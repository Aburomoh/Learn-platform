# 0006 — Agent persistence and wake mechanism
Status: Accepted · Date: 2026-10-03 · Owner: Product / Engineering Director

## Context
The execution environment (Claude Code + GitHub) has no always-on agents. The mission requires
role continuity, idempotent wake triggers and repository-authoritative state.

## Decision
- Charters: `agents/<role>.md`. State: `agents/state/<role>.md` (current assignment, last
  decision, blocker, issue/PR, next action; nothing else).
- Launchers: `.claude/agents/<role>.md` with frontmatter so a role can be started by name; the
  body instructs the role to read charter, state, assigned issue/PR and linked ADRs first.
- Wake signals are GitHub labels. `.github/workflows/wake.yml` applies them idempotently:
  PR opened → `wake:reviewer`; review approved → `wake:qa`; QA label + green CI → `wake:tech-lead`;
  merged → `wake:product-manager`. Escalation labels `blocked:architecture`, `blocked:product`,
  `pedagogy-review`, `security-sensitive`, `performance-risk`, `release-ready` are applied by
  humans/agents. Re-running the workflow never duplicates a label or comment.
- `scripts/wake.mjs <role>` prints the role's charter, state and the open issues/PRs carrying
  its wake label, so a session can be started with exactly the right context.
- Amendment 2026-10-03 (#24): every role also has a direct alarm label `wake:<role>` that any agent
  may apply (`npm run alarm`). Sessions surface open alarms at start (SessionStart hook) and while
  live (`npm run wake:watch`); see `shared/WAKE_PROTOCOL.md`.

## Consequences
No server, no cron, no bot tokens beyond `GITHUB_TOKEN`. Activation still requires a session
to be started; the labels make "who should act" unambiguous.

## Alternatives considered
Scheduled cloud routines (cost and noise before the product exists). Chat-based orchestration
(not durable; repository state would stop being authoritative).
