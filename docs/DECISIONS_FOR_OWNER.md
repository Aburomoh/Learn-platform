# Decisions for the Owner

Only items that genuinely need Dr. Mohannad. Routine engineering choices are in `docs/adr/`.
Development does not wait on any item below; content that depends on an unconfirmed answer waits on its own.

## Open: answer confirmations

### A1. Chapter 4, slide 56: MUX with w on the data input
Source: Ch.4 deck, slide 56 (question only, no answer on the slide).
Issue: Implement F(w,x,y,z) = Σ(1,2,5,11,13) (the function of slides 52–55) with an 8-to-1 MUX, selects x → S2, y → S1, z → S0, and w on the data inputs.
Team answer (machine-worked, re-checked by hand): I0…I7 = 0, w′, w′, w, 0, 1, 0, 0.
Ambiguity: the team assumes the slide means "same F, but w as the data variable". If another arrangement was intended, say which.
Decision needed: confirm, or give the intended arrangement.

### A2. Chapter 5, computed answers (#293 design problems, #317 analysis exercises)
Source: Ch.5 Part III s.28–34 and Part II s.31–33, s.53–54 (no slide answers): `docs/content-packs/ecet111/ch5-partiii.md`, `ch5-partii.md`, rows marked "computed, not on the slides".
Issue: equations, state tables and timing traces computed by the team; timing traces assume start state 000.
Team recommendation: accept the computed answers and the 000 start state, stated in each prompt.
Decision needed: confirm (or correct any row).

## Open: slide notes that change what students practise

### S1. Chapter 5 Part II, slides 14–15 vs 16–23
Source: Ch.5 Part II, s.14–23.
Issue: the circuit posed on s.14–15 (JA = Bx, KA = B, JB = x′⊕A, KB = A, z = A′ + x) is not the one solved on s.16–23 (JA = B, KA = Bx′, JB = x′, KB = A⊕x, no output).
Team recommendation: practise the solved circuit (s.16–23); use the posed one only after you confirm the team's machine-worked answer for it.
Decision needed: which circuit is intended.

### S2. Chapter 5 Part III, slide 34
Source: Ch.5 Part III, s.34 vs s.28–29.
Issue: s.34 adds an arrow 011 → 000 labelled 1/1, but 011 already goes to 110 on input 1 (1/0), so 011 has two transitions for X = 1.
Team recommendation: follow s.28–29 (011 → 110 on 1/0).
Decision needed: confirm which transition is intended.

### S3. Chapter 5 Part I, timing exercises (s.21–37)
Source: Ch.5 Part I, s.21–37; s.27 vs s.29; s.28; s.37.
Issue: no exercise states the initial Q; s.28 (JK, falling edge) and s.37 (T) have inputs changing exactly on active edges; s.27 and s.29 differ in J for columns 29–34.
Team recommendation: the platform uses its own shorter timing exercises with the initial Q always stated and no input changing on an active edge; the slide versions are not used as-is.
Decision needed: none unless you want the slide exercises used verbatim.

### S4. Chapter 1, slide 20
Source: Ch.1, s.20.
Issue: titled "Octal To Decimal Conversion" but asks to convert (166)₈ into binary, with no working; 166 is also the decimal answer of s.21's (246)₈.
Team recommendation: not used as an exercise until clarified.
Decision needed: the intended conversion.

### S5. Chapter 2, page 64
Source: Ch.2 deck, p.64.
Issue: the first term of the F(A,B,C) example has one bar across ABC, which reads (ABC)′ (not a minterm; F would be always 1).
Team recommendation: read it as A′B′C′, giving F = Σ(0,3,5,7).
Decision needed: confirm.

Slide slips that do not affect practice (for your deck only, no decision needed): Ch.2 p.34–36 (Y vs X), p.39–40 (junction dot on A/B); Ch.3 s.50–62 (minterm column rendering), s.58 (C for D′ in m12, m8), s.96 (F(A,B,C,D) label and missing Σ on a 3-variable map; answer F = C), s.108 (italic 1); Ch.4 s.13 (C₀), s.42 (stray "66"), s.54 (I1 bar renders as a dot), "Multiplixers" s.38–46; Ch.5 I s.13, s.31 ("(a)" twice); Ch.5 II s.51 (output column printed xB′, unlabelled diagram), s.52 (no start state), s.14–15/37–39 (Schmitt marks); Ch.5 III "Sate Diagram" s.28/30/32, s.31 blank columns.

## Non-blocking owner checks
- Phone check (#153): type bits into a filled row on a real phone and confirm each digit lands in the next cell. Development and merges do not wait for it.

## Resolved
- 2026-10-04 — Owner decisions (Technical Lead session):
  - **Vercel previews:** approved; the owner grants the Vercel GitHub app selected-repository access to `Aburomoh/Learn-platform`, then Release/DevOps runs `vercel git connect` for automatic PR previews. Manual `vercel deploy` previews until then; never `--prod`.
  - **Phone check #153:** non-blocking real-device item (above).
  - **Old commit email addresses:** leave history as-is; no history rewrite or force-push of `main`.
  - **M1.1 / M1.2 / redesign R1:** explicitly accepted as the current direction; reopen only for a regression or a concrete problem.
  - **Tutor images:** supplied. Pose library at `C:\Users\mnabu\OneDrive\Documents\Claude\Learn_platform\MyPics\tutor-pose-library` (expressive extension in `\expressive`); integration in #355 and #378. Only processed images are committed.
  - **Source materials:** ECET 111 materials at `C:\Users\mnabu\OneDrive\Documents\Claude\Learn_platform\ECET111 materials`, syllabus `…\ECET111 materials\ECET111- Syllabus-Fall2026.pdf` (git-ignored; never committed or uploaded).
  - **Release policy unchanged:** preview-only; ECET 111 completing does not trigger production; production when ready and with at least three courses.
  - **Chapter 3 K-map answers:** the machine-worked answers in `ch3.md` are confirmed (quoted on #192).
- 2026-10-04 — Owner decisions (quoted on #192): issue comments limited to collaborators (renew every 6 months, #256); topic preview keeps 53; three, sometimes four, number sets per question (random numbers later, curated); commits use the GitHub private address.
- 2026-10-04 — Restart procedure adopted: `agents/SESSION_PROMPTS.md` (#368); dispatcher-style wake mechanism under investigation (#374); syllabus week hints (#376).
- 2026-10-03 — Redesign proposal (epic #110, PR #129, `docs/design/redesign-r1/`): approved as the direction. Frontend unblocked.
- 2026-10-03 — Repository: **public**, with `main` protected (PR only, green CI, linear history); see #72. Never post secrets or slide content. (Created private by the owner on 2026-10-03, made public the same day.)
- 2026-10-03 — Pedagogy vetoes #42, #44, #45 accepted; rule: each step of a multi-step answer is its own goal, one at a time; be patient with students.
- 2026-10-03 — Session-start alarm hook in `.claude/settings.json` (PR #26): approved, merged.
- 2026-10-03 — M1 walkthrough given: steps too large, circuit unclear → M1.1.
- 2026-10-03 — First demo topics: basic logic gates and number-system conversions.
