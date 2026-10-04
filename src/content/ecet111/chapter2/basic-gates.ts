/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 2, basic gates (#224, content pack ch2 §1 and §4): AND, OR and NOT truth tables,
 * then a gate-by-gate walk. It replaces the demo topic; the topic, practice and question ids of the
 * gate walk are kept so saved progress still matches.
 */
import type { CourseInput, VariantInput } from "../../schema";

type TopicInput = CourseInput["modules"][number]["topics"][number];

/** Hints for the gate-by-gate circuit walk; `{gate...}` slots are filled for the gate being asked. */
export const gateWalkHints: NonNullable<VariantInput["hints"]> = [
  { rung: 2, text: "Not quite. Look only at the {gateName} gate and the values on its input wires." },
  { rung: 3, text: "{gateRule}" },
  { rung: 4, text: "Which values arrive at the {gateName} gate? Read them from the wires on its left." },
  { rung: 5, text: "This is the gate. Its inputs are {gateInputs}.", focus: "gate-{gateId}", highlight: "gate-{gateId}" },
  { rung: 6, text: "Say the rule, then check each input against it: {gateInputs}." },
  { rung: 7, text: "{gateAnalogy}" },
  { rung: 8, text: "{gateRule} Here the inputs are {gateInputs}. What does that give?" },
  { rung: 9, text: "The {gateName} gate outputs {gateOut}, because its inputs are {gateInputs}." },
];

const gateWalkMisconceptions: NonNullable<VariantInput["misconceptions"]> = [
  { id: "lg.rule-not", title: "Wrong NOT output", nudgeKey: "lg.check-not", detect: { type: "gate-output", gate: "NOT" } },
  { id: "lg.rule-and", title: "Wrong AND output", nudgeKey: "lg.check-and", detect: { type: "gate-output", gate: "AND" } },
  { id: "lg.rule-or", title: "Wrong OR output", nudgeKey: "lg.check-or", detect: { type: "gate-output", gate: "OR" } },
];

/* ---------- Gate tables (#224, content pack ch2 §1 and §4): fill the output column ---------- */

type Gate = "AND" | "OR" | "NOT";

const tableHints: NonNullable<VariantInput["hints"]> = [
  { rung: 2, text: "Not yet. Go row by row: work out {columnLabel} for each row's inputs." },
  { rung: 3, text: "{rule}" },
  { rung: 4, text: "Which rows make {columnLabel} equal 1?" },
  { rung: 6, text: "Rows count up in binary, all zeros first; the output column follows the same rows." },
  { rung: 8, text: "{onesHint}" },
  { rung: 9, text: "The {columnLabel} column reads {answerColumn}, top to bottom." },
];

const tableMisconceptions: NonNullable<VariantInput["misconceptions"]> = [
  { id: "tt.and-or-swapped", title: "AND and OR swapped", nudgeKey: "tt.and-or-swapped", detect: { type: "and-or-swapped" } },
  { id: "tt.not-missing", title: "NOT not applied", nudgeKey: "tt.not-missing", detect: { type: "not-missing" } },
];

const RULE: Record<Gate, string> = {
  AND: "AND gives 1 only when every input is 1.",
  OR: "OR gives 1 when at least one input is 1.",
  NOT: "NOT flips its input: 0 becomes 1 and 1 becomes 0.",
};

/** One gate's table over `inputs`; its output column is computed from the expression. */
function gateTable(gate: Gate, inputs: string[]): VariantInput {
  const expr = gate === "AND" ? inputs.join("") : gate === "OR" ? inputs.join(" + ") : `${inputs[0]}'`;
  const label = gate === "AND" ? inputs.join("·") : gate === "OR" ? inputs.join(" + ") : `${inputs[0]}′`;
  const rows = 2 ** inputs.length;
  const column = Array.from({ length: rows }, (_, r) => (gate === "AND" ? (r === rows - 1 ? 1 : 0) : gate === "OR" ? (r === 0 ? 0 : 1) : r === 0 ? 1 : 0));
  const onesHint = gate === "AND" ? "Only the last row, where every input is 1, gives 1." : gate === "OR" ? "Only the first row, where every input is 0, gives 0." : "The output is the opposite of the input on each row.";
  const keyRow = gate === "AND" ? rows - 1 : 0;
  const keyBits = keyRow.toString(2).padStart(inputs.length, "0").split("").join(" ");
  return {
    id: `v${gate.toLowerCase()}-${inputs.join("").toLowerCase()}`,
    prompt: `Fill the ${gate} column: ${label} for each row.`,
    spec: { kind: "truth-table", inputs, columns: [{ id: "f", label, expr }] },
    vars: { rule: RULE[gate], onesHint, answerColumn: column.join(" ") },
    hints: tableHints,
    misconceptions: tableMisconceptions,
    explanation: [
      { id: "s1", say: `${RULE[gate]} ${inputs.length} input${inputs.length > 1 ? "s" : ""} give ${rows} rows: 2^${inputs.length}.`, stage: { step: 0, revealed: 0 } },
      {
        id: "s2",
        say: `Take the row ${keyBits}.`,
        stage: { step: 0, revealed: keyRow },
        ask: {
          prompt: `What is ${label} on that row?`,
          options: ["0", "1"],
          correctIndex: column[keyRow],
          afterCorrect: `Yes: ${column[keyRow]}.`,
          afterWrong: `${RULE[gate]} So it is ${column[keyRow]}.`,
        },
      },
      { id: "s3", say: onesHint, stage: { step: 0, revealed: rows } },
    ],
  };
}

const gateTables: TopicInput["activities"][number] = {
  id: "gate-tables",
  title: "AND, OR, NOT tables",
  summary: "Fill each gate's truth table, one column at a time.",
  authority: "DEMO",
  minutes: 8,
  questions: [
    { id: "bg.q.and", label: "AND table", conceptId: "lg.basic-gates", objectiveId: "lg.obj.table", variants: [gateTable("AND", ["x", "y"]), gateTable("AND", ["A", "B", "C"]), gateTable("AND", ["A", "B"])] }, // first retry is a different table (Pedagogy on #337)
    { id: "bg.q.or", label: "OR table", conceptId: "lg.basic-gates", objectiveId: "lg.obj.table", variants: [gateTable("OR", ["x", "y"]), gateTable("OR", ["A", "B", "C"]), gateTable("OR", ["A", "B"])] },
    { id: "bg.q.not", label: "NOT table", conceptId: "lg.basic-gates", objectiveId: "lg.obj.table", variants: [gateTable("NOT", ["x"])] }, // one fixed fact: exempt from the three-set rule (content.test)
  ],
};

export const basicGatesTopic: TopicInput = {
  id: "logic-gates",
  title: "Basic gates",
  summary: "AND, OR and NOT: fill their truth tables, then follow a small circuit one gate at a time.",
  concepts: [
    { id: "lg.basic-gates", title: "Basic gates", summary: "AND outputs 1 only when all inputs are 1. OR outputs 1 when any input is 1. NOT flips its input." },
    { id: "lg.signal-flow", title: "Signal flow", summary: "Evaluate a circuit one gate at a time, from inputs towards the output." },
  ],
  objectives: [
    { id: "lg.obj.predict", conceptId: "lg.signal-flow", text: "Predict the output of a three-gate circuit for given inputs." },
    { id: "lg.obj.identify", conceptId: "lg.basic-gates", text: "Identify a gate from its truth-table behaviour." },
    { id: "lg.obj.table", conceptId: "lg.basic-gates", text: "Fill the truth table of AND, OR and NOT, rows in binary order (2^n rows)." },
  ],
  prerequisites: [],
  activities: [
    gateTables,
    {
      id: "predict-gate-output",
      title: "Predict the output",
      summary: "Follow signals through NOT, AND and OR gates and predict the result.",
      authority: "DEMO",
      minutes: 6,
      questions: [
        {
          id: "lg.q.predict",
          label: "Gate by gate",
          conceptId: "lg.signal-flow",
          objectiveId: "lg.obj.predict",
          variants: [
            {
              id: "v101",
              prompt: "Inputs are A = {A}, B = {B}, C = {C}. Work through the circuit one gate at a time to find Y.",
              spec: {
                kind: "circuit-predict",
                inputs: [
                  { id: "a", label: "A", value: 1 },
                  { id: "b", label: "B", value: 0 },
                  { id: "c", label: "C", value: 1 },
                ],
                gates: [
                  { id: "n1", type: "NOT", from: ["b"] },
                  { id: "g1", type: "AND", from: ["a", "n1"] },
                  { id: "g2", type: "OR", from: ["g1", "c"], label: "Y" },
                ],
                outputGateId: "g2",
                answer: 1,
                inputsToggleable: true,
              },
              vars: { A: 1, B: 0, C: 1, notB: 1, g1: 1, answer: 1 },
              hints: gateWalkHints,
              explanation: [
                { id: "s1", say: "Signals move from the inputs on the left to Y on the right. Follow them one gate at a time.", stage: { lit: [] } },
                {
                  id: "s2",
                  say: "B is {B}. The NOT gate flips it.",
                  stage: { lit: [], active: "n1" },
                  ask: { prompt: "What comes out of NOT?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes: NOT 0 = 1.", afterWrong: "NOT flips 0 to 1." },
                },
                {
                  id: "s3",
                  say: "The AND gate receives A = {A} and NOT B = {notB}. AND outputs 1 only when both are 1.",
                  stage: { lit: ["n1"], active: "g1" },
                  ask: { prompt: "What does the AND gate output?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Right, both inputs are 1, so 1.", afterWrong: "Both inputs are 1, so the AND gate outputs 1." },
                },
                {
                  id: "s4",
                  say: "The OR gate receives {g1} from AND and C = {C}. OR outputs 1 when at least one input is 1.",
                  stage: { lit: ["n1", "g1"], active: "g2" },
                  ask: { prompt: "What does the OR gate output?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes. At least one input is 1, so OR gives 1.", afterWrong: "At least one input is 1, so OR gives 1." },
                },
                { id: "s5", say: "The OR gate is the last one, so its output is Y. Y = {answer}.", stage: { lit: ["n1", "g1", "g2"] } },
              ],
              misconceptions: gateWalkMisconceptions,
            },
            {
              id: "v000",
              prompt: "Now A = {A}, B = {B}, C = {C}. Find Y again, one gate at a time.",
              spec: {
                kind: "circuit-predict",
                inputs: [
                  { id: "a", label: "A", value: 0 },
                  { id: "b", label: "B", value: 0 },
                  { id: "c", label: "C", value: 0 },
                ],
                gates: [
                  { id: "n1", type: "NOT", from: ["b"] },
                  { id: "g1", type: "AND", from: ["a", "n1"] },
                  { id: "g2", type: "OR", from: ["g1", "c"], label: "Y" },
                ],
                outputGateId: "g2",
                answer: 0,
                inputsToggleable: true,
              },
              vars: { A: 0, B: 0, C: 0, notB: 1, g1: 0, answer: 0 },
              hints: gateWalkHints,
              explanation: [
                { id: "s1", say: "Same circuit, new inputs. Follow the signals again.", stage: { lit: [] } },
                {
                  id: "s2",
                  say: "B is {B}. The NOT gate flips it.",
                  stage: { lit: [], active: "n1" },
                  ask: { prompt: "What comes out of NOT?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes: NOT 0 = 1.", afterWrong: "NOT flips 0 to 1." },
                },
                {
                  id: "s3",
                  say: "AND receives A = {A} and {notB}.",
                  stage: { lit: ["n1"], active: "g1" },
                  ask: { prompt: "What does the AND gate output?", options: ["0", "1"], correctIndex: 0, afterCorrect: "Right: A is 0, so AND is 0.", afterWrong: "A is 0, so the AND gate cannot output 1. It outputs 0." },
                },
                {
                  id: "s4",
                  say: "The OR gate receives {g1} from AND and C = {C}.",
                  stage: { lit: ["n1", "g1"], active: "g2" },
                  ask: { prompt: "What does the OR gate output?", options: ["0", "1"], correctIndex: 0, afterCorrect: "Right. Both inputs are 0, so OR gives 0.", afterWrong: "Both inputs are 0, so OR gives 0." },
                },
                { id: "s5", say: "The OR gate is the last one, so its output is Y. Y = {answer}.", stage: { lit: ["n1", "g1", "g2"] } },
              ],
              misconceptions: gateWalkMisconceptions,
            },
            {
              id: "v011",
              prompt: "One more: A = {A}, B = {B}, C = {C}. Find Y, one gate at a time.",
              spec: {
                kind: "circuit-predict",
                inputs: [
                  { id: "a", label: "A", value: 0 },
                  { id: "b", label: "B", value: 1 },
                  { id: "c", label: "C", value: 1 },
                ],
                gates: [
                  { id: "n1", type: "NOT", from: ["b"] },
                  { id: "g1", type: "AND", from: ["a", "n1"] },
                  { id: "g2", type: "OR", from: ["g1", "c"], label: "Y" },
                ],
                outputGateId: "g2",
                answer: 1,
                inputsToggleable: true,
              },
              vars: { A: 0, B: 1, C: 1, notB: 0, g1: 0, answer: 1 },
              hints: gateWalkHints,
              explanation: [
                { id: "s1", say: "Same circuit, new inputs. Follow the signals from left to right.", stage: { lit: [] } },
                {
                  id: "s2",
                  say: "B is {B}. The NOT gate flips it.",
                  stage: { lit: [], active: "n1" },
                  ask: { prompt: "What comes out of NOT?", options: ["1", "0"], correctIndex: 1, afterCorrect: "Yes: NOT 1 = 0.", afterWrong: "NOT flips 1 to 0." },
                },
                {
                  id: "s3",
                  say: "AND receives A = {A} and {notB}.",
                  stage: { lit: ["n1"], active: "g1" },
                  ask: { prompt: "What does the AND gate output?", options: ["1", "0"], correctIndex: 1, afterCorrect: "Right: one input is 0, so AND is 0.", afterWrong: "One input is 0, so the AND gate outputs 0." },
                },
                {
                  id: "s4",
                  say: "The OR gate receives {g1} from AND and C = {C}.",
                  stage: { lit: ["n1", "g1"], active: "g2" },
                  ask: { prompt: "What does the OR gate output?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Right. C alone is 1, and one 1 is enough for OR.", afterWrong: "C is 1, and one 1 is enough: OR gives 1." },
                },
                { id: "s5", say: "The OR gate is the last one, so its output is Y. Y = {answer}.", stage: { lit: ["n1", "g1", "g2"] } },
              ],
              misconceptions: gateWalkMisconceptions,
            },
          ],
        },
        {
          id: "lg.q.identify",
          label: "Name the gate",
          conceptId: "lg.basic-gates",
          objectiveId: "lg.obj.identify",
          variants: [
            {
              id: "v-and",
              prompt: "Which gate outputs 1 only when both of its inputs are 1?",
              spec: {
                kind: "multiple-choice",
                options: [
                  { id: "and", text: "AND" },
                  { id: "or", text: "OR", misconceptionId: "lg.or-vs-and" },
                  { id: "xor", text: "XOR", misconceptionId: "lg.xor-vs-and" },
                  { id: "nand", text: "NAND", misconceptionId: "lg.nand-inverted" },
                ],
                correctOptionId: "and",
              },
              vars: {},
              hints: [
                { rung: 2, text: "Not that one. Think about which gate is the strictest." },
                { rung: 3, text: "OR is satisfied by any 1. AND requires every input to be 1." },
                { rung: 4, text: "If one input is 1 and the other is 0, which gates still output 1? The answer is not one of those." },
                { rung: 5, text: "Compare the truth tables: only one gate has a single 1 in its output column, at the bottom row.", focus: "option-and", highlight: "option-and" },
                { rung: 6, text: "Rule out: OR (any 1), XOR (exactly one 1), NAND (the opposite of what we want)." },
                { rung: 7, text: "Like a door with two locks: it opens only when both keys turn." },
                { rung: 8, text: "The gate that needs both inputs is AND." },
                { rung: 9, text: "AND outputs 1 only when both inputs are 1." },
              ],
              explanation: [
                { id: "s1", say: "Each gate has a rule. Let us test the rules with inputs 1 and 0.", stage: {} },
                {
                  id: "s2",
                  say: "OR outputs 1 when at least one input is 1.",
                  stage: {},
                  ask: { prompt: "OR(1, 0) = ?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes, 1. So OR is not the strict one.", afterWrong: "One input is 1, so OR gives 1. OR is not the strict one." },
                },
                {
                  id: "s3",
                  say: "AND outputs 1 only when every input is 1.",
                  stage: {},
                  ask: { prompt: "AND(1, 0) = ?", options: ["0", "1"], correctIndex: 0, afterCorrect: "Right, 0. AND needs both.", afterWrong: "One input is 0, so AND gives 0. AND needs both." },
                },
                { id: "s4", say: "So the gate that outputs 1 only when both inputs are 1 is AND.", stage: {} },
              ],
              misconceptions: [
                { id: "lg.or-vs-and", title: "Confused OR with AND", nudgeKey: "lg.or-vs-and", detect: { type: "option", optionId: "or" } },
                { id: "lg.xor-vs-and", title: "Confused XOR with AND", nudgeKey: "lg.xor-vs-and", detect: { type: "option", optionId: "xor" } },
                { id: "lg.nand-inverted", title: "NAND is the inverse of AND", nudgeKey: "lg.nand-inverted", detect: { type: "option", optionId: "nand" } },
              ],
            },
            {
              id: "v-or",
              prompt: "Which gate outputs 0 only when both of its inputs are 0?",
              spec: {
                kind: "multiple-choice",
                options: [
                  { id: "and", text: "AND", misconceptionId: "lg.and-vs-or" },
                  { id: "or", text: "OR" },
                  { id: "nor", text: "NOR", misconceptionId: "lg.nor-inverted" },
                  { id: "not", text: "NOT" },
                ],
                correctOptionId: "or",
              },
              vars: {},
              hints: [
                { rung: 2, text: "Not that one. Which gate is easiest to satisfy?" },
                { rung: 3, text: "OR outputs 1 if any input is 1, so it outputs 0 only when all inputs are 0." },
                { rung: 4, text: "With inputs 1 and 0, which gate gives 1?" },
                { rung: 5, text: "Look at the output column with a single 0 in the top row.", focus: "option-or", highlight: "option-or" },
                { rung: 6, text: "Rule out AND (needs both), NOR (the opposite), NOT (one input)." },
                { rung: 7, text: "Two doors into a room: you are locked out only if both are shut." },
                { rung: 8, text: "The gate is OR." },
                { rung: 9, text: "OR outputs 0 only when both inputs are 0." },
              ],
              explanation: [
                { id: "s1", say: "Test with inputs 0 and 0, then 1 and 0.", stage: {} },
                {
                  id: "s2",
                  say: "OR(0, 0) = 0, because no input is 1.",
                  stage: {},
                  ask: { prompt: "OR(1, 0) = ?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes. Any 1 makes OR output 1.", afterWrong: "One input is 1, so OR outputs 1." },
                },
                { id: "s3", say: "So OR outputs 0 only when both inputs are 0.", stage: {} },
              ],
              misconceptions: [
                { id: "lg.and-vs-or", title: "Confused AND with OR", nudgeKey: "lg.or-vs-and", detect: { type: "option", optionId: "and" } },
                { id: "lg.nor-inverted", title: "NOR is the inverse of OR", nudgeKey: "lg.nor-inverted", detect: { type: "option", optionId: "nor" } },
              ],
            },
            {
              id: "v-not",
              prompt: "Which gate has one input and gives the opposite of it?",
              spec: {
                kind: "multiple-choice",
                options: [
                  { id: "nand", text: "NAND", misconceptionId: "lg.nand-not" },
                  { id: "not", text: "NOT" },
                  { id: "or", text: "OR" },
                  { id: "and", text: "AND" },
                ],
                correctOptionId: "not",
              },
              vars: {},
              hints: [
                { rung: 2, text: "Not that one. Count the inputs first." },
                { rung: 3, text: "AND, OR, NAND and NOR take two or more inputs. Only one basic gate takes a single input." },
                { rung: 9, text: "NOT has one input and flips it: 0 becomes 1, 1 becomes 0." },
              ],
              explanation: [
                { id: "s1", say: "AND and OR combine two or more inputs. One gate works on a single input.", stage: {} },
                {
                  id: "s2",
                  say: "Its symbol is a triangle with a small circle (bubble) at the tip.",
                  stage: {},
                  ask: { prompt: "If its input is 1, the output is…", options: ["1", "0"], correctIndex: 1, afterCorrect: "Yes, 0: the opposite. That gate is NOT.", afterWrong: "It gives the opposite: 0. That gate is NOT." },
                },
              ],
              misconceptions: [{ id: "lg.nand-not", title: "NAND for NOT", nudgeKey: "lg.nand-not", detect: { type: "option", optionId: "nand" } }],
            },
          ],
        },
      ],
    },
  ],
};
