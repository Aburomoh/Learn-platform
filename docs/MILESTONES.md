# Milestones

## M0 — Organisation (done 2026-10-03)
Repository, charters, state files, shared protocols, docs, ADRs 0001–0006, CI, PR/issue
templates, wake workflow, `.claude/agents` launchers, Next.js scaffold.

## M1 — First vertical slice (current)

**Product Manager proposal.** One demo course "Digital Logic Fundamentals (DEMO)" with two
topics chosen by the owner: Number Systems and Logic Gates. Activity 1 (decimal → binary with
place-value drag) receives the full slice; Activity 2 (predict a small circuit's output) reuses
the same engine and components. Floating-point conversion, base-grouping drills and further
circuits are backlog.

**Director review.** Approved. Conditions: no server or AI calls; content clearly marked DEMO;
components documented as an internal product; pedagogy review on content, engine and runner PRs;
no production release without owner approval.

**Acceptance (mission §38).** A student can open one activity as a guest, attempt a meaningful
question, interact with the stage (drag, click diagram), receive short rule-based guidance with
an expression change and a focus/highlight action, request a hint, request Explain Slowly, retry,
complete the activity, and see progress survive a reload, on desktop and mobile widths, with
zero network requests after load.

**Tasks.** GitHub issues labelled `milestone:M1` (see `scripts/wake.mjs product-manager`).

## Status log (newest first)
- 2026-10-03 — M0 complete; M1 tasks created; implementation started.
