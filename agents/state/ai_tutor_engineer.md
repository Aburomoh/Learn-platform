# Current State — AI Tutor Engineer

Current assignment: None. Merged: #331 #334 #339 (C2 truth-table, expression, derivation), #332 #336 (C1 base-to-decimal, bit-grouping).
Recent important decision: Messages by kind and step tag: `<key>.<stepTag>` nudge forms, `wrong.first.<tag>`, `wrong.cell[.<tag>]`, `step.next-*` lines; keys `tt.*` `expr.*` `drv.*` `pv.*` `ns.*`.
Blocker: None
Relevant issue/PR: #236 (K-maps), #241 (timing/state diagrams) when released; grader gaps noted on #102 (backend).
Next expected action: Next READY tutor ticket; optional: `wrong.again.<stepTag>` forms (attempt 3 falls back to the generic line for law/line/sum steps, QA note on #332).
