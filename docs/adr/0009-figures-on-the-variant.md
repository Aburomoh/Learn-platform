# 0009 — Figures on the variant
Status: Accepted · Date: 2026-10-05 · Owner: Technical Lead (written by Frontend, decision on #454)

## Context
Owner directive (2026-10-05, epic #454): a student can finish decoders, adders and multiplexers
without seeing the symbols that define them. The drawings exist, but each lives inside one kind
(`device`, `circuit-predict`), and kinds never import each other (ADR-0008). Only `numeric` and
`multiple-choice` questions can show something above the answer (`context`). A truth-table,
expression, derivation or K-map question about a decoder cannot show the decoder.
UX plan: `docs/design/ecet111-visual-system.md`.

## Decision
1. **A question may carry one figure: `Variant.figure`.** It is a Zod discriminated union on
   `type`, validated at build (`src/kinds/shared/figures/figureSpec.ts`). The stage draws it, for
   every kind, above the answer area on phones and beside it from 900 px. Kinds' specs do not change.
2. **Content names the figure and what is given. Results are computed, never authored.** The
   union has no field for an answer; the figure computes what it shows (`rightPick`, `latchAfter`).
3. **Three states, the same for every figure:**
   - *given*: the values printed on the pins;
   - *focus*: one named pin or line has the halo (`figure.focus`, or `stage.figureFocus` on an
     Explain step), checked at build against the figure's pin names;
   - *result*: the computed line or path in `--signal-high` with its value. The stage sets it only
     after a correct final answer, on the last Explain step, or on a step with
     `stage.figureResult`. Never before a correct answer.
4. **Shared drawing code lives in `src/kinds/shared/figures/`**, with one style sheet
   (`figures.module.css`). A kind that answers on a drawing (the `device` kind) uses the same
   figure component and adds only its answer controls. Kinds still never import each other.
5. **Each figure type is its own lazy chunk** (`FigureView`, `next/dynamic`, literal `import()`),
   so a question downloads only the drawing it shows. No new dependency.
6. **`context` stays** for worked results of numeric and multiple-choice questions (division
   chain, grouped bits, addition, bit row). The `latch` context keeps working; new content uses
   `figure`.
7. **A new figure type** is added as: a member of the union (with its spec check), a drawing
   component in `figures/`, one `case` in `FigureView`, and a test that the result is not drawn
   before `revealed`.

## Consequences
One schema field, one renderer and one style sheet give every kind a figure. The first PR moves
the decoder, encoder, mux and latch drawings; the existing `device` questions look the same.
Adder and flip-flop blocks came next (`BlockFigure`: one rectangular block for both), then the
sequential circuit and `gates` (the circuit kind's drawing, moved to `figures/circuit/`, built from an
equation so the drawing cannot disagree with it). The
demultiplexer, the "inside" faces and the read-only circuit follow as new union members. The two-column layout at 900 px applies only to questions that have a figure.

## Alternatives considered
Widening `context` to every kind (touches every kind's spec and view, and mixes worked results
with drawings). Static images (not responsive to the question's values, no focus or result state,
and a second visual style). A general circuit simulator (far more than recognition needs).
