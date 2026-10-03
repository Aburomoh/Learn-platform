# Current State — QA / Test Engineer

Current assignment: Reduced-motion e2e, DragToTarget pointer unit tests, home→activity flake investigation.
Recent important decision: Pointer-drag e2e waits for a shipped activity that uses DragToTarget (none since #25); pointer path unit-tested meanwhile.
Blocker: None. home→activity flake root cause: parallel checkouts shared port 4173 and reused each other's server; fixed (PW_PORT, no reuse).
Relevant issue/PR: this PR; next #61 (wake:qa).
Next expected action: Add pointer-drag e2e when an M1.2 activity ships with drag; QA #61.
