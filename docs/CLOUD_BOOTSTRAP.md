# Team V2 cloud continuation (#550)

Prepare and verify first; this document does not authorize migration or production deployment.
GitHub issues, PRs, labels, verdicts, state board #519 and epic #528 are the handoff. Never depend on
conversation memory, another machine's files, or a running local session.

## Fresh machine

Use Linux or Windows with git, GitHub CLI (`gh`), and Node **24** (`.nvmrc`; package minimum is 22).
Each permanent role needs its own clone and a host that retains background processes and surfaces
listener completion to the agent. Verify that host capability before retiring any local session.
Run the following in Bash; use equivalent environment assignment in PowerShell.

```bash
git clone https://github.com/Aburomoh/Learn-platform.git
cd Learn-platform
git config user.name Aburomoh
git config user.email 76401257+Aburomoh@users.noreply.github.com
gh auth login --hostname github.com  # interactive, or inject GH_TOKEN securely
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

## Selected target: Claude Code on a Linux VM

Owner selection: 2026-10-08. Use the existing VM; no paid service or new VM is authorized by this
guide. Confirm its distribution, SSH alias, available RAM/disk and installed tools before setup.
Run as the ordinary development user, with a persistent terminal such as tmux so an SSH disconnect
does not end Claude. Install Claude via the [official Linux setup](https://code.claude.com/docs/en/setup),
then run `claude --version`, `claude doctor`, and `claude` to complete owner-controlled sign-in.
Authenticate GitHub separately with `gh auth login`; do not copy credentials from the local machine.

On **one VM hosting multiple roles**, use one stable dispatcher clone and five independent role
clones under a workspace such as `~/cet/`. They share one machine-local dispatcher; never start a
dispatcher per clone on the same machine. On multiple VMs, start one dispatcher on each VM.
Use `npm ci` separately per role and distinct `PW_PORT` values for simultaneous browser tests.
Set the repository-local no-reply git identity above in every clone before committing.
Start each permanent role in its own persistent terminal, for example:

```bash
# After bootstrap checks pass and reviewed main contains the handoff documents:
mkdir -p ~/cet
git clone https://github.com/Aburomoh/Learn-platform.git ~/cet/dispatcher
cd ~/cet/dispatcher
npm run dispatch:start
npm run wake:health
# Repeat with the correct slug for each role; these are independent clones.
git clone https://github.com/Aburomoh/Learn-platform.git ~/cet/lead
cd ~/cet/lead
npm ci
tmux new-session -s cet-lead
claude
```

Inside each Claude session paste its exact prompt from `agents/SESSION_PROMPTS.md` with the clone
path substituted. Have it run the listener with the Bash tool's `run_in_background: true` and
verify a real alarm wakes that session; shell `&` or tmux alone does not prove agent notification.
Background tasks are documented in [Claude interactive mode](https://code.claude.com/docs/en/interactive-mode).
After VM reboot, reattach/restart the terminals, dispatcher and role listeners, then recover from
#519 and GitHub queues. tmux survives disconnection, not reboot. Keep local source specialists available.

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
| `GH_TOKEN` | Alternative to `gh auth login`; securely injected GitHub credential able to read/write this repo's issues, PRs and labels. Never commit or print it. |
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
