# Team V2 (owner-approved 2026-10-06; ADR-0010)

Five permanent roles, six on-demand specialists, and one non-LLM dispatcher. Git, issues and docs are
authoritative; conversation memory is secondary. State lives on the pinned **state board #519** (one
comment per role, edited in place). The Team V1 charters and state files are archived, read-only, in
`agents/retired/`.

## Responsibility matrix

| | Lead | Content Engineer | UI / Interaction Engineer | Independent Reviewer | Independent QA |
|---|---|---|---|---|---|
| **Slug / label** | `lead` / `wake:lead` | `content-engineer` / `wake:content` | `ui-engineer` / `wake:ui` | `code-architecture-reviewer` / `wake:reviewer` | `qa-test-engineer` / `wake:qa` |
| **Model class** | strongest reasoning | strong coding/general | strong coding (Fable on demand for major UX) | strongest reasoning | strong reasoning, reliable tool use |
| **Owns** | plan, priorities, task breakdown, coverage matrix, dependency order, merge authority, owner communication, architecture decisions, specialist invocation, team health | structured course content, grading and step logic, deterministic exercises and variants, tutor message catalog and nudges, content-pack ingestion into data | screens, interaction kinds' views, figures and diagrams, responsive layout, routine visual decisions, accessibility of UI, its own 390/1280 px renders | code and content correctness, architecture and fidelity, answer verification on PRs, routine pedagogy checklist, structured verdicts | manual browser checks of UI and behaviour changes, integration, regression e2e, chapter gates, final audits |
| **Does NOT own** | watching (the dispatcher does), QA, conflict resolution, DevOps work, writing content or UI | UI, merge, review | content data, grading logic, merge, review | merging, writing the change it reviews | routine content PRs, merging, writing fixes |
| **Inherits from V1** | Technical Lead, Product Manager, Director (and day-to-day DevOps decisions) | Backend / Data Engineer, AI Tutor Engineer | Frontend / Interaction Engineer, routine UX verdicts | Code / Architecture Reviewer, routine Pedagogy checks | QA / Test Engineer, Performance budget check in gates |

## Gates (per PR)
- **Reviewer: always** (the default gate). For routine content on tested kinds the Reviewer verifies every answer once and its approval is enough (plus green CI).
- **QA: by risk only**: new kinds, new or changed screens, behaviour changes, bug fixes, chapter gates, final audits. Never on routine content.
- **Pedagogy: only** for new learning behaviour, new scaffolding/explanation rules, or deviation from an approved pack. Called by the Lead.
- **No standing UX, Performance or Security gate.** The UI engineer posts renders; the bundle budget is checked in CI and at gates; Security and Performance are called by the Lead when a change touches their area.
- Answers are recomputed **once**: by the Reviewer on PRs, by QA at chapter gates (owner A2 for computed content), never both on the same PR.
- **Structured verdicts** (`Verdict: <Role> · <SHA> · Approved | Changes needed` + `Checks:`) on GitHub; a new push invalidates them where it changes what was checked.

## Old responsibility → new owner

| Team V1 responsibility | Team V2 owner |
|---|---|
| Technical Lead: architecture, merge, gates, recovery | Lead |
| Product Manager: tasks, READY labels, priorities, coverage matrix, gate scheduling | Lead |
| Director: plan approval, arbitration, owner reports | Lead (owner decides) |
| Backend: content data, grading, variants, schema | Content Engineer |
| AI Tutor: tutor messages, nudges, poses selection (POSE_GUIDE.md) | Content Engineer |
| Frontend: views, kinds UI, figures, stage, shell | UI / Interaction Engineer |
| UX: routine screen verdicts, renders | UI / Interaction Engineer (self-renders) |
| UX: design specs, visual systems, major redesign | UX (Fable), on demand via Lead |
| Pedagogy: per-PR approval | Reviewer checklist (routine) |
| Pedagogy: new learning behaviour, chapter sign-off | Pedagogy, on demand via Lead |
| Course Material Analyst: content packs, source ambiguities | on demand, per new course/chapter |
| Performance: budget, phone checks | CI budget + QA at gates; on demand for heavy features |
| Security: privacy, tokens, external services | on demand at releases and data/service changes |
| DevOps: previews, production, CI, wake tooling | Lead decides; DevOps on demand for infra changes |
| Per-role watchers and self-polling | one dispatcher (`scripts/dispatch.mjs`) |
| Per-role state files and state PRs | state board #519 (no PRs) |

## Operating rules
- **One dispatcher** (`npm run dispatch:start`, one per machine) polls GitHub; each permanent session runs only a passive listener on its own inbox (`node scripts/inbox.mjs <role>` as a background Bash command; it completes once per real wake and is started again after acting; no model turns while idle). On-demand wakes, stale wakes (over 30 min) and dispatcher errors go to the Lead's inbox. `npm run wake:health` shows everything.
- **No stacked branches.** Every PR is cut from `origin/main`; the next PR starts after the previous merges. Authors resolve their own conflicts.
- **No state-file PRs.** Update your comment on #519 instead.
- **One PR per coherent learning unit.**
- **Own checkout:** locally `../Learn_platform-<role>` (capital L); in the cloud, your own clone. Nobody but the Lead uses the local main checkout.
- **Cloud coordination:** GitHub and git only; never read another session's filesystem. One dispatcher per machine (each cloud machine starts its own), then one listener per permanent role. See `docs/CLOUD_BOOTSTRAP.md` (#550).
- **Worktree cleanup:** remove a `node_modules` junction/link itself before removing its worktree; never recursively delete through it. Install real dependencies with `npm ci` for builds.
- **QA:** test the PR merged with current `origin/main`, not the isolated head; green CI alone is not manual QA.
- **On-demand specialists** run only when the Lead starts them for a named task, with the prompt in `agents/SESSION_PROMPTS.md`; they post one verdict or deliverable, update nothing else, and end.
