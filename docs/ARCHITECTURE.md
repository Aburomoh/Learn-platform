# Architecture

Single Next.js (App Router) application, strict TypeScript, served as static pages on Vercel.
No database, auth or server functions in M1. Decisions: `docs/adr/`.

## Four UI layers

| Layer | Folder | Role |
|-------|--------|------|
| A. Learning Shell | `src/shell/` + `src/app/` routes | Navigation, course/module/topic lists, progress, guest state, settings. Conventional. |
| B. Learning Stage | `src/stage/` | Central workspace. `ActivityRunner` renders an activity's interactions, hosts focus/highlight targets, drives the tutor. |
| C. Interaction Engine | `src/interactions/` | Reusable, documented components (MultipleChoice, DragToTarget, ClickableDiagram, HintReveal, PredictionBeforeReveal, …). Internal product: API + types + README + a11y + tests. |
| D. Tutor | `src/tutor/` | Pure rule engine (`engine/`), message catalog (`messages/`), adapter interface, UI (avatar, bubble, focus). |

Supporting: `src/content/` (Zod schema + typed demo data), `src/learner/` (local, offering-scoped
progress), `src/styles/` (tokens, globals), `config/product.ts` (identity).

## Data flow (all client-side)
```
Interaction component --LearningEvent--> ActivityRunner
ActivityRunner --event--> TutorEngine.reduce(state, event) --> { state, TutorAction[] }
ActivityRunner --actions--> Tutor UI (SAY / CHANGE_EXPRESSION) and Stage (FOCUS / HIGHLIGHT / PULSE)
ActivityRunner --MasteryEvidence--> learner store (batched localStorage write)
```
Shell pages are Server Components; the stage subtree is a Client Component.

## Routes
`/` course list · `/courses/[course]` modules and topics · `/courses/[course]/[topic]/[activity]`
Learning Stage. All routes are statically generated from `src/content/` via `generateStaticParams`.

## Rules
- Before adding server infrastructure: can the browser do it safely? (In M1: yes.)
- Before adding an AI call: can structured logic or pre-generated content do it?
- Before adding a dependency: ADR with bundle/maintenance justification.
- Course truth comes only from `src/content/`; the tutor never computes answers itself.
- Future `ConversationalTutorAdapter` implementations plug in behind the same action contract.

## Future (not built)
Accounts and sync (Level 4 review), Instructor Studio, concept-level instructor analytics,
optional local conversational model, per-locale message catalogs.
