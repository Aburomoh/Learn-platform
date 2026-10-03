# Current State — QA / Test Engineer

Current assignment: QA on wake:qa alarms; passed #61 #62 #65 #69 #73 #76 #77 #79 #83 #84 #87 #90 #91 #102.
Recent important decision: e2e runs use a per-worktree `PW_PORT` and never reuse a server (#81); this fixed the cross-checkout flake.
Blocker: None. Open: #100 hydration mismatch on the gates page (Frontend); guest-flow network assert failed twice under load, URL not yet captured.
Relevant issue/PR: #100, #74 (fixed by #76).
Next expected action: Make the guest-flow network assert print the URLs it caught; add pointer-drag e2e once a drag activity ships.
