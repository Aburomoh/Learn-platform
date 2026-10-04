# Current State — Backend / Data Engineer

Current assignment: ECET 111 (epic #192). Ch.4 stack #357 → #359 → #372 → #380 → #386 → #390 → #392 → #398; Ch.5 stack #403 latches → #406 tables → #408 equations → #413 / #415 / #418 analysis stages 1–3; kind logic #367 timing, #370 state diagram, #395 mux-pairs, #400 device.
Recent important decision: separate `device` kind for decoder/encoder/mux (Technical Lead on #381; detector renamed `code-reversed` in #407); state-diagram layout fallback `stateCells` shared with the view.
Blocker: #357 waits on the circuit view's second labelled output; #398 on the mux-pairs view; Ch.4 s.56, Ch.5 computed answers and the s.14–15 circuit wait on the owner (DECISIONS A1, A2, S1).
Relevant issue/PR: views #394 (state diagram), #407 (device), #235 (K-map); #226 waits on #348.
Next expected action: move #386/#392 predict questions onto `device` once #407 merges; #298/#315 when the timing and state-diagram views land; Ch.3 content after the K-map view; re-merge main up both stacks as PRs land.
