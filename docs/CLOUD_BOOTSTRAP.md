# Cloud bootstrap (Team V2, #550)

How a role session starts on a fresh machine (a cloud session or a new laptop). Coordination is GitHub
only: labels, PRs, verdict comments, state board #519, epic #528 and git. No role reads another
session's filesystem. Timings are from the #550 fresh-clone test (Windows 11, warm npm cache).

## 1. Clone and install
```bash
git clone https://github.com/Aburomoh/Learn-platform.git && cd Learn-platform   # ~5 s
git config core.hooksPath .githooks          # pre-push typecheck + lint
npm ci                                       # ~70 s; Node 24 (.nvmrc), engines >= 22
```
Every session works in its own clone (or, locally, its own worktree `../Learn_platform-<slug>`).

## 2. Checks
```bash
npm run typecheck                            # ~12 s
npm run lint                                 # ~TBD
npm run test                                 # ~TBD (vitest)
npm run build                                # ~TBD (static export to out/)
npx playwright install --with-deps chromium  # once per machine; drop --with-deps if not root
PW_PORT=4391 CI=1 npm run test:e2e           # ~TBD; needs out/ from the build
```
Use `npm ci` in every checkout that builds: Turbopack rejects a symlinked `node_modules`.

## 3. GitHub access
`gh` must be installed and authenticated: `gh auth login`, or set `GH_TOKEN` (fine-grained token on
`Aburomoh/Learn-platform` with Issues and Pull requests read/write, Contents read/write). `gh auth status` must
pass before any wake command. Commit only with the repo identity (GitHub noreply address).

## 4. Dispatcher and listener (one dispatcher per machine)
A cloud session is its own machine: start its own dispatcher, then its listener as a background Bash command.
```bash
export DISPATCH_ROLES=<slug>                 # optional: write only this role's inbox (lead: add `lead`)
npm run dispatch:start && npm run wake:health
DISPATCH_ROLES=<slug> node scripts/inbox.mjs <slug>   # background; restarts a dead dispatcher with this env
```
Locally the single shared dispatcher stays (`../Learn_platform-dispatch`, no filter). Lead-bound lines
(SPECIALIST, STALE, DISPATCH) reach only a dispatcher whose filter includes `lead`. A role in the cloud
shows `listener none` on the local `wake:health`; that is expected.

## 5. Role startup
Paste the role's prompt from `agents/SESSION_PROMPTS.md` ("your clone" replaces the local worktree path).
Branches: cut every branch from `origin/main`; no stacked branches; handoffs are PRs plus
`npm run alarm <role> <#> "<done> / <needed>" <slug>`; resolve your own conflicts.

## 6. Recovering after a restart
`<tmp>/cet-wake` may be gone, so the listener starts at the end of a new inbox. Recover from GitHub:
1. `gh issue view 519 --comments`: your comment (Now / Next / Blocked).
2. `npm run wake <slug>`: your open queue.
3. `gh pr list --search "\"Role: <your role>\" in:body"`: your open PRs (all sessions share one GitHub account).
Then restart the dispatcher and listener (section 4).

## 7. Environment variables
| Variable | Who | Purpose |
|---|---|---|
| `GH_TOKEN` | every role (unless `gh auth login`) | wake, alarm, dispatcher, PRs |
| `DISPATCH_ROLES` | cloud sessions, optional | inbox filter (section 4) |
| `PW_PORT`, `CI` | anyone running e2e | unique port per checkout; `CI=1` = no server reuse, 1 retry |
| `DISPATCH_SECONDS`, `DISPATCH_STALE_MINUTES`, `WAKE_MAX_MINUTES` | optional | poll interval (60), stale rule (30), `--stream` limit (35) |
| `CET_PRIVATE_SOURCES` | local specialists only | path to the private knowledge base (locally `../CET_courses_Knowledge_base`) |
| `VERCEL_TOKEN` | Lead / DevOps only | manual `vercel deploy` previews; never `--prod` without the owner |

The app itself needs no env vars (static export, no server). `learn-platform.vercel.app` is a third
party's site; our preview link is in #405.

## 8. Private material: local only
Never committed, uploaded or quoted; it exists only on the owner's machine:
- `$CET_PRIVATE_SOURCES/CPET181/`: per-chapter KB txt, master KB, `slides_compact`, quiz/Moodle patterns, the
  `CPET181_all_Slides_pptx` and `CPET181_all_Quizzes_pptx` decks (slide visuals, figures, tables).
- `$CET_PRIVATE_SOURCES/CPET181/ERRATA_for_owner_*.md`: the owner's private slide errata.
- `CPET181/` in the main checkout: Fall 2025 (authoritative) and Spring 2025 syllabi.
- `ECET111 materials/` (decks, syllabus) and `MyPics/` (tutor pose originals and `POSE_GUIDE.md`).

The cloud team works only from committed material: CPET181 packs (#544, #546-#548), coverage
`docs/COVERAGE_CPET181.md` (#542), the kinds spec (#545), and the ECET111 packs and processed tutor images.

**Needs a local specialist with the originals:** new source ingestion (Material Analyst); figure or
table fidelity to a slide; errata or source-ambiguity resolution; Pedagogy chapter sign-off against
slides; new tutor pose choices beyond the committed images (`POSE_GUIDE.md`). The Lead routes these to
a local session; cloud roles flag them on the item and continue with what the packs settle.
