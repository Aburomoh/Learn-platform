# Decisions for the Owner

Only items that genuinely need Dr. Mohannad. Routine engineering choices are in `docs/adr/`.

## Open

### 1. Vercel: grant GitHub access for automatic previews
Status: project `learn-platform` is linked (team `aburomohs-projects`). Latest manual preview (main incl. M1.1):
https://learn-platform-or0e54pc3-aburomohs-projects.vercel.app (behind Vercel login; custom domain not attached).
Decision: `vercel git connect` was refused because the Vercel GitHub app cannot see the private repo.
Owner action: GitHub → Settings → Applications → Vercel → Configure → Repository access → add
`Aburomoh/Learn-platform`. Then the Release engineer runs `vercel git connect` and every PR gets a preview URL.
Until then: previews are deployed manually with `vercel deploy`.

### 2. Production release of M1
Decision: whether the M1/M1.1 slice goes to `learn.aburomoh.com` once accepted.
Why it matters: mission rule — production while immature needs owner approval.
Team recommendation: keep preview-only until the owner has used the slice end to end.

### 3. Tutor avatar reference photographs
Decision: supply 2–3 reference photos (or decide to keep a neutral illustrated placeholder).
Why it matters: the expression library is built against placeholders until then.
Team recommendation: no urgency; placeholders are explicit and swappable.

### 4. Branch protection on `main`
Decision: GitHub refuses branch-protection rules on a private repo without GitHub Pro (HTTP 403).
Why it matters: today the "only the Technical Lead merges, CI must pass" rule is procedural, not enforced.
Option A: Keep the repo private and the rule procedural (current).
Option B: Make the repo public (demo content only) so protection rules become available.
Option C: GitHub Pro on the owner account (paid).
Team recommendation: A until real course content lands; revisit at M2.

### 5. Walk through M1.1
Decision: check that your 2026-10-03 feedback is fixed. Open the preview above (or `npm run dev`) → ECET 111 → Chapter 1.
Look at: (a) divide-by-2 is now checked one division at a time; (b) the circuit is redrawn with standard symbols and right-angle wires.
Best after the close-out lands (#32 circuit walk, plus any vetoes you accept in item 6); the team will ping you.
Why it matters: M2 (real course content) reuses these step sizes and diagrams.

### 6. Pedagogy vetoes on the conversion activity (#42, #44, #45)
Decision: accept or reject three vetoes filed against PR #25. Vetoes are advisory to you (docs/PEDAGOGY.md).
- #42 (High): after Explain Slowly the student can type back the answer just shown on the same numbers. Fix: retry on the other variant.
- #44: octal/hex still asks pad + group + convert in one answer. Fix: groups first, then one digit per group.
- #45: an octal question shows a hex message, rung 8 gives the full answer, two weak distractors.
Team recommendation: accept all three. Work waits for your answer. Reply "accept 42, 44, 45" or name the ones to drop.

## Resolved
- 2026-10-03 — Session-start alarm hook in `.claude/settings.json` (PR #26): approved by owner, merged.
- 2026-10-03 — M1 walkthrough given: steps too large, circuit unclear → M1.1.
- 2026-10-03 — Repository `Aburomoh/Learn-platform`, private. (Owner created it.)
- 2026-10-03 — First demo topics: basic logic gates and number-system conversions.
