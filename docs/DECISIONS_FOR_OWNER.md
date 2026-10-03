# Decisions for the Owner

Only items that genuinely need Dr. Mohannad. Routine engineering choices are in `docs/adr/`.

## Open

### 1. Vercel: grant GitHub access for automatic previews
Status: project `learn-platform` is linked (team `aburomohs-projects`). Latest manual preview (main @ 5340f6a, the M1.1 close-out — see #107 for its contents):
https://learn-platform-5szbf25wz-aburomohs-projects.vercel.app (behind Vercel login; custom domain not attached).
Decision: `vercel git connect` is still refused after the repo went public (#72, retried 2026-10-03):
connecting needs the Vercel GitHub app installed with access to the repo, not just a visible repo.
Owner action: GitHub → Settings → Applications → Vercel → Configure → Repository access → add
`Aburomoh/Learn-platform` (or install the Vercel app from vercel.com → Add New → Project). Then the Release engineer runs `vercel git connect` and every PR gets a preview URL.
Until then: previews are deployed manually with `vercel deploy`.

### 2. Production release of M1
Decision: whether the M1/M1.1 slice goes to `learn.aburomoh.com` once accepted.
Why it matters: mission rule — production while immature needs owner approval.
Team recommendation: keep preview-only until the owner has used the slice end to end.

### 3. Tutor avatar reference photographs
Decision: supply 2–3 reference photos (or decide to keep a neutral illustrated placeholder).
Why it matters: the expression library is built against placeholders until then.
Team recommendation: no urgency; placeholders are explicit and swappable.

### 5. Walk through M1.1
Decision: check that your 2026-10-03 feedback is fixed. Open the preview above (or `npm run dev`) → ECET 111 → Chapter 1.
Look at: (a) divide-by-2 is now checked one division at a time; (b) the circuit is redrawn with standard symbols and right-angle wires.
Best after the close-out lands (#32 circuit walk, #42, #44, #45, phone fixes #52–#54); the team will ping you.
Why it matters: M2 (real course content) reuses these step sizes and diagrams.

### 6. Approve the student-experience redesign proposal (epic #110)
Decision: when UX posts the proposal (#113), approve it or send it back. Frontend (#114) starts only after you approve.
Why it matters: major UI redesign (shared/OWNER_APPROVAL.md); it sets identity, palette and layout for every course.
Status: not ready yet; the Technical Lead reviews it technically first, then the team brings it to you.

## Resolved
- 2026-10-03 — Branch protection (old item 4): owner chose Option B. The repo is public and `main` is protected (PR only, green CI, linear history); see #72. Never post secrets or slide content.
- 2026-10-03 — Pedagogy vetoes #42, #44, #45: accepted (owner, in Technical Lead session; quoted on #44). New rule: each step of a multi-step answer is its own goal, shown only after the previous one is done; be patient with students.
- 2026-10-03 — Session-start alarm hook in `.claude/settings.json` (PR #26): approved by owner, merged.
- 2026-10-03 — M1 walkthrough given: steps too large, circuit unclear → M1.1.
- 2026-10-03 — Repository `Aburomoh/Learn-platform`, private. (Owner created it.)
- 2026-10-03 — First demo topics: basic logic gates and number-system conversions.
