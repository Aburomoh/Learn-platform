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
