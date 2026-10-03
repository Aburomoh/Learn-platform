# 0007 — One step contract for multi-step questions
Status: Accepted · Date: 2026-10-03 · Owner: Technical Lead

## Context
Owner rule (2026-10-03): when an answer needs several steps, each step is a goal by itself and the
next one appears only after the current one is done. Chapter 1 now has four step procedures:
divide-by-2, column addition, octal/hex grouping (#44) and the gate walk (#32). Each one grew its
own step logic; template variables are computed in three places (`docs/SCHEMA_GAPS.md` gaps 1–3).

## Decision
1. **One contract, in one module: `src/content/steps.ts`.** Every multi-step spec implements
   - `stepCount(spec): number`
   - `stepTag(spec, i): string` — what kind of goal step `i` is (`"divide"`, `"carry"`, `"group"`, `"digit"`, `"gate"`)
   - `stepVars(spec, i): TemplateVars` — the values text may use at that step
     (structural values only: ids, numbers, bits; wording and localisation stay in the tutor catalog)
   and `grade()` returns `partial: true` until the last step. The runner, the tutor context and
   the content tests call only this module. No other step dispatch is allowed.
2. **A new spec kind is justified by a different interaction layout, not by different step logic.**
   Grouping (#44) and the gate walk (#32) follow the contract; they do not add runner branches.
3. **Hints may be per step.** `Variant.hintsByStep?: Record<stepTag, Hint[]>`, falling back to
   `hints`. Use it when one ladder with step variables cannot serve two different goals (marking
   groups versus converting a group).
4. **No generic authored "walk" kind yet.** That is an Instructor Studio feature (M3); the contract
   is the seam it will plug into.
5. **Guard:** a content test fails if a variant has an explanation and fewer than two variants
   exist for its question (#42), and if any multi-step spec is not registered in `steps.ts`.

## Consequences
One place to look for step behaviour; the three existing dispatch sites collapse into it (migrate
`repeated-division` and `column-addition` in the first PR that touches them). The stage reveals
goals one at a time for every procedure by construction.

## Alternatives considered
A generic data-driven walk now (premature: four procedures, each with its own diagram). Leaving
each kind bespoke (step logic keeps spreading; the owner rule would be re-implemented per kind).
