# Arabic localization — requirements (owner directive, 2026-10-11)

Source: the owner's directive in #633, recorded here in substance. This file only states the rules; it does not add any. Anything not stated here is **not** a requirement.

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Inventory, technical glossary, audit, requirements. No translation, no code, no layout change, no i18n library | This PR |
| 2 | Translation and implementation | Starts only after the owner approves the translation package |

## What is translated, and what stays English

- **Questions stay English.** That covers question prompts, exam-style answer options, problem statements, equations, notation, circuit labels and variable names.
- **Only separable supportive text is in scope:** tutor bubbles, hints, answer feedback, explanation and scaffold steps, and tutor nudges. `source-texts.json` is the inventory of that text.
- Technical terms follow `TECHNICAL_GLOSSARY.md`: approved English + Arabic, approved English only, and owner-decided terms. A term that is awaiting an owner decision is **not** translated until the owner decides.
- No machine translation. The only Arabic that may be written before owner approval is the four glossary entries the owner supplied.

## Language and style (for the translation in Phase 2)

- **Modern Standard Arabic**, in a slightly conversational instructor tone.
- The tone is **not** literary, **not** bureaucratic, **not** dialect, and **not** a literal word-for-word rendering of the English.
- **Western digits only** (0 1 2 3 4 5 6 7 8 9). No Arabic-Indic digits, including in numbering, counts and times.

## Text direction and layout

- Arabic prose is **right-to-left**. English terms, equations, signals and notation inside it are **left-to-right isolated** runs, so they do not reorder.
- English questions stay fully left-to-right, even on a page whose supportive text is Arabic.
- **No layout mirroring.** The page layout, figures, tables, diagrams and controls keep their English positions; only the supportive text's direction changes.

## Language control

- An **`EN | عربي`** control at the top of the page.
- It applies **immediately** (no reload) and is **persisted as a learner preference**, site-wide: it is not per course or per page.

## Phase 2 checks

The owner listed checks per role (Content, UI, Reviewer, QA) for Phase 2. **The per-role list is not in the text of #633 that reached Content, so it is not reproduced here.** The Lead is asked to paste the owner's list below verbatim before Phase 2 starts; nothing is invented in its place.

| Role | Check (owner's wording) |
|---|---|
| Content | _to be pasted by the Lead from the owner's message_ |
| UI | _to be pasted by the Lead from the owner's message_ |
| Reviewer | _to be pasted by the Lead from the owner's message_ |
| QA | _to be pasted by the Lead from the owner's message_ |

What Phase 1 itself asks of the Reviewer (from #633): confirm the inventory is complete and that no translated text and no question text has been added. No QA is needed for this documentation-only phase.

## What exists in the code today (for the record)

- `src/tutor/messages/ar.ts` is an empty Arabic catalog with an English fallback and a test that keeps every `{slot}` (#70). It covers only the shared tutor catalog keys; hints and explanations authored in content files have no catalog key (see `AUDIT.md`).
- No `EN | عربي` control, no RTL handling and no Arabic font choice exist yet.
