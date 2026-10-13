# 0012 — Educational Integrity & Learner Experience Auditor
Status: Accepted · Date: 2026-10-13 · Owner: Lead (owner decision on epic #684; amends ADR-0010)

## Context
ADR-0010 left no role that judges the shipped learning experience as a whole: the Reviewer gates one
PR for correctness, QA checks behaviour by risk, and Pedagogy is called once per rule or chapter. The
owner's directive on epic #684 asks for a permanent auditor that inspects what actually shipped from
the student's point of view, and (2026-10-13) that it also offer Arabic translations for untranslated
pieces and corrections to existing ones.

## Decision
1. **A sixth permanent role:** `educational-auditor` / `wake:auditor` (short name `auditor`),
   strongest reasoning, charter `agents/educational_auditor.md`, prompt in `agents/SESSION_PROMPTS.md`.
   It runs a listener like the other permanent roles and works read-only in its own worktree. It
   audits both unreleased work (open PRs, previews, main), where it steers early, and the live site,
   where it audits the final result, alternating between them when idle.
2. **Audit-only lane:** it finds and names one owner role per finding; it never writes code or
   content, opens PRs, merges, re-reviews correctness or re-runs regression QA.
3. **Findings** are issues labelled `audit` + `audit:critical|major|minor`. They **never block
   merges or releases.** A CRITICAL EDUCATIONAL RISK needs a prompt Lead response on the issue
   (`Accept-fix | Scheduled | Waived`); the Lead lists open CRITICAL findings, with their responses,
   in the owner's release note.
4. **Translation offers** are proposals on #686 (navigation strings on #676), following the
   `docs/localization/ar` glossary and rules. Content batches them; only owner-approved Arabic ships.
5. **Wake plumbing:** `scripts/roles.mjs` lists the role; `audit:critical` is one of the Lead's
   labels, so the dispatcher also delivers each CRITICAL finding to the Lead's inbox.

## Consequences
- One more permanent session (token cost while auditing; none while idle, ADR-0010 listener).
- The Lead gains an obligation to answer CRITICAL findings promptly and report open ones in release
  notes (`agents/lead.md`); release candidates get a learner-POV pass.
- An open `audit:critical` issue stays in `npm run wake lead` and redelivers on each update until it
  is closed or the label is removed, like the existing `blocked` labels.
- The dispatcher must be restarted once to pick up the new role.

## Alternatives considered
- Extend Pedagogy (on demand): it ends after each decision, so nobody would watch over time.
- Extend the Reviewer: per-PR scope cannot see cross-PR or production learning effects.
