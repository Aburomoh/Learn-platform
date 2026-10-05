# Wake / Trigger Protocol

Wake operations must be idempotent.

## Normal Flow
TASK READY → responsible engineer  
PR OPENED → Code / Architecture Reviewer  
REVIEW APPROVED → QA / Test Engineer  
QA PASSED → Technical Lead  
MERGED → Product Manager

## Escalation
BLOCKED:ARCHITECTURE → Technical Lead  
BLOCKED:PRODUCT → Product Manager  
PEDAGOGY_REVIEW → Educational / Pedagogy Engineer  
SECURITY_SENSITIVE → Security / Privacy Engineer  
PERFORMANCE_RISK → Performance / Stress Engineer  
RELEASE_READY → Release / DevOps Engineer

## Mechanism
GitHub labels applied idempotently by `.github/workflows/wake.yml` (ADR-0006): `wake:reviewer`, `wake:qa`, `wake:tech-lead`, `wake:product-manager`. Escalation labels are applied manually: `blocked:architecture`, `blocked:product`, `pedagogy-review`, `security-sensitive`, `performance-risk`, `release-ready`. QA marks a PR `qa:passed`; once CI is green the workflow wakes the Technical Lead. `npm run wake <role>` shows a role its open items.

## Direct Alarm (any agent → any role)
Every role has one alarm label: `wake:director`, `wake:product-manager`, `wake:pedagogy`, `wake:ux`, `wake:tech-lead`, `wake:frontend`, `wake:backend`, `wake:tutor`, `wake:reviewer`, `wake:qa`, `wake:security`, `wake:performance`, `wake:devops`.
- Wake a role: `npm run alarm <role> <issue|pr #> "<reason>" <your-role>` — adds the label and one `WAKE → <Role>` comment; safe to repeat.
- Be woken: every Claude Code session prints all open alarms at start (`.claude/settings.json` hook). A live session keeps exactly one `node scripts/wake.mjs --watch <role>` streaming (Claude Code: Monitor tool; re-arm **only on expiry**, never on a wake event; never through `npm run`, which leaks watchers); each output line is an alarm. Starting a new watcher stops the role's older one.
- Picked it up: `npm run wake:ack <role> <#>`. An alarm stays open until its role acknowledges it.
- Urgent and the role has a live session: also message the session named after the role title (`SendMessage`). The label is still required — messages are not durable.
- One session holds one role. Before claiming a role, check no live session is already named after it.

## Reliability
Triggers should be implemented by scripts/hooks/actions supported by the execution environment. Re-running the same trigger must not create duplicate competing assignments.
