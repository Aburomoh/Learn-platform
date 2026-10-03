# ECET 111 representations, Chapters 2–5 (UX, #198)

Epic #192. This extends R1 (`docs/design/redesign-r1/README.md`); it does not redesign the platform.
Kinds and steps follow `docs/design/course-map-ecet111.md` and ADR-0007/0008. Layouts were read from the
owner's local slides (shape positions and rendered figures, nothing copied). Mock-ups:
`docs/design/ecet111/mockups/*.html` (open in a browser), renders in `docs/design/ecet111/renders/`
at 1280 and 390 px. Examples in the mock-ups are illustrative, not content.

| Render | Shows |
|---|---|
| `course-5-*` | Course page with five chapters |
| `home-5-*` | Home with a chapter strip |
| `kinds-a-*` | Truth table · expression entry · derivation |
| `kinds-b-*` | K-map (3 variables, wrapping group) |
| `kinds-c-*` | Timing diagram · state table · state diagram |
| `kinds-d-*` | Mux and decoder views |

## 1. Shared grammar for every kind
- **One goal at a time** (PEDAGOGY.md). A goal line under the prompt names it in words
  ("Column AB'", "Group 2 of 2", "Edge 4 of 6", "Arrow 01 → 11").
- **States**, each carried by shape and text as well as colour:
  - *Now*: `--focus-halo` behind the active cells, column, group, edge or line, plus a 2 px `--accent` outline on the inputs.
  - *Done*: normal text on `--surface`.
  - *Later*: `--pending-opacity`, values hidden, headers still visible so the student sees the plan.
  - *Try again*: `--error-bg` with a 2 px `--error` border and a ✕ glyph. The feedback line says what to look at.
  - Each card ends with a small legend.
- **Sizes:**
  - Every tappable cell is at least 44 px tall and 36 px wide on phones.
  - All text, including SVG labels and K-map minterm numbers, is at least 12 px (`--diagram-text-min`).
  - Diagrams compact or scroll inside their well (`--surface-sunk`, no border); the page never scrolls sideways.
- **Values:** in mono. Logic 1 on wires and paths uses `--signal-high`, always with a printed 0/1 or the value named in words.
- **Actions:** one filled action per challenge ("Check column", "Check group"…). Hint and Explain slowly stay quiet text actions (#182).
- **Explain slowly:** reuses the same view read-only, with the halo moving step by step. No separate diagrams.

## 2. Truth table (N-truth-table, incl. row-select mode)
- **Layout:** inputs on the left, then intermediate columns (A', B', AB'…), the output last, as on the slides.
  - A 2 px vertical rule separates inputs from the derived columns and the derived columns from the output.
  - Rows run in ascending binary, all zeros first. At most 4 inputs (16 rows), with alternate rows lightly banded.
- **Optional minterm column:** `m0…m15`. Where the slide puts it depends on the table: the right edge for canonical-form tables, the first column for decoder and mux tables. It's a spec option.
- **Filling:** one column per goal.
  - Tap a cell to cycle empty → 0 → 1 → empty (X added when the spec allows don't-cares). Keys 0/1/x type, arrows move.
  - Later columns stay visible but empty and dim.
  - Wrong cells are marked individually after Check; correct cells keep their value.
- **16-row tables on phones:** sticky header row. Cells are 36 × 44 px, so 7 columns fit in 358 px. Wider tables scroll inside the well with a fade edge and the active column scrolled into view.
- **Row-select mode:** a check column ("pick the 1-rows", "decoder outputs for S"), or a per-row choice of 0 / 1 / z / z' for mux design. The choice opens as chips under the row on phones.
- **State tables** use the same component with two-level headers: Present state | Input | Next state | (Flip-flop inputs) | Output.
  - Each column group has a soft band as on the slides: `--accent-soft`, `--brand-soft`, `--success-soft` and `--surface-2`, all at reduced strength. The band is a grouping cue only; the group header carries the meaning.
  - Unused states and don't-cares are a capital X.

## 3. Expression entry (N-expression)
- **Notation:**
  - The slides mix an overbar (the instructor's own slides) and a prime (textbook pages). Students type the prime, which works on any keyboard. Under the field, a "Reads as" preview renders the overbar, so what they see matches the lecture.
  - `.` is accepted for AND and shown as juxtaposition. `+` is OR, `⊕` is XOR, parentheses as usual.
- **Phone keys:** a key row under the field, 48 px keys: the variables in use (A B C D, or x y z w per spec), `'`, `+`, `⊕`, `(`, `)`, ⌫.
  - Operator keys have `--accent-soft` fill and aria-labels ("complement (NOT)", "OR"…).
  - The row also shows on desktop as an aid; typing works everywhere.
- **Feedback** is about meaning, not text (graded by equivalence): "Correct but not simplified" gets its own nudge (course map).

## 4. Derivation (N-derivation)
- **Layout:** one line per step, numbered, in mono, with the law name muted on the right. On phones the law goes under the line. The first line reads "Given".
  - The slides show the steps with aligned "=" and keep the laws on separate rule slides. Naming the law on each line is our training step (course map); its wording comes from the same rule set.
- **Two goals per line:**
  1. Choose the law, from 3–4 chips.
  2. Give or choose the line it produces.

  While the student chooses the law, the sub-expression it applies to is highlighted in the previous line (`.hl`), and the new line is an empty dashed slot.
- Later lines show only "…" at `--pending-opacity`.

## 5. K-map (N-kmap)
- **Geometry (slides):**
  - 3 variables: 2 × 4 grid, A on the rows (0, 1), BC on the columns.
  - 4 variables: 4 × 4 grid, AB rows × CD columns.
  - Labels in Gray order 00 01 11 10 on both axes. The corner is split by a diagonal, with the row variable bottom-left and the column variables top-right.
  - Bars outside the grid mark where each variable is 1, labelled with the variable. The slides colour them; we keep one colour and rely on the letter.
  - No 2-variable map appears on the slides. The component supports it (2 × 2) for completeness, but content should not need it.
- **Cells:** 56 px (52 px on phones). The minterm number sits in the top-left at 12 px muted ("m5"), the value centred in large mono. Don't-care is an italic x in `--text-muted`.
- **Steps:**
  1. Fill the map from Σ, one goal: tap cells to cycle the same way as the truth table.
  2. For each group, two goals: tap its cells (selected = halo + accent inset), then write its term in the group list.
  3. F is the last goal.
- **Groups:** a rounded outline per group, each with its own colour **and** line style (solid, dashed, dotted) **and** a numbered badge. The same badge prefixes the term in the list beside the map, below it on phones. Groups may overlap.
  - *Wrapping groups* are two open halves at opposite edges with the same badge, as on the slides. A four-corner group is four quarter-shapes.
  - The slides fill groups with translucent colour. We use outlines so the 0/1 values stay readable, and the badge and line style carry the identity without colour.
- **4-variable on phones:** 40 + 4 × 52 = 248 px plus the bars fits in 358 px. The group list goes under the map.

## 6. Timing diagram (N-timing)
- **Layout (slides):** time runs left to right. Inputs on top, clock in the middle, outputs at the bottom.
  - Signal names sit on the left in italic bold, in a fixed column that stays put while the diagram scrolls on phones.
  - A dotted vertical guide at every active edge, and the trigger edge stated in the prompt ("positive-edge triggered"). The slides use a red ring and a corner tag; we use the halo and words.
- **Step = one active edge.** The active edge gets a halo column and a "?" on the output row. The goal line names the edge and the input value at that edge ("Edge 4 of 6 (rising): D is 1").
  - The student answers with a 0 / 1 segmented control (48 px). The output trace then draws to the next edge in `--signal-high`.
  - Initial Q is always stated (course map).
- **Phones:** the SVG keeps its 12 px text and scrolls inside the well with the active edge scrolled into view. The names column stays fixed.

## 7. State diagram (N-state-diagram)
- **Layout:** pre-drawn, never free-drawn. Circles carry the binary state code. Arrows curve, self-loops sit above the circle, and labels read input/output (Mealy) or input only, as on the slides. On wide screens the diagram sits beside its state table.
- **One goal = one arrow:**
  - The active arrow is `--accent`, 3.5 px, with a haloed label slot ("?/?"). The student picks the label from 4 chips.
  - Done arrows are solid with their label. Later arrows are dashed and dim.
- Text is 14 px mono in a scalable SVG (≥ 12 px at 390 px, since the diagram is 360 units wide).

## 8. Mux and decoder views (E-circuit-predict modes)
- **Mux:** a trapezoid (the slides' pentagon) with I0…In on the left, top to bottom. Select lines enter from the bottom, labelled with their values (S1=1, S0=0). Y is on the right.
- **Decoder:** a rectangle labelled "2→4 DEC". Inputs enter on the left with their values, outputs D0…Dn leave on the right with printed values.
- **Predict first** (course-map rule): the student names which input reaches Y, or which output is 1. After the answer, the selected path or line is drawn in `--signal-high` and the value is printed.
- The full table follows as a truth-table challenge.

## 9. Navigation at five chapters
- **Course page:** one collapsible section per chapter (`<details>`).
  - The summary row shows the chapter number tile, the title, a status and a slim progress bar (hidden on phones). The status is *Not started* (ring), *In progress · n of m topics* (half-filled `--brand` ring) or *Completed* (`--success` disc with a check).
  - The chapter with the next action opens by default; the others stay closed.
  - Inside, topic rows keep the R1 row: preview glyph, title, one-line route, status, one action. The page still has exactly one filled button.
- **Chapter index (≥ 900 px):** a sticky right rail listing the five chapters with their status shapes. The current chapter is a raised row. The tutor line sits under it.
- **Chapter 5** comes in three parts on the slides (latches and flip-flops; analysis; design). Show them as three topic groups inside chapter 5 with small sub-headings, not as separate chapters.
- **Home:** the "Pick up" panel is unchanged. The course row gains a chapter strip (`Ch 1 … Ch 5` with status shapes and screen-reader text such as "Chapter 2, in progress") and "1 of 5 chapters completed".
- **Status rules** (derived from local progress only, no scores):
  - A chapter is Completed when all its topics are.
  - A chapter is In progress when any practice is started.
  - Topic rules are as in #172.

## 10. Preview glyph per topic family (≤ 200 × 48, one line)
| Family | Glyph |
|---|---|
| Ch 1 numbers | notation tiles (as now) |
| Gates and truth tables | 2-input mini table, output column in `--signal-high` |
| Expressions, laws, De Morgan | one expression tile (never the practice's own expression) |
| K-maps | 2 × 4 mini map with one group shaded |
| Mux / decoder | mini trapezoid with the selected path |
| Flip-flops, timing | clock square wave over one Q trace |
| Analysis / design | two state circles with one labelled arrow |

Glyphs are `aria-hidden`; the row title carries the meaning. The Logic gates demo topic is replaced by Chapter 2, so its missing preview (#172) goes away.

## 11. New design tokens
None. The kinds use the existing R1 tokens plus `--focus-halo`, `--pending-opacity`, `--signal-high/-low`,
`--diagram-text-min` and `--sub-size`. Two component sizes are documented here instead: K-map cell 56/52 px
and truth-table cell 44/36 px.

## 12. For Frontend (one kind per folder, ADR-0008)
Build order follows the course map. Each kind's README links back to its section here. A kind is done for UX when:
- its 390 and 1280 renders match the sections above
- a test asserts no text under 12 px and no tappable element under 44 px tall
- states are distinguishable in grayscale
