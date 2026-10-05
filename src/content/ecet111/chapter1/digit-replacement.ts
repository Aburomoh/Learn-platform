/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * ECET 111 Chapter 1, digit replacement both ways and grouping with a binary point (#214, content
 * pack ch1 §4, §5, §8, §9): octal → binary (3 bits per digit), hex → binary (4 bits per digit), each
 * checked back in decimal as its own step; 16-bit binary → hex; and one binary-point grouping with a
 * worked lead-in (Pedagogy, #244). Bits, digits and decimal values are computed, never typed.
 */
import type { CourseInput, VariantInput } from "../../schema";

type TopicInput = CourseInput["modules"][number]["topics"][number];
type Activity = TopicInput["activities"][number];
type HintInput = NonNullable<VariantInput["hints"]>[number];

/** Octal sets: the pack's fresh numbers, and s.20's (166)₈ (the slide title is wrong: it is octal → binary, owner S4). */
const OCTAL = [0o351, 0o172, 0o605, 0o166];
/** Hex sets: the pack's fresh numbers (§8). */
const HEX = [0x2d6, 0x1e9, 0x3b4];
/** 16-bit binary → hex (§9). */
const HEX16 = [0xb6e3, 0xe95c, 0x9f2b];

const digitsOf = (n: number, base: 8 | 16) => n.toString(base).toUpperCase();
const groupsOf = (n: number, base: 8 | 16) => [...digitsOf(n, base)].map((d) => parseInt(d, 16).toString(2).padStart(base === 8 ? 3 : 4, "0"));

/* ---------- to bits: one digit per goal ---------- */

const bitsHints = (size: 3 | 4): HintInput[] => [
  { rung: 2, text: "Not yet. Look only at digit {groupIndex}: {digit}." },
  { rung: 3, text: `Write that digit as exactly ${size} bits, keeping leading zeros.` },
  { rung: 4, text: size === 3 ? "The weights inside a group are 4, 2, 1. Which of them add up to the digit?" : "The weights inside a group are 8, 4, 2, 1. Which of them add up to the digit?" },
  { rung: 5, text: "This is the digit.", focus: "group-digit", highlight: "group-digit" },
  { rung: 6, text: size === 4 ? "A to F stand for 10 to 15." : "Octal digits run from 0 to 7, so three bits are always enough." },
  { rung: 9, text: "{digit} is {groupBits}." },
];

const bitsMisconceptions: VariantInput["misconceptions"] = [
  { id: "ns.bits-unpadded", title: "Leading zeros dropped inside a group", nudgeKey: "ns.bits-unpadded", detect: { type: "bits-unpadded" } },
  { id: "ns.bits-reversed", title: "Bits written in reverse", nudgeKey: "ns.bits-reversed", detect: { type: "bits-reversed" } },
];

function toBitsVariant(n: number, base: 8 | 16, k: number): VariantInput {
  const size = base === 8 ? 3 : 4;
  const digits = digitsOf(n, base);
  const groups = groupsOf(n, base);
  const first = groups[0];
  const slip = [...first].reverse().join("") === first ? first.replace(/^0/, "") || "0" : [...first].reverse().join("");
  return {
    id: `${base === 8 ? "o" : "h"}${digits.toLowerCase()}`,
    prompt: `Convert (${digits})_${base} to binary: replace each digit by its ${size} bits, one digit at a time.`,
    spec: { kind: "bit-grouping", bits: n.toString(2), groupSize: size, answer: digits, direction: "to-bits" },
    vars: { value: n }, // the same number as the check question with this id (#141)
    hints: bitsHints(size),
    hintsByStep: { bits: bitsHints(size) },
    misconceptions: bitsMisconceptions,
    explanation: [
      { id: "s1", say: `Each ${base === 8 ? "octal" : "hex"} digit becomes exactly ${size} bits, in the same order.`, stage: { attention: 0 } },
      {
        id: "s2",
        say: `The first digit is ${digits[0]}.`,
        stage: { attention: 0 },
        ask: { prompt: `${digits[0]} as ${size} bits is…`, options: k % 2 ? [slip, first] : [first, slip], correctIndex: k % 2, afterCorrect: `Yes: ${first}.`, afterWrong: `${digits[0]} is ${first}: the leftmost bit has the biggest weight.` },
      },
      { id: "s3", say: `Then join the groups: ${groups.join(" ")}, and drop the leading zeros of the whole number.`, stage: { done: true } },
    ],
  };
}

/* ---------- the decimal check, as its own step ---------- */

function checkVariant(n: number, base: 8 | 16): VariantInput {
  const bits = n.toString(2);
  const digits = digitsOf(n, base);
  return {
    id: `${base === 8 ? "o" : "h"}${digits.toLowerCase()}`,
    prompt: `Check: (${digits})_${base} gave (${bits})_2. What is (${bits})_2 in decimal? It should equal (${digits})_${base}.`,
    spec: { kind: "numeric", base: 10, answer: String(n) },
    vars: { value: n },
    hints: [
      { rung: 2, text: "Not yet. Add the place weights of the 1s, reading from the right: 1, 2, 4, 8, …" },
      { rung: 3, text: `Or work out (${digits})_${base} in decimal: the two must agree.` },
      { rung: 9, text: `Both are ${n}.` },
    ],
    misconceptions: [],
    reactions: { correct: `${n}: the binary and the ${base === 8 ? "octal" : "hex"} agree.`, correctAfterHints: `${n}: they agree.` },
    explanation: [
      { id: "s1", say: "A conversion is checked by turning both numbers into decimal: they must be equal." },
      { id: "s2", say: `(${digits})_${base} = ${n}, so (${bits})_2 must be ${n} too.` },
    ],
  };
}

/* ---------- 16-bit binary → hex: group, then one digit per group ---------- */

const groupHints: HintInput[] = [
  { rung: 2, text: "Not yet. Start at the right-hand end of {bits}." },
  { rung: 3, text: "Each group has {groupSize} bits, counted from the right." },
  { rung: 5, text: "Add zeros on the left if the leftmost group is short.", focus: "pad-zero", highlight: "pad-zero" },
  { rung: 9, text: "{groupCount} groups of {groupSize}." },
];
const digitHints: HintInput[] = [
  { rung: 2, text: "Not yet. Look only at group {groupIndex}: {groupBits}." },
  { rung: 3, text: "Inside a group the weights are 8, 4, 2, 1. Values 10 to 15 are written A to F." },
  { rung: 5, text: "Add the weights of the 1s in {groupBits}.", focus: "group-digit", highlight: "group-digit" },
  { rung: 9, text: "{groupBits} is {groupValue}, so the digit is {digit}." },
];
const groupingMisconceptions: VariantInput["misconceptions"] = [
  { id: "ns.group-from-left", title: "Grouped from the left", nudgeKey: "ns.group-from-left", detect: { type: "group-from-left" } },
  { id: "ns.group-no-padding", title: "Short group not padded", nudgeKey: "ns.group-no-padding", detect: { type: "group-no-padding" } },
  { id: "ns.wrong-group-size", title: "Wrong group size", nudgeKey: "ns.wrong-group-size", detect: { type: "group-wrong-size" } },
  { id: "ns.fraction-from-right-end", title: "Fraction grouped from its right end", nudgeKey: "ns.fraction-from-right-end", detect: { type: "fraction-from-right-end" } },
  { id: "ns.hex-digit-decimal", title: "Wrote the decimal value instead of a hex digit", nudgeKey: "ns.hex-letter", detect: { type: "digit-as-decimal" } },
];

function toHexVariant(n: number): VariantInput {
  const bits = n.toString(2).padStart(16, "0");
  const groups = groupsOf(n, 16);
  return {
    id: `b${digitsOf(n, 16).toLowerCase()}`,
    // ungrouped: marking the groups is the first goal, and a spaced token would not render (Reviewer on #463)
    prompt: `Convert (${bits})_2 to hexadecimal: mark the groups of four, then one digit per group.`,
    spec: { kind: "bit-grouping", bits, groupSize: 4, answer: digitsOf(n, 16) },
    hints: groupHints,
    hintsByStep: { group: groupHints, digit: digitHints },
    misconceptions: groupingMisconceptions,
    explanation: [
      { id: "s1", say: "Sixteen bits make exactly four groups of four, so no padding is needed here.", stage: { groups: [] } },
      { id: "s2", say: `Each group becomes one hex digit: ${groups.map((g) => `${g} → ${parseInt(g, 2).toString(16).toUpperCase()}`)[0]}, and so on.`, stage: { groups, attention: 0 } },
      { id: "s3", say: `So the answer is ${digitsOf(n, 16)}.`, stage: { groups, done: true } },
    ],
  };
}

/* ---------- binary point: one worked lead-in (s.22) and one practice, not a drill ---------- */

/** Practice numbers (§5), groups outward from the point. */
const POINT = [
  { bits: "11010110.1", answer: "326.4" },
  { bits: "1110001.11", answer: "161.6" },
  { bits: "1011101.1011", answer: "135.54" }, // third set (C1 gate, #216): both ends padded, a two-group fraction
];

function pointVariant({ bits, answer }: (typeof POINT)[number], k: number): VariantInput {
  return {
    id: `p${answer.replace(".", "")}`,
    prompt: `Convert (${bits})_2 to octal. Group outward from the binary point: left for the whole part, right for the fraction.`,
    spec: { kind: "bit-grouping", bits, groupSize: 3, answer },
    hints: groupHints,
    hintsByStep: {
      group: [
        { rung: 2, text: "Not yet. Start at the binary point and work outward on both sides." },
        { rung: 3, text: "Whole part: groups of three leftward, zeros added on the far left. Fraction: groups of three rightward, zeros added on the far right." },
        { rung: 5, text: "Look at the fraction's last group: is it short?", focus: "pad-zero", highlight: "pad-zero" },
      ],
      digit: digitHints.map((h) => (h.rung === 3 ? { ...h, text: "Inside a group the weights are 4, 2, 1." } : h)),
    },
    misconceptions: groupingMisconceptions,
    explanation: [
      { id: "s1", say: "Worked example (s.22): 10101011.1 → 010 101 011 . 100 → 253.4. The groups run outward from the point.", stage: { groups: [] } },
      {
        id: "s2",
        say: "The fraction's short group is padded on its right end, not its left.",
        ask: { prompt: "So .1 becomes…", options: k % 2 ? [".001", ".100"] : [".100", ".001"], correctIndex: k % 2, afterCorrect: "Yes: .100, which is 4.", afterWrong: "Zeros go on the far right after the point: .100, which is 4." },
      },
      { id: "s3", say: "Now the same with this number: group outward from the point, then one digit per group." },
    ],
  };
}

const replacementActivity: Activity = {
  id: "digit-replacement",
  title: "Digit replacement",
  summary: "Octal and hex to binary one digit at a time, each checked in decimal; 16-bit binary to hex.",
  authority: "DEMO",
  minutes: 20,
  questions: [
    { id: "dr.q.oct-bits", label: "Octal → binary", conceptId: "dr.replacement", objectiveId: "dr.obj.replace", variants: OCTAL.map((n, k) => toBitsVariant(n, 8, k)) },
    { id: "dr.q.oct-check", label: "Octal check", conceptId: "dr.replacement", objectiveId: "dr.obj.replace", variants: OCTAL.map((n) => checkVariant(n, 8)) },
    { id: "dr.q.hex-bits", label: "Hex → binary", conceptId: "dr.replacement", objectiveId: "dr.obj.replace", variants: HEX.map((n, k) => toBitsVariant(n, 16, k)) },
    { id: "dr.q.hex-check", label: "Hex check", conceptId: "dr.replacement", objectiveId: "dr.obj.replace", variants: HEX.map((n) => checkVariant(n, 16)) },
    { id: "dr.q.hex16", label: "16 bits → hex", conceptId: "dr.replacement", objectiveId: "dr.obj.replace", variants: HEX16.map(toHexVariant) },
  ],
};

const pointActivity: Activity = {
  id: "binary-point",
  title: "Grouping with a binary point",
  summary: "One worked example, then one practice: group outward from the point.",
  authority: "DEMO",
  minutes: 8,
  // one practice after a worked lead-in, not a drill (Pedagogy, #244): exempt from the three-set rule
  questions: [{ id: "dr.q.point", label: "Binary point", conceptId: "dr.point", objectiveId: "dr.obj.point", variants: POINT.map((p, k) => pointVariant(p, k)) }],
};

export const digitReplacementTopic: TopicInput = {
  id: "digit-replacement",
  title: "Octal and hex ↔ binary",
  summary: "Each octal digit is 3 bits and each hex digit 4 bits: replace them one at a time, check in decimal, and group outward from a binary point.",
  preview: "(2)_8 → 010",
  concepts: [
    { id: "dr.replacement", title: "Digit replacement", summary: "Octal ↔ binary: one digit for 3 bits; hex ↔ binary: one digit for 4 bits, leading zeros kept inside a group." },
    { id: "dr.point", title: "Binary point", summary: "Groups run outward from the point: whole part padded on the far left, fraction on the far right." },
  ],
  objectives: [
    { id: "dr.obj.replace", conceptId: "dr.replacement", text: "Convert octal and hex to binary by digit replacement and check the result in decimal." },
    { id: "dr.obj.point", conceptId: "dr.point", text: "Convert a binary number with a point to octal." },
  ],
  activities: [replacementActivity, pointActivity],
};
