# CET Interactive Learning Platform

An interactive course companion for CET courses: structured practice, interactive diagrams,
deterministic (rule-based) tutoring and adaptive scaffolding. Web-first, guest-first, low-cost.

Owner: Dr. Mohannad Abu-Romoh. Initial deployment target: `learn.aburomoh.com` (configurable in
`config/product.ts`; no branding is hard-coded in application logic).

> All academic material currently in the repository is **DEMO / NOT AUTHORITATIVE COURSE CONTENT**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck + lint + unit tests + build
npm run test:e2e   # Playwright smoke tests (needs `npx playwright install chromium` once)
```

## Where things are

| Path | What |
|------|------|
| `docs/` | Product vision, pedagogy, architecture, design system, tutor engine, learner model, privacy, cost rules |
| `docs/adr/` | Architecture Decision Records |
| `docs/MILESTONES.md` | Current milestone, acceptance criteria, short status |
| `docs/DECISIONS_FOR_OWNER.md` | Decisions waiting on the owner |
| `agents/` | Permanent role charters; `agents/state/` compact current state per role |
| `shared/` | Communication, review levels, wake protocol, owner-approval rules |
| `.claude/agents/` | Thin launchers that let each role be started by name in Claude Code |
| `scripts/wake.mjs` | `npm run wake <role>` prints what a role must read and its open items |
| `src/` | Application (see `docs/ARCHITECTURE.md` for the layer map) |

## Workflow

Protected `main`, one branch per task, PR per change, CI required, squash merge, Technical Lead
merges. See `shared/` and `.github/`.
