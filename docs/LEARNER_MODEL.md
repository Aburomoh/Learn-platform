# Learner Model

Profiles are **course-offering and semester scoped**. Nothing about ability is carried across
offerings or courses. Never infer intelligence, aptitude or fixed ability; never store labels
such as "weak at", "slow", "low ability".

## What may be tracked inside one offering
- concept mastery estimate (recent-weighted)
- recent attempts per question (count, correct, hints used)
- misconception evidence (ids from content, with timestamps)
- successful independent responses (no hints)
- retention evidence (later correct answers on the same concept)

Recent evidence outweighs old evidence (exponential decay by attempt index, not wall clock).

## Storage (M1)
Client-side only. `localStorage` key `cet-learn:v1:progress:<offeringId>` (ADR-0005).
Writes are batched (debounced) and small. A separate key `cet-learn:v1:prefs` holds account-level
durable preferences only: language, reduced-motion override, theme, typewriter speed.
Session-only state (current activity, tutor state) is never persisted. `completedQuestions` is
optional, so data saved before it existed loads unchanged (no version bump); Review does not clear it.

## Shape
```ts
interface OfferingProgress {
  version: 1; offeringId: string;
  activities: Record<ActivityId, { status: 'new'|'started'|'completed'; attempts: number; hintsUsed: number; independent: boolean; lastAt: number;
    completedQuestions?: QuestionId[] }>;  // finished challenges, for Continue and the progress dots (R1)
  concepts: Record<ConceptId, { evidence: MasteryEvidence[] }>;  // capped length
}
```

## Future
Optional account sync uploads the same shape, batched, never per click. Instructor analytics
aggregate concept-level data only (see `PRIVACY.md`).
