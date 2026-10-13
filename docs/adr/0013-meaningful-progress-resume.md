# 0013 — Meaningful progress: what `started` and `lastAt` mean (amends 0005)
Status: Proposed · Date: 2026-10-13 · Owner: UI / Interaction Engineer (epic #670 S1, #677; owner refinement 3)

## Context
ADR-0005 fixed the storage shape (`cet-learn:v1:progress:<offeringId>`, v1) but not what the
fields mean. Today opening a practice page writes `status: "started"` and `lastAt` before any
answer (`startActivity` on mount), and Home continues the `started` record with the newest
`lastAt` across all courses. So a look at a CPET 181 practice makes CPET 181 an ECET 111
student's greeting (owner observation 1, Reviewer journey F). `skipQuestion` and `markExplained`
also bump `lastAt`, so a skip or an opened explanation reads as study.

## Decision
The shape stays v1; no field is added, renamed or migrated. Only meanings change:
1. **Meaningful progress** in a practice = an attempt (`recordAttempt`) or a completed question
   (`completeQuestion`). Nothing else: not opening the page, not a skip, not Explain Slowly, not a
   lesson or a hint (#687 §2.5), not a draft.
2. **`lastAt` is the time of the last meaningful event.** Only `recordAttempt`, `completeQuestion`
   and `completeActivity` write it. `skipQuestion` and `markExplained` keep recording
   `skippedQuestions` / `explained` but leave `lastAt` as it was.
3. **No write on mount.** `startActivity` no longer runs when a practice opens. The record is
   created by the first meaningful writer (they already create a missing record). Reviving a
   `skipped` record moves to that same first attempt.
4. **Continue** (per course, `courseAction`) = the `started` practice with meaningful progress
   (`attempts > 0` or a `completedQuestions` entry) and the newest `lastAt`; otherwise Start on
   the first topic not completed; otherwise Review. A record with `explained` but no attempt and
   no completed question is never Continue (owner refinement 3).
5. **Active course** (`pickCourse`, Home's panel) = the course whose newest `lastAt` over
   practices with meaningful progress is most recent; none anywhere → the first in the catalogue.
   Every other course row keeps its own Continue / Start (#682).
6. **Old records** written as `started, attempts 0, no completedQuestions` are read as
   *visited only* by rules 4–5; a `lastAt` once bumped by a skip or an explanation is accepted
   as it is (the error is bounded to that session). No migration, no rewrite.
7. **Readers count done questions through one helper** (`effectiveDone`, #687 §6.1) once it
   lands; until then `completedQuestions` is read as today. The predicate in rule 8 counts done
   questions through it too, so a credited split never reads as "not started". Resume order is
   unchanged: the first unfinished question in content order; `?review=1` (and a declared `#q=`
   entry, S3) still wins.
8. **One predicate for "in progress", used by every reader of `started`:**
   `inProgress(record)` = `status === "started"` and (`attempts > 0` or at least one done
   question). A visited-only or explained-only record reads as `new` everywhere: `courseAction`
   and `pickCourse` (rules 4–5), `practiceAction` and `topicAction` (the topic page's filled
   button and the row actions), Home's heading ("Pick up where you left off" vs "Start here") and
   its "N started" count, `topicStatus` / `chapterStatus` (course page rows and chapter state),
   `CourseTutor`'s started message, and `TopicNext`'s current-step marker. No reader tests
   `status !== "new"` on its own any more.

## Consequences
Journey E: a direct URL, a look and leaving changes nothing on Home; one checked answer makes
that practice Continue in that course. Journey F: browsing another course never switches the
greeting; answering there does. A student who only reads explanations is not "in progress".
`ActivityRunner` drops its mount write; `inProgress` lives in `src/learner/progress.ts` and is
the only in-progress test in `primaryAction.ts`, `HomeNext.tsx`, `CourseTopics.tsx`,
`CourseTutor.tsx` and `TopicNext.tsx`. Tests: `progress.test.ts` (skip and explain leave
`lastAt`; no record on mount; `inProgress` on visited-only, explained-only, attempted and
done-question records), `primaryAction.test.ts` (visited-only and explained-only never Continue
nor active), `HomeNext.test.tsx` (active-course rule; a visited-only record keeps "Start here"
and no "started" count), `CourseTopics.test.tsx` and `TopicNext.test.tsx` (visited-only reads as
not started on the course rows, the chapter state and the topic page), e2e journeys E and F at
390 and 1280.

## Alternatives considered
Newest concept-evidence `at` as the clock: evidence has no activity id, so Continue would need a
content lookup and two clocks. A new `lastMeaningfulAt` field: a format change for no gain, since
`lastAt` has no other reader. An explicit "set active course" control: settings sprawl; answering
in a course is the switch.
