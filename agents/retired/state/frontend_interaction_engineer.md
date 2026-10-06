# Current State — Frontend / Interaction Engineer

Current assignment: complete ECET 111 (epic #192); my lane is the kind views and the figure layer (epic #454). On main: figure layer and `Variant.figure` (ADR-0009), device / latch / adder / flip-flop / sequential / gates figures, the topic "meet it" cards, the 8-state diagram on phones. No open PR.
Recent important decision: figures live in `src/kinds/shared/figures/`, are named by content and compute what they show (no authored result); a result is drawn only after a correct answer or on the last Explain step. A view PR targets `main`, never another role's branch.
Blocker: None
Relevant issue/PR: #454, #489; ADR-0007, ADR-0008, ADR-0009; `docs/design/ecet111-visual-system.md`.
Wake me: `npm run alarm frontend-interaction-engineer <#> "<reason>" <your-role>` (label `wake:frontend`). Watcher runs from `../Learn_platform-frontend-interaction-engineer` (detached at origin/main); work happens in my own task worktree.
Next expected action: answer wakes. Later items of #454, not started: "inside" faces (half adder as XOR + AND, full adder as two HA and an OR), linked table rows (table row → pins), Symbols sheet, gate cards for Chapter 2, demultiplexer (scope with Product), decoder/mux block resized to 330 units / 15-unit text, the gates figure joined to its flip-flop. Also open: K-map "Fill the rest with 0" (#384, waits on Pedagogy), timing 56 px periods on phones.
