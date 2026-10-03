# Decisions for the Owner

Only items that genuinely need Dr. Mohannad. Routine engineering choices are in `docs/adr/`.

## Open

### 1. Vercel project and preview deployments
Decision: connect `Aburomoh/Learn-platform` to a Vercel project (Hobby) so every PR gets a preview URL.
Why it matters: the team cannot inspect PRs in a real browser URL until this exists.
Option A: Owner imports the repo in the Vercel dashboard (Add New → Project → GitHub) and keeps defaults.
Option B: Owner installs the CLI (`npm i -g vercel`, `vercel login`) and the Release engineer links it.
Team recommendation: A. No production domain yet; `learn.aburomoh.com` is attached only after a release decision.

### 2. Production release of M1
Decision: whether the M1 slice goes to `learn.aburomoh.com` once accepted.
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

### 5. Walk through M1
Decision: the first vertical slice is complete on `main`. Try both demo activities (run `npm run dev`, or ask for a preview URL after decision 1) and tell the team what feels wrong.
Why it matters: the next milestone (real content) builds on these interaction patterns.

## Resolved
- 2026-10-03 — Repository `Aburomoh/Learn-platform`, private. (Owner created it.)
- 2026-10-03 — First demo topics: basic logic gates and number-system conversions.
