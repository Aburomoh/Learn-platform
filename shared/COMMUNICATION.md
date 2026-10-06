# Communication Protocol

AI context is a limited engineering resource.

## Defaults
- Normal comment: 1–4 sentences.
- Normal PR description: preferably under ~150 words.
- State files: current state only.
- Long reasoning belongs in one ADR or design document; link to it instead of repeating it.
- Do not copy the same explanation into issues, PRs, comments, and state files.

## PR Template
Purpose:
Changed:
Risk:
Test:

## Blocked Template
Problem:
Evidence:
Attempts:
Recommended option:
Decision needed from:

After two genuinely different failed approaches, escalate.

## CI policy
- Before pushing code, run the cheapest relevant local checks (the pre-push hook runs typecheck and lint; add the unit tests you touched). Never push known-broken work: CI is the verification gate, not the first debugger.
- Batch coherent edits into one push; open PRs as draft until they're ready for review. Docs/state-only PRs skip the build and browser jobs.
- After merging main into your branch, run typecheck before pushing (conflict markers and duplicate keys are the usual misses).

## Git and worktrees (ported from the owner's local memory, #550)
- Before removing a worktree, delete its `node_modules` link alone (`cmd /c rmdir <wt>\node_modules`, or `rm <wt>/node_modules` without `-r`): `git worktree remove --force` follows the link and wipes the main checkout's `node_modules`.
- A linked `node_modules` works for tsc, eslint and vitest, but `next build` (Turbopack) rejects it: run `npm ci` in any checkout that builds.
- e2e: set a unique `PW_PORT` per checkout (default 4173 is shared); with many live sessions run vitest with `--no-file-parallelism`.
- Before reviewing a PR or claiming a fix is (not) on it, read its whole commit list (`git log origin/main..origin/<branch>`), not only the head.
- Draft PRs do not trigger the Reviewer wake: run `gh pr ready` (or alarm the Reviewer) when the PR is ready.
- No automatic conflict resolvers for code; authors resolve their conflicts by hand.
- Commit only with the repo-configured identity (GitHub noreply address); the Lead squash-merges with an explicit subject and body.
