# CET Learn — Arabic translation review notes

## Scope completed

This package translates the **3,771 supportive-text inventory entries** in `source-texts.json`: tutor bubbles, hints, feedback, explanations/scaffolds and tutor nudges. It does **not** translate question prompts, exam-style answer options, equations, notation, circuit/signal labels or variable names.

## Translation style

- Clear Modern Standard Arabic with a lightly conversational instructor tone.
- English remains the primary technical/exam term.
- Helpful Arabic appears as explanation/context; it does not replace the English technical vocabulary students must recognise in an exam.
- `CPU (وحدة المعالجة المركزية)`, `Memory (الذاكرة)`, `Decimal (عشري)` and `Binary (ثنائي)` follow the owner's explicit policy.
- `Latch`, `Flip-Flop`, logic-gate names (`AND`, `OR`, `NOT`, `NAND`, `NOR`, `XOR`, `XNOR`), equations, signal labels and variable names stay in English.
- Western digits are used throughout.

## Terminology decisions

`TECHNICAL_GLOSSARY_AR.md` contains the complete working classification. The general rule is:

1. **English + Arabic** when Arabic adds useful conceptual meaning, e.g. `Process (عملية)`, `Memory (الذاكرة)`, `Page (صفحة)`, `Turnaround time (زمن الإنجاز)`.
2. **English only** when translation would weaken correspondence with the course/exam vocabulary or add little explanatory value, e.g. `Latch`, `Flip-Flop`, `AND`, `K-map`, `FCFS`, `SRT`.
3. Acronyms and algorithm names remain visibly English even when an Arabic explanation is useful.

Arabic glosses do not have to be repeated on every occurrence if doing so would make a short hint unnecessarily long.

## Bidirectional-text implementation requirement

The JSON stores plain strings. Phase 2 UI must render:

- Arabic prose as RTL;
- English technical terms, equations, numbers, signals and code-like values as isolated LTR runs;
- English questions fully LTR;
- no page-layout mirroring.

This is especially important for equations embedded inside Arabic prose.

## Dynamic-template exceptions

Two component-source entries contain raw JavaScript template expressions whose internal English fragments cannot safely be translated without changing the code expression itself:

- `component.interactions.NumericInput.NumericInput.L63`
- `component.stage.ActivitySummary.L32.b`

Their surrounding text is translated, but the `${...}` expressions are preserved **exactly**. Phase 2 should refactor these into localization message templates with named slots/plural handling before they are presented in Arabic.

The audit also identifies other dynamically assembled component sentences that need the same implementation treatment. Arabic plural/dual agreement should be handled at template level, not by concatenating translated fragments.

## Human review recommended

Before release, the Reviewer should spot-check each chapter for:

- technical-term consistency;
- whether bilingual terms are repeated too heavily or too sparsely;
- natural Arabic word order around LTR terms/equations;
- Arabic singular/dual/plural forms after dynamic values;
- terminology specific to the instructor's preferred classroom wording.

The translation itself is complete as a draft; these checks are for polish and implementation fidelity.
