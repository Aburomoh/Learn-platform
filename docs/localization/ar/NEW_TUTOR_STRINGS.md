# Tutor catalog strings added after the Phase 1 inventory

Input for the Arabic batch (#676). These keys are in `src/tutor/messages/en.ts` and have no Arabic yet; the app shows the English until `ar.ts` has them (`untranslatedKeys("ar")`). Keep every `{slot}` (none here). Not edited by this list: Arabic for existing keys.

| Key | English | Added in | Used when |
|---|---|---|---|
| `hint.try-first-or-stuck` | Give it one try first, or tell me you are stuck. | #690 (learn 1a) | Hint tapped before the student has engaged with the step. Replaces `hint.try-first` in the engine; the old key stays for the older text. |
| `idle.quiet` | Take your time. If you are stuck, say so. | #690 | 45 s idle: a quiet line that opens nothing. Replaces `hesitation` for the new `IDLE` event. |
| `stuck.start` | That is fine. Let us look at this step together. | #690 | First line of the reply to "I am stuck". |
| `stuck.offer` | Want another hint, or shall I explain it slowly? | #690 | Last line of the reply; the two choices ("Show a hint", "Explain slowly") are UI labels (learn 1b). |
| `explain.confirm-restart` | This walks through a worked example. Afterwards you start this question again with new numbers. Go ahead? | #690 | One-time warning before a legacy Explain Slowly on a later step of a multi-step question. |

UI labels for the new controls ("I'm stuck", "Show a hint", "Back to my step") come with the UI PRs (learn 1b onward), which list their own strings.
