# Content Schema Gaps — ECET 111 Chapter 1

Input to the Instructor Studio design (M3). These are gaps found while structuring Chapter 1 with the
M1 schema (ADR-0002): #25, #33, #35 and #45. Each entry is something an instructor would have to
know, repeat or hand-check today. The **Now** column is how we cope until the Studio exists.
Owner: Backend / Data Engineer. Add new gaps here; don't spread them across issues.

## Steps and the owner's step-as-goal rule
The owner's rule (#44, 2026-10-03): every multi-step answer is a chain of goals, and each goal
appears only after the one before it is done.

| # | Gap | Now | Studio needs |
|---|-----|-----|--------------|
| 1 | Each multi-step procedure is its own interaction kind with its own step logic (`repeated-division`, `column-addition`; octal/hex grouping is next, #44). | A new kind, grader and runner wiring for each procedure. | A generic *walk*: an ordered list of checked sub-goals, each with an answer shape, so a new procedure is content, not code. |
| 2 | Hints and Explain Slowly belong to the variant, not to the step (#44: "hint ladders follow the active step"). | One ladder covers all steps through step vars (`{dividend}`, `{carryIn}`). | Hints and nudges per step, with a variant-level fallback. |
| 3 | Step template vars are computed in code (`stepVars` in the runner, `additionStepVars` in content), so authors can't see them. | The names are listed in PR bodies and checked by the slot test. | A vars catalogue per kind, shown next to the text editor. |
| 4 | 1's complement is one typed answer for 6 bits (#35). The step-as-goal rule may want one goal per bit. | `first-wrong-bit` points at the first bit to fix. | Pedagogy to decide; if per-bit, it is gap 1 again. |

## Authoring effort and correctness
| # | Gap | Now | Studio needs |
|---|-----|-----|--------------|
| 5 | Truth can be computed (division, addition, complement, grouping, circuits), but variants are still written out in full: steps, answers, groups and `equals` values like the copied decimal "26". | Content tests compare authored values with computed ones. | A generator per kind: the instructor picks the numbers, and the steps, answers and derivable detectors are filled in. |
| 6 | One `vars` object is shared by several questions (`vars26`), so question-specific values are patched in (`groupSize`, #45). | `{ ...vars26, groupSize: 3 }`. | Vars at course → question → variant levels, the lower level overriding. |
| 7 | Nudge text lives in the tutor catalog (`nudgeKey`), away from the detector that fires it. A wrong message showed up in a different question (#45: "four bits" in octal). | A test resolves every nudge slot per variant. | Edit the nudge next to its detector, with a preview in each variant. |
| 8 | Explanation `stage` is an untyped record (`revealed`, `attention`, `groups`, `lit`, `showOrder`), so a typo fails silently. | Visual check in review. | A typed stage per kind, edited by clicking the diagram. |
| 9 | Nothing makes a question with an explanation have a second variant for the retry (#42, Director condition 3 on #47). | Review and the Director's rule. | A validation: explanation present ⇒ at least two variants. |
| 10 | Base notation is typed as Unicode subscripts, (26)₁₀ (#55). | Unchanged. | A notation token, e.g. `(26)_10`, rendered as `<sub>` with accessible text. |

## Provenance, approval, language
| # | Gap | Now | Studio needs |
|---|-----|-----|--------------|
| 11 | No link to the source slide. "Follows Chapter 1" is only a code comment. | Comments and PR text. | A `source` field per question (deck + slide) for the instructor's approval pass. Slides themselves are never stored. |
| 12 | `authority` (DEMO/APPROVED) is set per course and per activity only. | Everything is DEMO. | Approval per question, with who approved it and when. |
| 13 | Content text is English, inline. The `ar` catalog covers tutor messages only. | — | Localisable content strings next to the catalog. |
| 14 | Pedagogy guard tests depend on the kind (base-2 numeric must have `division-chain` context). Reading a result off a finished addition (#38 Q3) would fail them. | Change the guard in #38. | Guards expressed as validations the Studio runs while authoring. |
| 15 | Column addition always ends with a final end-carry step, even when the carry is 0. Subtraction by 2's complement (#40) discards the end carry. | Decide in #40: an `endCarry: "write" \| "discard"` flag or a separate step. | Per-step options on the generic walk (gap 1). |
