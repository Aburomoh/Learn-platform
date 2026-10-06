# CET Interactive Learning Platform — Agent Team

This directory defines the AI development organization: **Team V2** (owner, 2026-10-06; `agents/TEAM_V2.md`, ADR-0010).

## Authority
Owner: Dr. Mohannad Abu-Romoh  
Below owner and merge authority: Lead

## Operating Principle
Agent memory is useful context. Repository artifacts are authoritative context.

## Startup Sequence for Any Agent
1. Read `/agents/TEAM_V2.md`, then your charter in `/agents/`.
2. Read your comment on the state board, issue #519.
3. Read the assigned issue/PR.
4. Read only the linked ADRs/docs needed for the task (`npm run wake <role>` lists them).
5. Work in a task branch.
6. Keep comments and PRs concise.
7. Edit your comment on #519 before stopping (no state-file PRs).

## Team (V2)
Permanent: Lead · Content Engineer · UI / Interaction Engineer · Independent Reviewer · Independent QA.
On demand (started by the Lead for one task): Pedagogy · UX (Fable) · Material Analyst · Security · Performance · DevOps.
Retired Team V1 charters and state: `/agents/retired/` (read-only history).

## Shared References
Read `/shared/COMMUNICATION.md`, `/shared/WAKE_PROTOCOL.md`, `/shared/REVIEW_LEVELS.md`, `/shared/OWNER_APPROVAL.md` and `/shared/CONTEXT_REFRESH.md`.
Architecture decisions: `/docs/adr/`. Milestones: `/docs/MILESTONES.md`. Wake mechanism: ADR-0006 and ADR-0010: one dispatcher (`scripts/dispatch.mjs`), per-role inbox listener (`scripts/inbox.mjs`), `scripts/wake.mjs`, `.github/workflows/wake.yml`.
Launchers for each role live in `/.claude/agents/` (Claude Code subagents).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
