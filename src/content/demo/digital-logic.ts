/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT
 * Demo course used to validate the learning architecture. Replace with instructor-approved
 * content before any production release. Every entity below is stamped authority: "DEMO".
 */
import type { CourseInput } from "../schema";

export const digitalLogicDemo: CourseInput = {
  id: "digital-logic-demo",
  code: "DEMO-101",
  title: "Digital Logic Fundamentals (DEMO)",
  summary: "Number systems and basic logic gates. Demo content for validating the platform.",
  authority: "DEMO",
  offeringId: "digital-logic-demo.2026-fall",
  modules: [
    {
      id: "foundations",
      title: "Foundations",
      topics: [
        /* ------------------------------------------------------------------ */
        {
          id: "number-systems",
          title: "Number systems",
          summary: "Decimal, binary, octal and hexadecimal: place values and conversion.",
          concepts: [
            { id: "ns.place-value", title: "Binary place value", summary: "Each binary digit stands for a power of two: 1, 2, 4, 8, 16, 32, …" },
            { id: "ns.hex-grouping", title: "Hexadecimal grouping", summary: "One hex digit represents exactly four binary digits; 10–15 are written A–F." },
          ],
          objectives: [
            { id: "ns.obj.dec-to-bin", conceptId: "ns.place-value", text: "Convert a decimal integer below 64 to binary using place values." },
            { id: "ns.obj.bin-to-hex", conceptId: "ns.hex-grouping", text: "Convert a binary number to hexadecimal by grouping four bits." },
          ],
          activities: [
            {
              id: "decimal-to-binary",
              title: "Decimal to binary",
              summary: "Build a binary number from place values, then write it in hexadecimal.",
              authority: "DEMO",
              minutes: 8,
              questions: [
                {
                  id: "ns.q.place-value",
                  conceptId: "ns.place-value",
                  objectiveId: "ns.obj.dec-to-bin",
                  variants: [
                    {
                      id: "v45",
                      prompt: "Represent {value} in binary. Place a 1 in each slot whose place value is part of {value}.",
                      spec: { kind: "place-value", value: 45, base: 2, slots: 6, answer: [1, 0, 1, 1, 0, 1] },
                      vars: { value: 45, answerBits: "101101", largest: 32, remainder: 13 },
                      hints: [
                        { rung: 2, text: "Not yet. Check each slot: does its place value fit into what is left of {value}?" },
                        { rung: 3, text: "Each slot is a power of two: 32, 16, 8, 4, 2, 1. A 1 means that power is part of the total." },
                        { rung: 4, text: "What is the largest power of two that fits in {value}?" },
                        { rung: 5, text: "Start here. {largest} fits in {value}. What remains after you take {largest}?", focus: "slot-32", highlight: "slot-32" },
                        { rung: 6, text: "{value} = 32 + 8 + 4 + 1. Which slots does that light up?" },
                        { rung: 7, text: "Think of paying {value} with coins worth 32, 16, 8, 4, 2 and 1, using each coin at most once." },
                        { rung: 8, text: "Put a 1 under 32, 8, 4 and 1, and a 0 under 16 and 2. Then add the lit values to check they make {value}." },
                        { rung: 9, text: "{value} in binary is {answerBits}: 32 + 8 + 4 + 1 = {value}." },
                      ],
                      explanation: [
                        { id: "s1", say: "We want to write {value} using only powers of two: 32, 16, 8, 4, 2 and 1.", stage: { lit: [], remainder: 45 } },
                        {
                          id: "s2",
                          say: "Start with the largest slot, 32. Does 32 fit in {value}?",
                          stage: { lit: [], remainder: 45, attention: 32 },
                          ask: { prompt: "Does 32 fit in {value}?", options: ["Yes", "No"], correctIndex: 0, afterCorrect: "Yes. Put a 1 under 32. {value} − 32 = 13 remains.", afterWrong: "It does: 32 is less than {value}. Put a 1 under 32. 13 remains." },
                        },
                        {
                          id: "s3",
                          say: "Now 16. Does 16 fit in 13?",
                          stage: { lit: [32], remainder: 13, attention: 16 },
                          ask: { prompt: "Does 16 fit in 13?", options: ["Yes", "No"], correctIndex: 1, afterCorrect: "Right. 16 is too big, so the 16 slot gets a 0.", afterWrong: "16 is bigger than 13, so it does not fit. The 16 slot gets a 0." },
                        },
                        { id: "s4", say: "8 fits in 13. Put a 1 under 8. 13 − 8 = 5 remains.", stage: { lit: [32, 8], remainder: 5, attention: 8 } },
                        {
                          id: "s5",
                          say: "4 fits in 5, so the 4 slot gets a 1 and 1 remains. 2 does not fit in 1. Which slot takes the last 1?",
                          stage: { lit: [32, 8, 4], remainder: 1, attention: 2 },
                          ask: { prompt: "Which slot takes the last 1?", options: ["The 2 slot", "The 1 slot"], correctIndex: 1, afterCorrect: "The 1 slot.", afterWrong: "2 is bigger than 1, so it is the 1 slot." },
                        },
                        { id: "s6", say: "Result: {answerBits}. Check: 32 + 8 + 4 + 1 = {value}.", stage: { lit: [32, 8, 4, 1], remainder: 0 } },
                      ],
                      misconceptions: [
                        { id: "ns.reversed", title: "Bits written least-significant first", nudgeKey: "ns.reversed", detect: { type: "reversed-bits" } },
                        { id: "ns.skip-largest", title: "Largest place value skipped", nudgeKey: "ns.missing-largest", detect: { type: "missing-place", place: 32 } },
                        { id: "ns.extra-16", title: "Included a place value that does not fit", nudgeKey: "ns.extra-place", detect: { type: "extra-place", place: 16 } },
                      ],
                    },
                    {
                      id: "v29",
                      prompt: "Now try another one. Represent {value} in binary.",
                      spec: { kind: "place-value", value: 29, base: 2, slots: 6, answer: [0, 1, 1, 1, 0, 1] },
                      vars: { value: 29, answerBits: "011101", largest: 16, remainder: 13 },
                      hints: [
                        { rung: 2, text: "Not yet. Does each lit place value really fit into what is left of {value}?" },
                        { rung: 3, text: "Slots are 32, 16, 8, 4, 2, 1. If a value is bigger than what remains, its slot gets a 0." },
                        { rung: 4, text: "Does 32 fit in {value}? If not, which is the largest power of two that does?" },
                        { rung: 5, text: "32 is too big. Start at 16.", focus: "slot-16", highlight: "slot-16" },
                        { rung: 6, text: "{value} = 16 + 8 + 4 + 1." },
                        { rung: 7, text: "Pay {value} with coins of 32, 16, 8, 4, 2, 1, each at most once. The 32 coin is too big." },
                        { rung: 8, text: "0 under 32; 1 under 16, 8, 4 and 1; 0 under 2. Add the lit values to check." },
                        { rung: 9, text: "{value} in binary is {answerBits}: 16 + 8 + 4 + 1 = {value}." },
                      ],
                      explanation: [
                        { id: "s1", say: "Same method: powers of two from the largest down.", stage: { lit: [], remainder: 29 } },
                        {
                          id: "s2",
                          say: "Does 32 fit in {value}?",
                          stage: { lit: [], remainder: 29, attention: 32 },
                          ask: { prompt: "Does 32 fit in {value}?", options: ["Yes", "No"], correctIndex: 1, afterCorrect: "No, so the 32 slot is 0.", afterWrong: "32 is bigger than {value}, so the 32 slot is 0." },
                        },
                        { id: "s3", say: "16 fits. 1 under 16, and {value} − 16 = 13 remains.", stage: { lit: [16], remainder: 13, attention: 16 } },
                        { id: "s4", say: "8 fits in 13 → 1. 5 remains. 4 fits in 5 → 1. 1 remains.", stage: { lit: [16, 8, 4], remainder: 1, attention: 4 } },
                        {
                          id: "s5",
                          say: "2 does not fit in 1. What does the 2 slot get?",
                          stage: { lit: [16, 8, 4], remainder: 1, attention: 2 },
                          ask: { prompt: "What does the 2 slot get?", options: ["0", "1"], correctIndex: 0, afterCorrect: "0. The final 1 goes in the 1 slot.", afterWrong: "It gets 0, because 2 is bigger than 1. The final 1 goes in the 1 slot." },
                        },
                        { id: "s6", say: "Result: {answerBits}. Check: 16 + 8 + 4 + 1 = {value}.", stage: { lit: [16, 8, 4, 1], remainder: 0 } },
                      ],
                      misconceptions: [
                        { id: "ns.reversed", title: "Bits written least-significant first", nudgeKey: "ns.reversed", detect: { type: "reversed-bits" } },
                        { id: "ns.extra-32", title: "Included a place value that does not fit", nudgeKey: "ns.extra-place", detect: { type: "extra-place", place: 32 } },
                        { id: "ns.skip-largest", title: "Largest place value skipped", nudgeKey: "ns.missing-largest", detect: { type: "missing-place", place: 16 } },
                      ],
                    },
                  ],
                },
                {
                  id: "ns.q.to-hex",
                  conceptId: "ns.hex-grouping",
                  objectiveId: "ns.obj.bin-to-hex",
                  variants: [
                    {
                      id: "v45",
                      prompt: "You found that {value} is {answerBits} in binary. Write {value} in hexadecimal.",
                      spec: { kind: "numeric", base: 16, answer: "2D" },
                      vars: { value: 45, answerBits: "101101", groups: "0010 1101", answerHex: "2D" },
                      hints: [
                        { rung: 2, text: "Not yet. Remember that one hex digit stands for four binary digits." },
                        { rung: 3, text: "Hex digits run 0–9 then A–F, where A = 10, B = 11, C = 12, D = 13, E = 14, F = 15." },
                        { rung: 4, text: "Group {answerBits} into blocks of four bits starting from the right. What are the two blocks?" },
                        { rung: 5, text: "The blocks are {groups}. Convert each block on its own.", focus: "numeric-input", highlight: "numeric-input" },
                        { rung: 6, text: "0010 is 2. 1101 is 8 + 4 + 1 = 13. Which hex digit is 13?" },
                        { rung: 7, text: "It is like writing minutes: 13 past the hour is still one digit in hex, D." },
                        { rung: 8, text: "Write the two digits side by side: 2 then D." },
                        { rung: 9, text: "{value} in hexadecimal is {answerHex}: 0010 → 2 and 1101 → D." },
                      ],
                      explanation: [
                        { id: "s1", say: "Hexadecimal is base 16. One hex digit covers exactly four binary digits.", stage: { groups: [] } },
                        {
                          id: "s2",
                          say: "Group {answerBits} into fours from the right: {groups}.",
                          stage: { groups: ["0010", "1101"] },
                          ask: { prompt: "What is 0010 in decimal?", options: ["2", "4", "10"], correctIndex: 0, afterCorrect: "Yes, 2.", afterWrong: "0010 has a 1 only in the 2 slot, so it is 2." },
                        },
                        {
                          id: "s3",
                          say: "Now 1101: 8 + 4 + 1 = 13. Hex writes 13 as a single digit.",
                          stage: { groups: ["0010", "1101"], attention: 1 },
                          ask: { prompt: "Which hex digit is 13?", options: ["C", "D", "13"], correctIndex: 1, afterCorrect: "D.", afterWrong: "A = 10, B = 11, C = 12, D = 13. So it is D." },
                        },
                        { id: "s4", say: "Put them together: {answerHex}. Check: 2 × 16 + 13 = {value}.", stage: { groups: ["0010", "1101"], done: true } },
                      ],
                      misconceptions: [
                        { id: "ns.hex-digit-decimal", title: "Wrote 13 instead of D", nudgeKey: "ns.hex-letter", detect: { type: "equals", value: "213" } },
                        { id: "ns.copied-decimal", title: "Copied the decimal value", nudgeKey: "ns.copied-decimal", detect: { type: "equals", value: "45" } },
                      ],
                    },
                    {
                      id: "v29",
                      prompt: "{value} is {answerBits} in binary. Write {value} in hexadecimal.",
                      spec: { kind: "numeric", base: 16, answer: "1D" },
                      vars: { value: 29, answerBits: "011101", groups: "0001 1101", answerHex: "1D" },
                      hints: [
                        { rung: 2, text: "Not yet. One hex digit stands for four binary digits." },
                        { rung: 3, text: "Hex digits: 0–9 then A–F (A = 10 … F = 15)." },
                        { rung: 4, text: "Group {answerBits} into fours from the right. What are the blocks?" },
                        { rung: 5, text: "The blocks are {groups}.", focus: "numeric-input", highlight: "numeric-input" },
                        { rung: 6, text: "0001 is 1. 1101 is 13. Which letter is 13?" },
                        { rung: 7, text: "Like minutes past the hour: 13 is a single hex digit, D." },
                        { rung: 8, text: "Write 1 then D." },
                        { rung: 9, text: "{value} in hexadecimal is {answerHex}." },
                      ],
                      explanation: [
                        { id: "s1", say: "Group into fours from the right: {groups}.", stage: { groups: ["0001", "1101"] } },
                        {
                          id: "s2",
                          say: "0001 is 1. 1101 is 8 + 4 + 1 = 13.",
                          stage: { groups: ["0001", "1101"], attention: 1 },
                          ask: { prompt: "Which hex digit is 13?", options: ["B", "D", "13"], correctIndex: 1, afterCorrect: "D.", afterWrong: "A = 10, B = 11, C = 12, D = 13. So D." },
                        },
                        { id: "s3", say: "Together: {answerHex}. Check: 1 × 16 + 13 = {value}.", stage: { groups: ["0001", "1101"], done: true } },
                      ],
                      misconceptions: [
                        { id: "ns.hex-digit-decimal", title: "Wrote 13 instead of D", nudgeKey: "ns.hex-letter", detect: { type: "equals", value: "113" } },
                        { id: "ns.copied-decimal", title: "Copied the decimal value", nudgeKey: "ns.copied-decimal", detect: { type: "equals", value: "29" } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        /* ------------------------------------------------------------------ */
        {
          id: "logic-gates",
          title: "Logic gates",
          summary: "AND, OR, NOT and friends: predict outputs and read small circuits.",
          concepts: [
            { id: "lg.basic-gates", title: "Basic gates", summary: "AND outputs 1 only when all inputs are 1. OR outputs 1 when any input is 1. NOT flips its input." },
            { id: "lg.signal-flow", title: "Signal flow", summary: "Evaluate a circuit one gate at a time, from inputs towards the output." },
          ],
          objectives: [
            { id: "lg.obj.predict", conceptId: "lg.signal-flow", text: "Predict the output of a three-gate circuit for given inputs." },
            { id: "lg.obj.identify", conceptId: "lg.basic-gates", text: "Identify a gate from its truth-table behaviour." },
          ],
          prerequisites: [],
          activities: [
            {
              id: "predict-gate-output",
              title: "Predict the output",
              summary: "Follow signals through NOT, AND and OR gates and predict the result.",
              authority: "DEMO",
              minutes: 6,
              questions: [
                {
                  id: "lg.q.predict",
                  conceptId: "lg.signal-flow",
                  objectiveId: "lg.obj.predict",
                  variants: [
                    {
                      id: "v101",
                      prompt: "Inputs are A = {A}, B = {B}, C = {C}. Follow the signals and predict the output Y.",
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
                      hints: [
                        { rung: 2, text: "Not quite. Take it one gate at a time, starting from the inputs." },
                        { rung: 3, text: "NOT flips its input. AND gives 1 only if both inputs are 1. OR gives 1 if at least one input is 1." },
                        { rung: 4, text: "B is {B}. What comes out of the NOT gate?" },
                        { rung: 5, text: "Look at the NOT gate first. Its output is {notB}.", focus: "gate-n1", highlight: "gate-n1" },
                        { rung: 6, text: "NOT B = {notB}. AND(A = {A}, {notB}) = {g1}. OR({g1}, C = {C}) = ?" },
                        { rung: 7, text: "OR is like two doors into a room: if either is open, you can get in." },
                        { rung: 8, text: "The AND gate outputs {g1}. The OR gate sees {g1} and C = {C}, so it outputs 1 if either is 1." },
                        { rung: 9, text: "Y = {answer}. NOT B = {notB}; AND = {g1}; OR({g1}, {C}) = {answer}." },
                      ],
                      explanation: [
                        { id: "s1", say: "Signals move from the inputs on the left to Y on the right. Follow them one gate at a time.", stage: { lit: [] } },
                        {
                          id: "s2",
                          say: "B is {B}. The NOT gate flips it.",
                          stage: { lit: ["n1"] },
                          ask: { prompt: "What comes out of NOT?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Yes: NOT 0 = 1.", afterWrong: "NOT flips 0 to 1." },
                        },
                        {
                          id: "s3",
                          say: "The AND gate receives A = {A} and NOT B = {notB}. AND outputs 1 only when both are 1.",
                          stage: { lit: ["n1", "g1"] },
                          ask: { prompt: "What does the AND gate output?", options: ["0", "1"], correctIndex: 1, afterCorrect: "Right, both inputs are 1, so 1.", afterWrong: "Both inputs are 1, so the AND gate outputs 1." },
                        },
                        { id: "s4", say: "The OR gate receives {g1} and C = {C}. OR outputs 1 when at least one input is 1. So Y = {answer}.", stage: { lit: ["n1", "g1", "g2"] } },
                      ],
                      misconceptions: [
                        { id: "lg.forgot-not", title: "Did not apply the NOT gate", nudgeKey: "lg.check-not", detect: { type: "equals", value: 0 } },
                      ],
                    },
                    {
                      id: "v000",
                      prompt: "Now A = {A}, B = {B}, C = {C}. Predict Y again.",
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
                      hints: [
                        { rung: 2, text: "Not quite. Start with the NOT gate and work towards Y." },
                        { rung: 3, text: "NOT flips. AND needs both inputs at 1. OR needs at least one input at 1." },
                        { rung: 4, text: "NOT B = {notB}. A = {A}. Can the AND gate output 1?" },
                        { rung: 5, text: "Look at the AND gate: one of its inputs is 0.", focus: "gate-g1", highlight: "gate-g1" },
                        { rung: 6, text: "AND({A}, {notB}) = {g1}. OR({g1}, C = {C}) = ?" },
                        { rung: 7, text: "OR with two closed doors: nobody gets in." },
                        { rung: 8, text: "Both OR inputs are 0, so the OR gate outputs 0." },
                        { rung: 9, text: "Y = {answer}. NOT B = {notB}; AND = {g1}; OR({g1}, {C}) = {answer}." },
                      ],
                      explanation: [
                        { id: "s1", say: "Same circuit, new inputs. Follow the signals again.", stage: { lit: [] } },
                        { id: "s2", say: "B = {B}, so NOT B = {notB}.", stage: { lit: ["n1"] } },
                        {
                          id: "s3",
                          say: "AND receives A = {A} and {notB}.",
                          stage: { lit: ["n1", "g1"] },
                          ask: { prompt: "What does the AND gate output?", options: ["0", "1"], correctIndex: 0, afterCorrect: "Right: A is 0, so AND is 0.", afterWrong: "A is 0, so the AND gate cannot output 1. It outputs 0." },
                        },
                        { id: "s4", say: "OR receives {g1} and C = {C}. Both are 0, so Y = {answer}.", stage: { lit: ["n1", "g1", "g2"] } },
                      ],
                      misconceptions: [
                        { id: "lg.not-as-one", title: "Treated NOT output as the final answer", nudgeKey: "lg.follow-through", detect: { type: "equals", value: 1 } },
                      ],
                    },
                  ],
                },
                {
                  id: "lg.q.identify",
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
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
