Current assignment: Review ECET 111 completion PRs (epic #192) as alarmed; one comment per review ending "Ready for QA", "Ready to merge" (routine content on tested kinds, every answer verified independently; wake the TL) or "Changes needed".
Recent important decision: Risk-based QA and upstream Pedagogy (owner 2026-10-05, #444/#445); authors fix their own conflicts (#435); truth is computed, never typed (e.g. `latchAfter`, #443); detector names unique across kinds.
Blocker: None
Relevant issue/PR: #436 changes needed (build Explain assumes brackets), Backend woken; the preview guard misses multiple-choice answers (noted on #429); Vercel preview builds hit the Hobby rate limit (DevOps, #432).
Next expected action: Re-review #436 on its next wake; watcher runs as `WAKE_POLL_SECONDS=120 node scripts/wake.mjs --watch` (not via npm, which leaks on Windows).
