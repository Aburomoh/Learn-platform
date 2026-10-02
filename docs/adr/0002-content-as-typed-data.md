# 0002 — Content as typed data files
Status: Accepted · Date: 2026-10-03 · Owner: Backend / Data Engineer

## Context
The mission requires structuring one real topic by hand before building an Instructor Studio,
and prefers a schema humans can author and inspect.

## Decision
Content lives in `src/content/` as TypeScript modules typed by a Zod schema (`schema.ts`).
Entities: Course, Module, Topic, Concept, LearningObjective, Activity, Question (with answer,
distractors tagged by misconception, hints in ladder order, explanation steps, retry variations,
tutor reactions), Interaction spec, Misconception. No database. A test validates every content
module against the schema. Every demo file carries `authority: 'DEMO'`.

## Consequences
Content ships in the static bundle; authoring is a PR. The schema is the input to the later
Instructor Studio design. Not over-normalised: a question embeds its hints and steps.

## Alternatives considered
JSON/YAML files (lose type inference and inline comments). CMS or database (cost and
complexity with no M1 benefit).
