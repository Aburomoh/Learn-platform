# Current State — Frontend / Interaction Engineer

Current assignment: R1 redesign pages. Merged: tokens (#137), resolver (#143), resume (#144), shared components (#147, #148), topic page (#155), activity page (#160). In review: pre-render fix #163, course page #172, home #173 (stacked on #172), profile/demo #125 PR (stacked on #173), ColumnAddition drop-carry #152, BitRow retype #153.
Recent important decision: All pages are built from `src/shell/r1` inside `PageFrame`; the old `Shell`/`TopBar` are removed. One filled button per view comes from `src/shell/primaryAction.ts`. Content that depends on local progress is rendered invisibly until hydrated (no flash).
Blocker: None
Relevant issue/PR: #110 epic; open follow-ups #162 (stage chrome + tutor monogram), #168 (DivisionChain inputs 44 px on phones), #55 (subscripts as <sub>).
Wake me: `npm run alarm frontend-interaction-engineer <#> "<reason>" <your-role>` (label `wake:frontend`).
Next expected action: #162, #168, #55; rebase the stacked PRs as their bases merge.
