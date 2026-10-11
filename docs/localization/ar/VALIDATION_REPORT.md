# CET Learn — Arabic translation validation

## Inventory

- Source entries: **3,771**
- Arabic entries: **3,771**
- Missing translations: **0**
- Duplicate/missing indices during assembly: **0**
- Source metadata changed: **0** (`arabic` was added; all existing fields were preserved)

### By course

- ECET111: **2,456**
- CPET181: **1,200**
- Shared: **115**

### By supportive-text type

- explanation: **1,688**
- hint: **1,291**
- feedback: **585**
- tutor-nudge: **142**
- tutor-bubble: **65**

## Template safety

- Entries containing source slots/templates: checked across the full inventory.
- Lost, renamed or added source slot expressions: **0**.
- Every source `${...}` / `{...}` expression present in a translation is preserved exactly where required by the validation check.

Two raw JavaScript-template entries intentionally retain English *inside* their untouched `${...}` expressions; they need Phase 2 refactoring (see `TRANSLATION_REVIEW_NOTES.md`).

## Number / notation policy

- Arabic-Indic digits (`٠١٢٣٤٥٦٧٨٩` / Persian variants): **0**.
- Western digits, equations, variables and signal notation are preserved.
- Equation-only/data-only supportive entries may be identical in English and Arabic by design.

## Question-language policy

The supplied inventory contains supportive text only. Its entry types are limited to explanation, hint, feedback, tutor-nudge and tutor-bubble. Question prompts and exam-style answer options were excluded upstream and therefore were not translated by this package.

## Implementation boundary

This validation covers the supplied `source-texts.json` inventory. It does **not** mean every student-facing UI/chrome string in the application is localized. The Phase 1 audit separately found hard-coded component/chrome/accessibility strings and dynamically assembled sentences that Phase 2 must centralize or template before complete website localization.

## Result

**Translation package: structurally valid and complete for the supplied 3,771-entry supportive-text inventory.**

Next gate: owner/reviewer terminology and language-quality spot-check, followed by Phase 2 integration and RTL/LTR UI QA.
