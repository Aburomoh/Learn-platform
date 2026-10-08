# Team V2 cloud continuation (#550)

Prepare and verify first; this document does not authorize migration or production deployment.
Repository validation does not require launching a cloud session or changing account settings.
GitHub issues, PRs, labels, verdicts, state board #519 and epic #528 are the handoff. Never depend on
conversation memory, another machine's files, or a running local session.

## Verification in a disposable clone

Use Linux or Windows with git, GitHub CLI (`gh`), and Node **24** (`.nvmrc`; package minimum is 22).
Each permanent role needs its own clone and a host that retains background processes and surfaces
listener completion to the agent. Verify that host capability before retiring any local session.
Run the following in Bash; use equivalent environment assignment in PowerShell.

```bash
git clone https://github.com/Aburomoh/Learn-platform.git
cd Learn-platform
git config user.name Aburomoh
git config user.email 76401257+Aburomoh@users.noreply.github.com
gh auth login --hostname github.com  # self-managed clone only; hosted sessions use proxy auth
gh auth status
npm ci
npm run typecheck
npm run lint
npm run test -- --no-file-parallelism
npm run build
npx playwright install --with-deps chromium
PW_PORT=4189 npm run test:e2e -- --workers=1
```

`build` produces `out/`; Playwright starts its own static server and refuses an occupied port.
No application API keys or private sources are required. Do not share `node_modules` through a
junction: Next's build needs a real installation. Keep logs of the commit, commands and results.

## Selected target: Anthropic-hosted `claude --cloud`

Owner clarification: 2026-10-08. Use the owner's existing Claude cloud credits; SSH, a separately
managed VM and tmux setup are not required. Local CLI 2.1.294 supports this flag. See the
[cloud session guide](https://code.claude.com/docs/en/claude-code-on-the-web) and
[environment configuration](https://code.claude.com/docs/en/cloud-environments).

Launch from a clean, pushed task branch. The command creates a new session, so its prompt must
name #550, #519, #528 and the role charter. It does not transfer the current local conversation.
Connect GitHub for this repository through Claude's onboarding; prefer repository cloning through
its GitHub App rather than a local bundle. Never force a bundle or upload private sources.

```bash
# From a clean checkout of the pushed preparation branch, for a bounded readiness pilot:
claude --cloud "Check cloud readiness for Aburomoh/Learn-platform issue #550. Read docs/CLOUD_BOOTSTRAP.md and agents/TEAM_V2.md. Run node --version, npm ci, node --test scripts/github.test.mjs and npm run wake lead. Verify gh api can read #519 and #550. Report versions, results and blockers. Do not edit files, post comments, change labels, migrate roles or deploy. Stop after reporting."
```

Hosted GitHub access uses a credential proxy: prefer `gh api` REST calls and the supplied auth;
`gh issue`/`gh pr` GraphQL commands are blocked. The wake tooling uses REST, including paginated
issue/PR queues. Do not run `gh auth login` or inject a personal token just to bypass this proxy.
Read state with `gh api --paginate repos/{owner}/{repo}/issues/519/comments`. PR/state operations
must use supported REST or built-in tools. Each isolated session starts its own dispatcher.

Install project dependencies after checkout. Match Node 24 (.nvmrc) for implementation/checks;
if the provided runtime differs, record it and configure the environment toolchain first. Allow
npm, GitHub and Playwright downloads as needed. Setup caching does not preserve running processes;
start dispatcher/listener in the session, and recover from GitHub after reclamation. Hosted idle
sessions may pause/reclaim their VM, so verify actual Claude background wake delivery before
promising permanent-role continuity. Do not replace this gate with scheduled polling or routines.
Keep local source specialists and current sessions available until the handoff passes.

## Role startup and recovery

1. Read `agents/TEAM_V2.md`, your charter, your comment on #519, assigned issue/PR, then only linked
   ADRs/docs. Copy your role prompt from `agents/SESSION_PROMPTS.md`, replacing local paths with your clone.
2. Run `npm run wake <slug>` and inspect open PRs carrying your role's label. After a restart repeat
   this step: temporary inbox files are not the durable queue. Never interpret a GitHub failure as an empty queue.
3. Start **one dispatcher per machine** with `npm run dispatch:start`, from a stable checkout of
   reviewed main. Local roles continue sharing the existing local dispatcher; each separate cloud
   machine starts its own. It receives all roles' wakes; no role filter is required.
4. Check `npm run wake:health` after the first poll. Start `node scripts/inbox.mjs <slug>` using the
   host's background-task facility. It completes once per event; act, then start it again. Do not
   run a foreground listener that blocks the agent's turn. On-demand specialists have no listener.
5. Acknowledge only your role's label on pickup: `npm run wake:ack <slug> <number>`. Deliver via PR
   and `npm run alarm <target> <number> "done / needed" <slug>`; don't remove another role's label.
6. `git fetch origin`, then `git switch -c <task-branch> origin/main`. No stacked branches. Authors
   fix their own conflicts and push before requesting re-review; no stand-ins or automatic conflict resolvers.
7. Reviewer gates every PR; QA checks changed behaviour and tests the merge with current main.
   Verdicts name the tested SHA and checks. A push invalidates affected approvals. Draft PRs need
   an explicit Reviewer alarm. Lead merges only after required verdicts and green CI.
8. Edit your comment on #519 before stopping. Save unfinished work in a pushed branch/PR and name
   exact next actions; never commit state files. After scripts merge, refresh/restart the dispatcher.

The dispatcher/listener use Node APIs and temporary files under the OS temp directory (`cet-wake/`).
`windowsHide` is ignored off Windows; there are no shell-specific spawn commands. Authentication
and GitHub network access must remain available during the agent phase, not only installation.
If the sandbox terminates background processes, startup alone is not a persistent Team V2 session.

## Environment inventory

| Variable | Required / purpose |
|---|---|
| `GH_TOKEN` | Self-managed alternative to `gh auth login`; hosted sessions use supplied proxy auth. Never print credentials or replace proxy auth unnecessarily. |
| `GH_REPO` | Optional `Aburomoh/Learn-platform` override if CLI cannot infer the remote; normally run commands inside the clone. |
| `PW_PORT` | Optional unique e2e port, default 4173. |
| `CI` | Optional `1` for CI reporter/retry behaviour. |
| `DISPATCH_SECONDS` | Optional dispatcher poll interval, default 60 seconds. |
| `DISPATCH_STALE_MINUTES` | Optional escalation threshold, default 30 minutes. |
| `WAKE_MAX_MINUTES` | Optional stream-mode listener lifetime, default 35 minutes; normal one-shot listeners have no deadline. |
| `CET_PRIVATE_SOURCES` | Optional local-only convention for the private knowledge-base root; tooling does not read it. Never provision originals in the cloud. |

There are no required application environment variables. Vercel credentials/configuration belong
only to Lead/DevOps for an authorized preview/deployment; other roles need none. Production still
requires owner approval. Do not copy local `.env*`, `.vercel`, auth stores or Claude memory to cloud.

## CPET181 source boundary and delivery

| Local-only dependency | Work that still requires a local specialist |
|---|---|
| `../CET_courses_Knowledge_base/CPET181/` (or local `CET_PRIVATE_SOURCES/CPET181/`) | New ingestion and source/ambiguity verification. |
| Git-ignored `CPET181/` syllabi | Confirm syllabus authority and scope; latest available is Fall 2025, owner confirmation pending. |
| Private `CPET181/ERRATA_for_owner_2026-10-06.md` within the knowledge base | Owner errata decisions and contradictory-source resolution; never publish its contents. |
| Original slide visuals and teaching sequences in the private sources | Figure fidelity and Pedagogy sign-off against slides. |

Cloud builders use reviewed packs `docs/content-packs/cpet181/` (#544, #546–#548), coverage
`docs/COVERAGE_CPET181.md` (#542), and spec #545 after they merge. Do not upload originals to unblock
a cloud role. Ask the Lead to start the local specialist and hand back only an allowed derived
pack/spec or verdict. Existing ECET111 originals (`ECET111 materials/`) and `MyPics/` also stay local;
only deliberately processed assets already tracked by git travel with the clone. PR #543 adds the
CPET181 source-folder exclusions; merge it before transferring work.

Follow the **Plan update** on #528, which supersedes its body: truth module #539 and shell #540,
then `memory-map` before `cpu-schedule`. P1 = shell + C1 + C2; P2 = pre-midterm C1/C2/C3/C8/C5;
P3 = all nine chapters after final audit #538. Reviewed content, three variants, independent answer
verification, chapter gates, static export and rule-based tutor remain the ECET111 standard.

## Readiness proof and cutover gate

In a disposable fresh clone of the candidate commit, run the installation/checks above, then
`npm run wake <slug>`. Start the dispatcher, wait for a successful poll, then start the listener
**before** sending a new test alarm (its first run starts at the inbox's end). Use a dedicated
test issue and one temporary role label; verify exactly one delivery, acknowledgement and restart
recovery. Stop only your test processes. Remove any dependency junction/link itself before deleting
the disposable clone; verify the absolute cleanup path is the intended temp directory.

Record on #550: candidate SHA, OS, command results, alarm issue, delivery evidence, blockers and
`CLOUD READY: YES/NO`. A Windows clone check proves Windows only; require Linux checks and a real
target-host background/wake test before claiming that host ready. Reviewer approval, required CI,
merged bootstrap/source-boundary docs, and reviewed CPET181 pack/spec dependencies must precede
cutover. Then start a fresh Lead and recover each existing role (no duplicate owner sessions),
verify end-to-end handoffs, and only then retire the local builder sessions. Keep source specialists local.
