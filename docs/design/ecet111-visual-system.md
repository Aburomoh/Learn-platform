# ECET 111 visual system: the symbol beside the concept (UX plan, #454)

Owner directive, 2026-10-05: a student can finish decoders, adders and multiplexers without seeing the
symbols that define them. This plan is Step 1 of epic #454. It adds one reusable figure pattern and says
where each topic uses it. It doesn't redesign any page, and it doesn't replace a working exercise.

Mock-up: `docs/design/ecet111/mockups/visual-system.html`; renders `docs/design/ecet111/renders/visual-system-{1280,390}.png`
(six numbered sections, referred to below as M1–M6). Figures are redrawn in the platform style; nothing is
copied from the slides.

## 1. The idea in one line
**name → symbol → pins → behaviour → question.** Every device a student must recognise in class appears as
its standard symbol at four fixed moments, always the same drawing, so recognition builds by repetition and
not by decoration.

## 2. What the audit found (main, 2026-10-05)
| Topic | Screens that show the device today |
|---|---|
| Full adder | none (two tables, two multiple-choice, one derivation) |
| Half adder | the last challenge only (gate walk) |
| Decoders and encoders | 2 of 6 challenges |
| Multiplexers | 1 of 5 challenges |
| Flip-flops (SR, JK, D, T) | none |
| Analysis of sequential circuits | none (equations only) |
| Latches | yes (figure, #450) |
| Timing and state diagrams | the diagram is the exercise, but the flip-flop it describes is never drawn |

## 3. The four moments
One figure per screen, never more.

1. **Meet it (topic page, M2).** The symbol with one worked case on its pins and three numbered callouts
   ("a code comes in", "101 is 5, so D5 goes to 1", "every other line stays 0"). It takes the place of the
   preview tiles for device topics. No interaction.
2. **Answer on it (challenge, M3).** Any question about a device shows the device: given values printed on
   its pins, the asked pins marked `?` with the halo. For "which line / which input" questions, tapping the
   line is the same as choosing the option. Nothing is lit before a correct answer.
3. **See inside it (hint rung 5 and Explain slowly, M5).** The same block, then "look inside": the pins
   stay where they are and the gates appear between them, one per Explain step, each lighting as the tutor
   names it. This is where symbol meets circuit meaning.
4. **Keep it (completion and review).** The practice summary shows the symbol next to "You can now…". The
   course page gets one quiet link, **Symbols**, to a sheet of all cards met so far (M1), each linking back
   to its topic. This is the review page, with no questions on it.

**Linked views (M4, M6).** Where a table and a device are on the same screen, focusing a row puts that
row's values on the device's pins, with the outputs still `?`. The student reads a case from the symbol, not
only from a grid of digits. The link is one-way (table → figure) and has no animation beyond the 200 ms
colour change.

## 4. The reusable component
Agreed in outline with Frontend's inventory on #454; the Technical Lead decides the schema question.

- **`figures/` library** (shared, lazy-loaded with the question): gate shapes, block symbols, wires, pin
  labels, one style sheet. Symbols: gates (existing), `decoder`, `encoder`, `mux`, `demux`, `adder`
  (half / full; block or gates), `latch` (existing), `flip-flop` (SR, D, JK, T; edge triangle, bubble for
  negative edge), `circuit` (existing layout, read-only), plus the mini clock edge.
- **One `figure` field on the question variant**, drawn by the stage above (phones) or beside (≥ 900 px)
  any kind's answer area. Content names the figure and the given values; anything the figure shows as a
  result is computed, never authored.
- **Three states, the same for every figure:** *given* (values printed) · *focus* (one pin, line or gate
  has the halo; driven by the current goal, a focused table row, or a tutor FOCUS/HIGHLIGHT action) ·
  *result* (after a correct answer or the last Explain stage: the line or path in `--signal-high` with its
  value in words).
- **Two faces per device:** `block` (the exam symbol) and `inside` (gates). Default is `block`; `inside` is
  shown only in Explain slowly, at hint rung 5, or in a "walk the circuit" challenge.
- **Symbol card** (M1): the block, the name, one sentence, up to three pin chips. Used on the topic page
  (large, with callouts), the summary (small) and the Symbols sheet.

### Drawing rules (so every figure looks like one family)
- Body: `--surface` fill, 2 px `--text` stroke, 6 px radius; trapezoid for mux/demux (narrow side at the
  single line); Σ for the full adder, HA for the half adder; flip-flops with the clock triangle on the left
  edge.
- Inputs on the left, outputs on the right, selects and enables from the bottom, MSB on top.
- Pin names in mono, course notation exactly as the lesson uses it (A, B, Ci, S, Co; x y z; D0…D7; I0…I3;
  S1 S0; Q, Q′). A printed value reads `x = 1`.
- Logic 1 that is known: `--signal-high`, 3 px, always with the printed value. Unknown or 0: 2 px muted.
- Asked pin: `?` in `--accent` on a `--focus-halo` chip. Never colour alone.
- Size: at most 330 units wide, text 15 units, never rendered below 0.8× (12 px). The figure sits in a
  `--surface-sunk` well. On a phone it comes **above** the question and is at most 220 px tall; an 8-line
  decoder is the tallest allowed.
- `role="img"` with a sentence that states the device, the given values and, in the result state, the
  answer.
- **When not to show a figure:** when the answer view is itself the diagram (K-map, timing diagram, state
  diagram, gate walk), and on pure algebra steps (derivations) where the device adds nothing.

## 5. Plan per topic
P0 = must-have before the chapter gate · P1 = should-have · P2 = later.

| Topic | Meet it | Answer on it | See inside | Linked view | Priority |
|---|---|---|---|---|---|
| Decoder 3→8 (and 2→4) | block, code 101 → D5 | every "which output" and "Dk as a product" question | decoder as AND gates (2→4 only) | decoder columns table ↔ block | **P0** |
| Encoder 8→3 | block, I6 → 110 | every "which code" question | (none) | encoder table ↔ block | **P0** |
| Multiplexer 4→1 | trapezoid, S1S0 = 10 → I2 | every "predict Y" and "what goes on Ik" question; mux-pairs table shows the mux with the pair's input marked | (none) | mux-pairs rows ↔ data input | **P0** |
| Demultiplexer | mirrored trapezoid | when content exists (not in the pack yet; Product to confirm scope) | | | P1 |
| Half adder | HA block, 1 + 1 → S 0, C 1 | "one row first", S and C table | XOR + AND (M5); the existing gate walk stays as the last challenge | table rows ↔ HA block | **P0** |
| Full adder | Σ block with Ci | "one row first", S and Co table, the Co K-map intro | two half adders and an OR, block level (needs no 5-gate circuit) | table rows ↔ Σ block (M4) | **P0** |
| Functions with a decoder / mux | decoder or mux with an OR gate on the chosen outputs | row-select and mux-pairs screens | | chosen rows ↔ lit outputs | P1 |
| Latches | done (#450) | done | NAND level is the figure | | done |
| Flip-flops SR, D, JK, T | symbol with edge triangle + the mini clock edge | characteristic tables and equations (M6) | (none; latch level is out of scope for the flip-flops) | table row ↔ inputs on the symbol | **P0** |
| Timing diagrams | flip-flop symbol with its edge type | small symbol left of the waveform names (≥ 900 px), above it on phones | | (none: the waveform is the view) | P1 |
| Analysis of sequential circuits | the circuit: flip-flop blocks plus the gate network that drives them, as on the slide | input-equation and state-equation questions, with the flip-flop being asked about in focus | | state-table row ↔ present-state values on Q pins | **P0** for the block-level circuit; P1 for the row link |
| State diagrams | (the diagram is the view) | | | state-table row ↔ arrow, at hint rung 5 only (already specified) | done |
| Basic and derived gates (Ch 2) | gate symbol card per gate on the topic page | gate tables show the gate's symbol above the table | | table row ↔ gate inputs | P1 |
| Symbols sheet | | | | | P1 |
| Summary card | | | | | P2 |

## 6. Phone and desktop
- **390 px:** figure first (≤ 220 px tall), then the prompt, then the answer. With a table, the figure is
  sticky-free: it scrolls with the page, and the focused row's values are also announced in the goal line,
  so nothing depends on seeing both at once.
- **≥ 900 px:** two columns inside the stage card (answer area left, figure right, as in M3–M6). The tutor
  column is unchanged.
- No figure adds a second scroll direction: wider than the well is not allowed (the 330-unit cap).

## 7. Pedagogy guards (for Step 2)
- The figure never shows the answer before a correct check; `result` is the only state that lights a line.
- Linked views show the **inputs** of the focused row, never its outputs.
- Callouts on the topic page use a worked case with numbers the practice doesn't ask.
- "See inside" opens only in Explain slowly or at hint rung 5, so the student first tries with the symbol.

## 8. Build order proposed
1. Shared figure layer + `figure` field + decoder/encoder/mux moved onto it (no new drawing; unlocks P0 for
   Chapter 4 devices).
2. Adder blocks (HA, Σ) with the `inside` face for the half adder.
3. Flip-flop symbols and the mini clock edge.
4. Topic-page "meet it" card (replaces the preview tiles on device topics).
5. Linked views (table row → pins).
6. Sequential-circuit block figure for the analysis topic.
7. Symbols sheet; gate cards for Chapter 2; summary card.

Steps 1–3 and the wiring of their P0 screens are the must-haves before the Chapter 4 and 5 gates.

## 9. Decisions asked for
- **Technical Lead:** `figure` on the variant (preferred: one place, every kind) versus widening `context`.
- **Pedagogy:** the guards in §7; whether the topic-page callouts may show one fully worked case.
- **Product:** is the demultiplexer in ECET 111's assessed scope (it isn't in the Chapter 4 pack)?

## 10. Symbols, sheet 2 (for build steps 2, 3 and 6)
Mock-up `visual-symbols-2.html`, renders `visual-symbols-2-{1280,390}.png`. Same drawing rules as §4.
- **Flip-flops (D, T, SR, JK):** one body for all four, 90 × 116 units. Inputs on the left (one input centred
  high; two inputs above and below the clock), the clock triangle on the left edge, Q top right and Q′ bottom
  right. The type letter and "flip-flop" sit inside the body.
- **Negative-edge trigger:** a bubble in front of the clock triangle. Wherever a flip-flop is shown with a
  timing diagram or an edge question, the mini clock edge beside "Clk" points the same way as the trigger.
- **Demultiplexer:** the mux mirrored (one data line in on the narrow side, outputs on the wide side,
  selects from the bottom). Build it only if Product confirms it is in scope.
- **Full adder, inside:** two HA blocks and one OR gate, block level. The half adders carry small S and C
  pin names inside their right edge; a dashed `--brand` frame marks "inside the Σ block".
- **Sequential circuit (analysis):** one gate block that carries the input equations, the flip-flops as
  symbols to its right, feedback from each Q around the outside back to the gate block, the clock along the
  bottom. The flip-flop the current question asks about takes the focus halo. The circuit's output (y) leaves
  the gate block; draw it only on questions about the output.
- Composite figures (the last two) may be up to 360 units wide with 15-unit text, so they stay at 12 px or
  more on a 390 px phone.

## 11. "Meet it" cards for the P0 topics (build step 4)
One card per topic page, in place of the preview tiles: the symbol in its *result* state for one worked
case, and exactly three callouts (what comes in, what the device does, what comes out). Each callout is one
short sentence, numbered, 15 px. No case repeats a practice's numbers (preview guard); the adder and flip-flop cases are rows of a complete fixed table, so they cannot avoid it and are allowed.

| Topic | Figure and worked case | Callouts |
|---|---|---|
| Decoders | 2→4 decoder, x y = 1 0, D2 lit (a size no 3→8 question can repeat) | 1. A code comes in: x y = 10. · 2. 10 is 2, so line D2 goes to 1. · 3. Every other line stays 0. |
| Encoders | 8→3 encoder, I5 = 1, outputs 1 0 1 | 1. One input line is 1: I5. · 2. The encoder writes its number in binary. · 3. 5 is 101, so x y z = 101. |
| Multiplexers | 4→1 mux, S1 S0 = 0 0, path I0 → Y | 1. Four data inputs wait at the left. · 2. The selects say 00, which is 0. · 3. So Y copies I0, whatever I0 is. |
| Half adder | HA block, A = 1, B = 1 → S = 0, C = 1 | 1. Two bits come in: 1 and 1. · 2. 1 + 1 is 2, written 10 in binary. · 3. S is the 0, C is the carry 1. |
| Full adder | Σ block, A = 1, B = 0, Ci = 1 → S = 0, Co = 1 | 1. Two bits and a carry in. · 2. 1 + 0 + 1 is 2, written 10. · 3. S is the 0, Co carries the 1 to the next column. |
| Flip-flops | D flip-flop, D = 1, Q(t) = 0, rising edge → Q(t+1) = 1 | 1. Q holds one bit: now 0. · 2. Nothing changes until the clock edge. · 3. At the edge Q takes D, so Q becomes 1. |
| Analysis | the block-level circuit (§10), no values | 1. The gates work out each flip-flop's input. · 2. At the clock edge the flip-flops store them. · 3. Their outputs feed back, so the present state shapes the next. |

- **Layout:** as in M2. From 900 px the card sits to the right of the title and the Start button; on a phone
  it sits between the "Today" line and the Start button, figure first, callouts under it. The card never
  pushes the Start button below the first screen on a 390 × 844 phone: if it would, the callouts collapse
  behind "How it works" (closed by default) and the figure stays.
- **Numbering:** the three callouts carry `--brand` numbered discs; the matching pins on the figure carry
  the same small numbers (1 at the inputs, 2 inside the body, 3 at the outputs), so text and picture point
  at each other without arrows.
- **Topics with several devices** (flip-flops: SR, D, JK, T) show one card (the D flip-flop) and a quiet
  "All four symbols" link to the Symbols sheet.
- The tutor's one line stays where it is; the card doesn't replace it.
