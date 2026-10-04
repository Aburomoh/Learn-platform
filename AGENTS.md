# CET Interactive Learning Platform — Agent Team

This directory defines the permanent AI development organization.

## Authority
Owner: Dr. Mohannad Abu-Romoh  
Below owner: Product / Engineering Director  
Technical merge authority: Technical Lead

## Operating Principle
Agent memory is useful context. Repository artifacts are authoritative context.

## Startup Sequence for Any Agent
1. Read your file in `/agents/`.
2. Read your matching `/agents/state/` file.
3. Read the assigned issue/PR.
4. Read only the linked ADRs/docs needed for the task (`npm run wake <role>` lists them).
5. Work in a task branch.
6. Keep comments and PRs concise.
7. Update your state file minimally before stopping.

## Team
- Product / Engineering Director
- Product Manager
- Course Material Analyst
- Educational / Pedagogy Engineer
- UX / Design Engineer
- Technical Lead
- Frontend / Interaction Engineer
- Backend / Data Engineer
- AI Tutor Engineer
- Code / Architecture Reviewer
- QA / Test Engineer
- Security / Privacy Engineer
- Performance / Stress Engineer
- Release / DevOps Engineer

## Shared References
Read `/shared/COMMUNICATION.md`, `/shared/WAKE_PROTOCOL.md`, `/shared/REVIEW_LEVELS.md`, `/shared/OWNER_APPROVAL.md` and `/shared/CONTEXT_REFRESH.md`.
Architecture decisions: `/docs/adr/`. Milestones: `/docs/MILESTONES.md`. Wake mechanism: ADR-0006, `scripts/wake.mjs`, `.github/workflows/wake.yml`.
Launchers for each role live in `/.claude/agents/` (Claude Code subagents).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
