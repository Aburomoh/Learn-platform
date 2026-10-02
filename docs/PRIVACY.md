# Privacy

Collect only data with genuine instructional value. Participation is optional. No gradebook.

## Not collected (ever, without a new Level 4 decision)
Mouse tracking, keystroke timing, clickstream logs, minute-by-minute monitoring, device
fingerprinting, permanent psychological or ability profiles, raw tutor conversation archives.

## Collected in M1
Nothing leaves the browser. Guest progress is in `localStorage` (see `LEARNER_MODEL.md`) and the
student can clear it from Settings. No analytics SDK, no third-party scripts.

## Later (each needs Security/Privacy review)
- Accounts: minimal identity (no unnecessary personal fields), offering-scoped progress sync.
- Instructor analytics: concept-level performance, frequently missed questions, common
  misconceptions, class-level only; no per-student surveillance dashboard.
- Tutor conversations, if any: short-lived; retain compact structured summaries, not raw text.

## Scope of profiles
Offering + semester scoped. Deleted or archived at semester end. No cross-course inference.
