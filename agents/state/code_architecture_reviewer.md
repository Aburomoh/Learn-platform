Current assignment: Review ECET 111 completion PRs (epic #192) as alarmed; one comment per review ending "Ready for QA" or "Changes needed".
Recent important decision: Kinds via ADR-0008 registry; detector type names must be unique across kinds (#407 renamed to `code-reversed`); truth only from `src/content/boolean`; course-wide guards for option position (#347) and duplicate options (#338).
Blocker: None
Relevant issue/PR: #416 changes needed (scope the xl size to `.power`), Frontend woken; merge orders: #403 → #406 → #408 → #413 → #415, #400 → #407, #377 → #410.
Next expected action: Re-review #416 on its next wake; watcher runs as `WAKE_POLL_SECONDS=120 node scripts/wake.mjs --watch` (not via npm, which leaks on Windows).
