# Localization audit — Arabic, Phase 1

Reported separately from the inventory, as the owner asked. Method: (1) the supportive text authored as data was read from the loaded course objects (`src/content/**`), so every hint, scaffold step, feedback line and nudge key that the app can show is counted, not only what a text search would find; (2) `src/tutor/messages/en.ts` was read as the shared catalog; (3) every non-test `.ts` and `.tsx` file under `src/` outside `src/content` was scanned for string literals, JSX text and label attributes. The scan of components is a regex scan and is **a lower bound**: strings built from several constants, or held in data tables in a component, can be missed. Each finding below names its file so the UI engineer can confirm.

## 1. Strings hard-coded in UI components

257 candidate strings in 56 files (developer-only messages such as zod schema errors and "No … step" guards are excluded; they never reach a student). They are not in the tutor catalog, so Phase 2 would have to move them there before they can be translated. The directive keeps button and label chrome out of the inventory; those strings are listed here so the owner can decide whether chrome is in scope.

Already in `source-texts.json` as teaching text inside components: 28 entries with ids starting `component.`. The rest are chrome or accessible names.

| File | Strings | Examples |
|---|---|---|
| `src/kinds/cpu-schedule/CpuSchedule.tsx` | 27 | “Segments so far: ${segments.slice(0, drawn).ma”; “No segment yet.”; “Segment ${g.segment + 1} · starts at ${fmt(g.t” |
| `src/kinds/memory-map/MemoryMap.tsx` | 27 | “Partition table”; “Partition table”; “Internal waste” |
| `src/interactions/BitGrouping/BitGrouping.tsx` | 15 | “Bit ${index + 1} of ${total}: ${bit}${added ? ”; “Add 0 in front”; “Remove a leading zero” |
| `src/shell/SettingsForm.tsx` | 12 | “Light is the default. Choose Dark, or let the ”; “Match device”; “Tutor typing” |
| `src/interactions/ColumnAddition/ColumnAddition.tsx` | 11 | “the final carry”; “Binary addition, one column at a time”; “Final carry: bit to bring down” |
| `src/shell/r1/HomeNext.tsx` | 10 | “Challenge ${done + 1} of ${total} · about ${le”; “Welcome back”; “You have finished every topic” |
| `src/interactions/DivisionChain/DivisionChain.tsx` | 9 | “Repeated division by 2”; “The result reached 0, so the division stops.”; “remainder” |
| `src/kinds/base-to-decimal/WeightDiagram.tsx` | 9 | “Power under digit ${i + 1} (${d.digit})”; “Digit ${i + 1} (${d.digit}) as a number, times”; “Sum in decimal” |
| `src/kinds/state-diagram/StateDiagram.tsx` | 9 | “State diagram with states ${states.join(", ")}”; “State diagram, scrolls sideways”; “Next state: ${states.join(", ")}” |
| `src/kinds/truth-table/TruthTable.tsx` | 8 | “Truth table, filling column ${active.header}”; “Truth table, ${select.label}”; “Truth table, ${pairs.header} per pair of rows” |
| `src/kinds/circuit-predict/ui.tsx` | 6 | “Explore: toggle the inputs and watch the outpu”; “Expression at the output of the ${gate.type} g”; “Expression at the output of the ${gate.type} g” |
| `src/shell/r1/ProfileMenu.tsx` | 6 | “You are a guest.”; “Match device”; “Profile and settings” |
| `src/interactions/HintReveal/HintReveal.tsx` | 5 | “Break it down”; “Similar example”; “Full explanation” |
| `src/kinds/derivation/ui.tsx` | 5 | “name the law”; “give the line”; “Which law takes line ${i + 1} one step further” |
| `src/shell/r1/CourseTopics.tsx` | 5 | “Not started · Coming soon”; “In progress · ${done} of ${total} topic${total”; “Not started” |
| `src/stage/ActivitySummary.tsx` | 5 | “Practice complete”; “Practice complete”; “no hints needed” |
| `src/stage/ActivityRunner.tsx` | 4 | “Done. Come back any time to practise again.”; “Try once first”; “Next challenge” |
| `src/stage/QuestionView.tsx` | 4 | “Not correct yet.”; “Explanation”; “Question” |
| `src/app/not-found.tsx` | 3 | “That page does not exist in this course compan”; “Back to home”; “Not found” |
| `src/kinds/cpu-schedule/logic.ts` | 3 | “First Come First Served”; “Shortest Job Next”; “Round Robin” |
| `src/kinds/device/DeviceDiagram.tsx` | 3 | “Which output is 1?”; “Output code”; “Which input reaches Y?” |
| `src/kinds/device/ui.tsx` | 3 | “which output is 1?”; “what is the output code?”; “which input reaches Y?” |
| `src/kinds/kmap/ui.tsx` | 3 | “Term for group ${goal.group! + 1}”; “F, the simplified function”; “Groups” |
| `src/kinds/shared/calc.ts` | 3 | “Bad number at ${i + 1}”; “Unfinished expression”; “Out of range” |
| `src/kinds/shared/Calculator.tsx` | 3 | “Cannot work that out”; “Calculator”; “Equals” |
| `src/kinds/shared/figures/circuit/CircuitDiagram.tsx` | 3 | “Circuit diagram, scrolls sideways”; “Circuit with ${spec.gates.map((g) => g.type).j”; “s expression above its output; an output gate” |
| `src/kinds/shared/figures/FileLayoutFigure.tsx` | 3 | “Sequential file: records ${records.join(", ")}”; “Direct file with ${count} slots: each key's ad”; “Indexed sequential file: ${blocks.length} bloc” |
| `src/kinds/shared/figures/SequentialFigure.tsx` | 3 | “Sequential circuit. A gate block with the inpu”; “Its output feeds”; “Their outputs feed” |
| `src/kinds/state-diagram/ui.tsx` | 3 | “State table”; “Show only the rows of ${current}”; “Show whole table” |
| `src/shell/r1/Chrome.tsx` | 3 | “Optional practice, not graded”; “Progress stays in this browser”; “Demo content” |
| `src/tutor/ui/TutorPanel.tsx` | 3 | “Show less of the tutor message”; “Show the whole tutor message”; “Tutor” |
| `src/kinds/shared/ExpressionEntry.tsx` | 3 | “(prec(x)”; “Expression keys”; “delete” |
| `src/interactions/NumericInput/NumericInput.tsx` | 2 | “digits 0 to 9 and letters A to F”; “digits 0 to 9${signed ? ", a leading minus sig” |
| `src/kinds/kmap/KarnaughMap.tsx` | 2 | “m${m}, ${rowName(r)}, ${colName(c)}: ${text}${”; “Check group” |
| `src/kinds/shared/contextSpec.ts` | 2 | “bits are 0s and 1s”; “operands must have equal width” |
| `src/kinds/shared/figures/BlockFigure.tsx` | 2 | “Full adder”; “Half adder” |
| `src/kinds/shared/figures/LatchFigure.tsx` | 2 | “NAND SR latch: S and the output of the lower g”; “Gated SR latch: S with En, and R with En, each” |
| `src/kinds/shared/figures/TopologyFigure.tsx` | 2 | “A central node with ${n} other nodes, each lin”; “A central hub with three nodes, linked by one ” |
| `src/kinds/shared/figures/TracksFigure.tsx` | 2 | “A platter with four separate rings, one inside”; “A platter with one track spiralling out from t” |
| `src/kinds/timing/TimingDiagram.tsx` | 2 | “Timing diagram, ${edgeName}-edge triggered. ${”; “Timing diagram, scrolls sideways” |
| `src/kinds/truth-table/ui.tsx` | 2 | “Data input I${pairs[done].select}”; “choiceName(p.choice, data)), done, active: don” |
| `src/shell/primaryAction.ts` | 2 | “Next topic”; “the next practice, ${nextPractice.title}” |
| `src/shell/r1/TopicNext.tsx` | 2 | “Completed. You can review it any time.”; “In progress” |
| `src/kinds/derivation/DerivationLines.tsx` | 2 | “Derivation”; “(to find)” |
| `src/stage/SkipMenu.tsx` | 2 | “More”; “Confirm skip” |
| `src/tutor/ui/TutorCard.tsx` | 2 | “Tutor”; “Tutor” |
| `src/app/courses/[course]/[topic]/page.tsx` | 1 | “What you&apos;ll practise” |
| `src/interactions/DragToTarget/DragToTarget.tsx` | 1 | “Grabbed ${itemLabel(items, itemId)}. Use arrow” |
| `src/kinds/derivation/logic.ts` | 1 | “Distributive (multiply out or factor)” |
| `src/kinds/memory-map/logic.ts` | 1 | “relocatable dynamic partitions” |
| `src/kinds/shared/figures/circuit/GatesFigure.tsx` | 1 | “Gates that drive ${output}: ${describeWiring(c” |
| `src/kinds/shared/figures/TapeFigure.tsx` | 1 | “Tape with ${records} records${block && block >” |
| `src/tutor/ui/TutorBubble.tsx` | 1 | “Show the whole message” |
| `src/app/settings/page.tsx` | 1 | “Settings” |
| `src/interactions/BitRow/BitRow.tsx` | 1 | “Bit ${i + 1} of ${n}, under ${bit}” |
| `src/kinds/expression/ui.tsx` | 1 | “Expression” |

### Student-facing strings that are built into data inside components

| Where | What | Why it matters |
|---|---|---|
| `src/kinds/cpu-schedule/CpuSchedule.tsx` (lines 113–138, 191, 261, 292, 327–363) | Step prompts such as "Segment N · starts at T: which job runs?", the average-turnaround formula line, the policy names | The step prompts are question text (English by rule) but are assembled in the component, so a future decision to translate them would need a catalog entry per pattern. |
| `src/kinds/cpu-schedule/logic.ts` (line 63) | Policy display names (First Come First Served, Shortest Job Next, Round Robin …) | Term decisions (section 3 of the glossary) apply; these are shown as answer options, so they stay English unless the owner decides otherwise. |
| `src/kinds/memory-map/MemoryMap.tsx` (lines 260–776) | Column headings, step prompts, free-space sentence fragments | One sentence is assembled from fragments (" although N unit are free"), which cannot be translated as pieces. |
| `src/kinds/state-diagram/StateDiagram.tsx`, `ui.tsx` | Arrow progress ("Arrow N of M: from X with x = 1"), "Show whole table" toggles | Mixed words and signal values. |
| `src/kinds/truth-table/TruthTable.tsx` | Check buttons, column fold toggles, accessible names | Accessible names assemble header text with fixed words. |
| `src/kinds/shared/figures/*` | Accessible text alternatives (aria summaries) for the tape, tracks, file-layout, topology, op-tree, sequential and latch figures | Whole English paragraphs for assistive technology, partly generated from data (record keys, counts). |
| `src/shell/**`, `src/stage/**`, `src/app/**` | Home, course, settings, profile and not-found text; the "Next challenge", "Try once first", "Practice complete" strings | Page chrome; the only teaching-style lines among them are in `source-texts.json`. |

## 2. Dynamically assembled sentences and places that will be hard to localize

### 2a. Sentences assembled in code

54 of the component strings above are template literals or are joined from parts at run time (`${…}`, ternaries that pick a word, or `.join()`). Examples:

- `src/interactions/BitGrouping/BitGrouping.tsx:153` — Bit ${index + 1} of ${total}: ${bit}${added ? " (added zero)" : ""}
- `src/interactions/BitGrouping/BitGrouping.tsx:187` — Mark groups of ${groupSize} bits
- `src/interactions/BitGrouping/BitGrouping.tsx:289` — One ${BASE_NAME[groupSize]} digit per group
- `src/interactions/DragToTarget/DragToTarget.tsx:119` — Grabbed ${itemLabel(items, itemId)}. Use arrow keys to choose a slot, then press Enter. Press Escape to cancel. Now on ${targets[cursor]?.label ?? "no
- `src/interactions/NumericInput/NumericInput.tsx:63` — digits 0 to 9${signed ? ", a leading minus sign" : ""}${decimals > 0 ? 
- `src/kinds/base-to-decimal/WeightDiagram.tsx:168` — Power under digit ${i + 1} (${d.digit})
- `src/kinds/base-to-decimal/WeightDiagram.tsx:195` — Digit ${i + 1} (${d.digit}) as a number, times ${base} to the ${d.power}
- `src/kinds/circuit-predict/ui.tsx:77` — Expression at the output of the ${gate.type} gate. That is ${outputName}.
- `src/kinds/circuit-predict/ui.tsx:77` — Expression at the output of the ${gate.type} gate
- `src/kinds/circuit-predict/ui.tsx:89` — What comes out of the ${gate.type} gate? That is ${outputName}.
- `src/kinds/circuit-predict/ui.tsx:89` — What comes out of the ${gate.type} gate?
- `src/kinds/cpu-schedule/CpuSchedule.tsx:114` — Segments so far: ${segments.slice(0, drawn).map((s) => 
- `src/kinds/cpu-schedule/CpuSchedule.tsx:129` — Segment ${g.segment + 1} · starts at ${fmt(g.time)}: which job runs?
- `src/kinds/cpu-schedule/CpuSchedule.tsx:131` — Segment ${g.segment + 1} · ${g.job ?? "idle"} from ${fmt(g.time)}: until when?

These cannot be translated as sentences with a lookup, because the word order, singular and plural, and the position of the inserted value are chosen in code. Typical shapes: "N hint(s) used on N challenge(s)" (plural chosen with `=== 1`), "Arrow N of M: from X to Y", "Bit i of n under b", and sentences built from three or four fragments. Phase 2 needs message templates with named slots (the tutor catalog already supports `{slot}`), and plural handling that works for Arabic's plural classes.

### 2b. Content built at authoring time

The 3,000+ supportive strings are not hand-written one by one: most are produced by TypeScript template literals that bake the numbers and names of each variant into the sentence before the app runs. The inventory therefore holds **3224 distinct English strings for 10780 placements**; after replacing numbers, bit strings and single capital letters with a placeholder they fall to **2366 distinct sentence patterns**. Translating the patterns once, with slots, would be about 27% less work than translating every string, but it needs the authoring code to emit the pattern and its slot values instead of the finished sentence.

Largest groups of strings that differ only in a number, bit string or variable letter (top 12):

| Strings in the group | Placements | Pattern (one sample) |
|---|---|---|
| 42 | 46 | Add 01010101 + 00101011 one column at a time, starting from the right. |
| 42 | 46 | So 01010101 + 00101011 = 010000000. |
| 22 | 28 | Which weights are switched on in 010000000? |
| 22 | 28 | Look at 010000000. |
| 21 | 24 | So the 1's complement of 100101 is 011010. |
| 21 | 48 | So the 2's complement of 100101 is 011011. |
| 20 | 39 | 108 ÷ 2 = ? |
| 16 | 138 | Bit 1 is 1. |
| 16 | 30 | 54 goes in the next row. Now 54 ÷ 2. |
| 15 | 20 | Group 1: 0110. |
| 13 | 96 | Yes: 0001. |
| 12 | 20 | Which digit is 0110? |

### 2c. Shapes that will be hard to translate (counts of distinct strings, not exclusive)

| Shape | Strings |
|---|---|
| Equation or expression embedded in a sentence | 485 |
| Ordinal or position words (first, second, third …) | 235 |
| Number or count agreement (1 row / 2 rows, "s" chosen by value) | 82 |
| Slots next to a noun (word order or agreement may depend on the value) | 85 |
| Contains a quoted or inline code/value that must stay LTR | 32 |
| Long strings (over 220 characters) | 23 |
| Uses slots (templates) | 150 |

Specific cases:

- **Ordinals and positions** are generated from arrays in code (for example "second row, fourth column" in `src/content/ecet111/chapter3/anatomy.ts`); Arabic ordinals agree with the noun's gender.
- **Equations inside sentences** ("Q(t+1) = JQ′ + K′Q", "F = Σ(0, 2, 6, 7)", "T1 → T4") mix Latin letters, digits and operators in the middle of RTL prose. REQUIREMENTS.md already asks for LTR isolation; the strings that need it are the ones in the table above.
- **Hints that quote the answer** ("Row 1, column 10: 110 is m6.") interleave a value with words; the value is computed, so the sentence has to be a template.
- **Counted nouns** ("3 pages", "1 gap") use Arabic dual and plural forms that depend on the number.
- **Strings that name a UI control** ("press Check column") must match the translated control label, so UI chrome and tutor text have to be translated together.

## 3. Duplicates and centralization opportunities

- 1007 of the 3224 distinct content strings are used more than once, accounting for 8563 of the 10780 placements (79%). Each is already deduplicated in `source-texts.json` (one entry, with `occurrences`).
- The most-used strings are generic ladder text that every kind repeats ("Not yet. …" for rung 2), which should be catalog keys rather than copies in each activity file:

| Placements | Type | String |
|---|---|---|
| 218 | hint | Not yet. Read the question again and test the options one at a time. |
| 112 | feedback | Yes: write 1. |
| 112 | feedback | The total is 1, which is 1 in binary: write 1. |
| 92 | hint | Not yet. Add the bits in the {place}s column, plus the carry coming in. |
| 92 | hint | 0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 0 carry 1, and 1 + 1 + 1 = 1 carry 1. |
| 92 | hint | This column adds {aBit} + {bBit} + {carryIn}. What is the total? |
| 92 | hint | Look at the {place}s column only. |
| 92 | hint | A total of 2 is 10 in binary: write 0 here and carry 1. A total of 3 is 11: write 1 and carry 1. |
| 92 | hint | Like decimal, where a column total of 10 or more leaves one digit and carries the rest. |
| 92 | hint | Count the 1s in this column: one 1 gives 1; two give 0 carry 1; three give 1 carry 1. |
| 92 | hint | {aBit} + {bBit} + {carryIn}: write {sum}, carry {carryOut}. |
| 89 | feedback | Yes: write 0 and carry 1. |
| 89 | feedback | The total is 2, which is 10 in binary: write 0 and carry 1. |
| 72 | feedback | Yes: 0 flips to 1. |
| 72 | feedback | It flips: 0 becomes 1. |

- **Near-duplicates** (the same sentence with a different number or letter) are the 293 groups in 2b. They are the biggest centralization opportunity.
- **Same wording in two homes:** the tutor catalog holds 226 keys, and the components hold their own copies of some generic lines (for example "Not correct yet.", "Correct.", "Another hint"). Moving the component strings into the catalog would give one place per string.
- **Navigation text is not in the inventory** (titles and summaries of chapters, topics, concepts, objectives, activities and question labels). Counts, for the owner's scope decision: ecet111 chapter 5, ecet111 topic-title 29, ecet111 topic-summary 29, ecet111 concept 48, ecet111 objective 73, ecet111 activity 57, cpet181 chapter 9, cpet181 topic-title 25, cpet181 topic-summary 25, cpet181 concept 49, cpet181 objective 88, cpet181 activity 54. These are authored as separate short fields in the same content files and are separable if the owner brings them in scope.
- **A catalog for Arabic already exists and is empty** (`src/tutor/messages/ar.ts`; keys fall back to English; a test keeps every `{slot}`). It covers only the 226 catalog keys. Strings authored inside content files (hints and explanations) have no catalog key today, so Phase 2 must decide the shape of their ids; the ids in `source-texts.json` are built from course, topic, activity, question, variant and field and are stable while those ids stay stable (variant ids are index-stable by rule #141).

## 4. Findings that are not strings

- Every nudge key that content refers to exists in the catalog (checked).
- Question prompts, answer options, scaffold options, equations and notation are excluded by the directive and were not collected.
- Figures carry `caption` text authored in content (accessible names); it is counted under the content entries only where it is a hint or explanation field. Captions as such are not in the inventory; a count is in the PR report.
