# Decisions for the Owner

Only items that genuinely need Dr. Mohannad. Routine engineering choices are in `docs/adr/`.

## Open

### 1. Vercel: grant GitHub access for automatic previews
Status: project `learn-platform` is linked (team `aburomohs-projects`). Latest manual preview (main @ 57624e6: R1 redesign, M1.1 and M1.2 — see #110):
https://learn-platform-6ri4tafdc-aburomohs-projects.vercel.app (behind Vercel login; custom domain not attached).
Decision: `vercel git connect` is still refused after the repo went public (#72, retried 2026-10-03):
connecting needs the Vercel GitHub app installed with access to the repo, not just a visible repo.
Owner action: GitHub → Settings → Applications → Vercel → Configure → Repository access → add
`Aburomoh/Learn-platform` (or install the Vercel app from vercel.com → Add New → Project). Then the Release engineer runs `vercel git connect` and every PR gets a preview URL.
Until then: previews are deployed manually with `vercel deploy`.

### 2. Quick phone check (#153)
On your phone, type bits into a filled row (e.g. binary addition) and confirm every digit lands in the next cell. Fixed and tested; this is a real-device confirmation only.

### 3. Old commits still show your email (optional)
New commits use your GitHub private address. 39 earlier commits still show personal addresses; only a history rewrite removes them (force-push of `main`, every open branch rebased). Team recommendation: leave history as is unless you want it removed; say "rewrite history" and the Technical Lead will plan it.

## Resolved
- 2026-10-04 — Owner decisions (in Technical Lead session; quoted on #192):
  - Issue comments limited to collaborators (GitHub limit, renew every 6 months; Security tracks the date).
  - Topic preview keeps 53.
  - Each question gets three, sometimes four, variants (replaces "at least two"). Random numbers each time: later stage, curated (K-maps).
  - **Release bar:** production at learn.aburomoh.com only when ready to ship, with at least three courses. ECET 111 completing does not trigger a release; preview-only until then.
  - Tutor photos: the owner will supply them; placeholder until then.
  - Hide email: new commits use the GitHub private address.
- 2026-10-04 — Walkthrough of M1.1 + M1.2 + redesign: no explicit "accepted". The Director treated the owner's statement on #192 as the verdict and closed the milestones: "The current platform is developing very well, and the existing Number Conversion and Simple Logic Gates activities demonstrate the intended direction successfully." Tell the team if anything should be reopened.
- 2026-10-03 — Redesign proposal (epic #110, PR #129, `docs/design/redesign-r1/`): approved as the direction (owner, in Technical Lead session; quoted on #110). Frontend unblocked.
- 2026-10-03 — Branch protection (old item 4): owner chose Option B. The repo is public and `main` is protected (PR only, green CI, linear history); see #72. Never post secrets or slide content.
- 2026-10-03 — Pedagogy vetoes #42, #44, #45: accepted (owner, in Technical Lead session; quoted on #44). New rule: each step of a multi-step answer is its own goal, shown only after the previous one is done; be patient with students.
- 2026-10-03 — Session-start alarm hook in `.claude/settings.json` (PR #26): approved by owner, merged.
- 2026-10-03 — M1 walkthrough given: steps too large, circuit unclear → M1.1.
- 2026-10-03 — Repository `Aburomoh/Learn-platform`, private. (Owner created it.)
- 2026-10-03 — First demo topics: basic logic gates and number-system conversions.
