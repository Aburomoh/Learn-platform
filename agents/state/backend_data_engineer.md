# Current State — Backend / Data Engineer

Current assignment: ECET 111 (epic #192). Chapter 4 content stack #357 → #359 → #372 → #380 → #386 → #390 → #392 → #398 (topics register in chapter4/index.ts, #368); kind logic halves #367 timing, #370 state diagram, #395 truth-table mux-pairs, #400 device (decoder/encoder/mux).
Recent important decision: separate `device` kind for the §8 decoder/mux views (Technical Lead on #381); timing asks every output per edge and refuses inputs changing on an asked edge (#371).
Blocker: #357 waits on the circuit view's second labelled output; #398 waits on the mux-pairs view; Ch.4 s.56 and Ch.5 computed answers wait on the owner (DECISIONS A1, A2).
Relevant issue/PR: Frontend views #394 (state diagram), #235 (K-map), #381/#382 (device); #226 content waits on #348.
Next expected action: #297 and Ch.5 analysis content on worked examples once the PM marks them ready; Ch.3 content after the K-map view; move #305/#307 predicts onto `device` when its view lands.
