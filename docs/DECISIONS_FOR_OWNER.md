# Decisions for the Owner

Only items that genuinely need Dr. Mohannad. Routine engineering choices are in `docs/adr/`.
Development does not wait on any item below; content that depends on an unconfirmed answer waits on its own.

## Open
None. New items appear here only under the escalation policy below.

## Escalation policy (owner, 2026-10-04)
Do not escalate deterministic, computable answers (Boolean, conversions, state tables, timing and similar) when the source question is unambiguous. Compute them independently, have QA or the Reviewer verify them, and proceed when the two agree. Escalate only if the source is ambiguous or contradictory, several interpretations are defensible, the answer changes what students are expected to learn, or independent verification disagrees. Cosmetic slide slips need no decision; they are kept in `docs/content-packs/ecet111/errata.md`.

## Non-blocking owner checks
- Phone check (#153): type bits into a filled row on a real phone and confirm each digit lands in the next cell. Development and merges do not wait for it.

## Wake system revision (owner, 2026-10-05, retrospective #483)
Approved: Phases 0–2, delivered by DevOps one reviewed PR at a time, without disrupting ECET111. Adjustments:
- **No stand-ins:** recover the permanent role.
- **30-minute rule:** an unacknowledged wake after about 30 minutes triggers a TL health/recovery check; the owner is involved only if manual intervention is needed.
- **Wake labels:** an alarm never removes other roles' valid wakes; de-duplicate only the same role's duplicate wake for the same item and commit.
- **Stacked PRs:** after a predecessor merges, the author refreshes, rebases or retargets onto current main and resolves conflicts through the normal PR process.
- **Structured verdicts:** each states Role, commit SHA, Approved or Changes needed, and the checks performed. A new push invalidates the previous approval where relevant.
- **Health:** lightweight, with no per-role heartbeat traffic or processes. The long-term target is one central dispatcher/health monitor.
- **Shared-watcher pilot:** PM, Reviewer and QA. Measure missed, duplicate and stale wakes, GitHub API calls, background process count, and recovery after restart/outage. After Phase 2, report before/after and recommend.
- **Identity:** implement role/path/worktree validation now; defer bot accounts and tokens.

## Team V2 (owner, 2026-10-06, after the post-project review)
Approved: five permanent roles (Lead = Technical Lead + Product Manager + Director; Content Engineer =
Backend + AI Tutor; UI / Interaction Engineer = Frontend + routine UX; Independent Reviewer; Independent
QA) and six on-demand specialists (Pedagogy, UX (Fable), Material Analyst, Security, Performance,
DevOps) without permanent polling sessions. One non-LLM dispatcher replaces per-agent polling; no
stacked branches; no state-file PRs (state board #519); Reviewer is the default gate; QA is risk-based;
specialists only when needed. Conditions: transfer open ownership before retiring any session; a fresh
Lead session after the migration; live handoff tests (Content → Reviewer → Lead, and UI → Reviewer → QA
→ Lead) before old sessions are retired. Implemented in #521 (`agents/TEAM_V2.md`, ADR-0010).

## Resolved
- 2026-10-05 — Pipeline fragmentation (owner, Technical Lead session): one PR per coherent learning unit; Pedagogy reviews upstream (new behaviour, scaffolding rules, new kinds, deviations from approved packs), not every faithful implementation; QA by risk (new kinds, major screens, behaviour changes, fixes, chapter integration), with routine content on tested kinds merging on Reviewer (answers verified independently) + CI; Vercel previews only for app-affecting changes, label-triggered if still near the Hobby limit (no plan upgrade); owner preview refreshed after milestones; P0 work first. Recorded in `agents/SESSION_PROMPTS.md` (#444).
- 2026-10-04 — Answer confirmations and slide notes (owner, quoted on #192):
  - **A1** Ch.4 s.56: confirmed. F(w,x,y,z) = Σ(1,2,5,11,13), selects x,y,z, data w: I0…I7 = 0, w′, w′, w, 0, 1, 0, 0.
  - **A2** Ch.5 computed answers: approved, provided QA verifies each one independently and timing and state exercises state their initial state (000 where needed).
  - **S1** Ch.5 II: practise the solved circuit (s.16–23); the posed circuit (s.14–15) is not used for now.
  - **S2** Ch.5 III s.34: follow s.28–29, so 011 → 110 on input 1 / output 0; the 011 → 000 arrow is a slide error.
  - **S3** Ch.5 I timing: platform-made shorter exercises with the initial Q stated and no input changing on an active edge.
  - **S4** Ch.1 s.20: the title is wrong; the exercise is octal → binary, (166)₈ = 001 110 110₂ = 1110110₂.
  - **S5** Ch.2 p.64: the first term is A′B′C′, so F = Σ(0,3,5,7).
  - **Vercel:** GitHub connected by the owner; `vercel.json` stops deploys from `main` (#396); PR previews continue.
- 2026-10-04 — Owner decisions (Technical Lead session):
  - **Vercel previews:** approved; the owner grants the Vercel GitHub app selected-repository access to `Aburomoh/Learn-platform`, then Release/DevOps runs `vercel git connect` for automatic PR previews. Manual `vercel deploy` previews until then; never `--prod`.
  - **Phone check #153:** non-blocking real-device item (above).
  - **Old commit email addresses:** leave history as-is; no history rewrite or force-push of `main`.
  - **M1.1 / M1.2 / redesign R1:** explicitly accepted as the current direction; reopen only for a regression or a concrete problem.
  - **Tutor images:** supplied. Pose library at `C:\Users\mnabu\OneDrive\Documents\Claude\Learn_platform\MyPics\tutor-pose-library` (expressive extension in `\expressive`); integration in #355 and #378. Only processed images are committed.
  - **Source materials:** ECET 111 materials at `C:\Users\mnabu\OneDrive\Documents\Claude\Learn_platform\ECET111 materials`, syllabus `…\ECET111 materials\ECET111- Syllabus-Fall2026.pdf` (git-ignored; never committed or uploaded).
  - **Release policy unchanged:** preview-only; ECET 111 completing does not trigger production; production when ready and with at least three courses.
  - **Chapter 3 K-map answers:** the machine-worked answers in `ch3.md` are confirmed (quoted on #192).
- 2026-10-04 — Owner decisions (quoted on #192): issue comments limited to collaborators (renew every 6 months, #256); topic preview keeps 53; three, sometimes four, number sets per question (random numbers later, curated); commits use the GitHub private address.
- 2026-10-04 — Restart procedure adopted: `agents/SESSION_PROMPTS.md` (#368); dispatcher-style wake mechanism under investigation (#374); syllabus week hints (#376).
- 2026-10-03 — Redesign proposal (epic #110, PR #129, `docs/design/redesign-r1/`): approved as the direction. Frontend unblocked.
- 2026-10-03 — Repository: **public**, with `main` protected (PR only, green CI, linear history); see #72. Never post secrets or slide content. (Created private by the owner on 2026-10-03, made public the same day.)
- 2026-10-03 — Pedagogy vetoes #42, #44, #45 accepted; rule: each step of a multi-step answer is its own goal, one at a time; be patient with students.
- 2026-10-03 — Session-start alarm hook in `.claude/settings.json` (PR #26): approved, merged.
- 2026-10-03 — M1 walkthrough given: steps too large, circuit unclear → M1.1.
- 2026-10-03 — First demo topics: basic logic gates and number-system conversions.
