/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 8, data compression (#571; content pack ch8 §6, inventory C8-6): the repeated-
 * character code (blank run → b + count, zero run → # + count) and front-end compression (each
 * entry starts with the number of leading characters it shares with the entry above). The counts
 * are numeric steps; the compressed forms are computed here from the data, never typed in.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";
import { count, type Count } from "./counting";

type TopicInput = z.input<typeof TopicSchema>;

/** The blank is shown as ␣ in prompts; the code letter is b (the deck writes a blank as b). */
export const BLANK = "␣";

/** Leading characters two entries share, punctuation and spaces counted. */
export function sharedPrefix(above: string, entry: string): number {
  let n = 0;
  while (n < above.length && n < entry.length && above[n] === entry[n]) n++;
  return n;
}
/** The same count with spaces and punctuation skipped (the common slip). */
function lettersOnly(above: string, entry: string): number {
  let n = 0;
  for (let i = 0; i < Math.min(above.length, entry.length) && above[i] === entry[i]; i++) if (/[A-Za-z0-9]/.test(entry[i])) n++;
  return n;
}
export const frontEnd = (above: string, entry: string) => `${sharedPrefix(above, entry)}${entry.slice(sharedPrefix(above, entry))}`;

export interface Run {
  head: string;
  symbol: "blank" | "zero";
  length: number;
}
export const runText = (r: Run) => r.head + (r.symbol === "blank" ? BLANK : "0").repeat(r.length);
export const runCode = (r: Run) => `${r.head}${r.symbol === "blank" ? "b" : "#"}${r.length}`;

export const RUNS: Run[] = [
  { head: "ADAMS", symbol: "blank", length: 10 },
  { head: "JONES", symbol: "blank", length: 7 },
  { head: "3", symbol: "zero", length: 8 },
  { head: "25", symbol: "zero", length: 6 },
];

const REPEATED = "In the repeated-character method a run of blanks is replaced by b and the count of blanks, and a run of zeros by # and the count of zeros.";
const runCount = count(
  "cp.q.run-count",
  "Length of the run",
  "cp.repeated",
  "cp.obj.run-count",
  RUNS.map((r): Count => ({
    prompt:
      r.symbol === "blank"
        ? `The field “${runText(r)}” is “${r.head}” followed by a run of blanks (each shown as ${BLANK}). How many blanks are in the run?`
        : `The field “${runText(r)}” is “${r.head}” followed by a run of zeros. How many zeros are in the run?`,
    answer: r.length,
    rule: REPEATED,
    apply: `The run after “${r.head}” is ${r.length} ${r.symbol === "blank" ? "blanks" : "zeros"} long, so the code ends in ${r.length}.`,
    hint: `Count only the ${r.symbol === "blank" ? BLANK : "0"} symbols after “${r.head}”.`,
    wrong: [{ id: "cp.run-off", nudgeKey: "fm.run-off", value: r.length + r.head.length }],
  })),
);

const codeRow = (r: Run): Row => {
  const marker = r.symbol === "blank" ? "b" : "#";
  const otherMarker = r.symbol === "blank" ? "#" : "b";
  return {
    prompt: `Compress “${runText(r)}” with the repeated-character method (a run of ${r.symbol === "blank" ? `blanks, shown as ${BLANK}, becomes b` : "zeros becomes #"} and its count). Which is the result?`,
    correct: runCode(r),
    wrong: [`${r.head}${marker}${r.length - 1}`, `${r.head}${otherMarker}${r.length}`, `${r.head}${r.length}`],
    rule: REPEATED,
    apply: `${r.head} stays as it is, and the run of ${r.length} becomes ${marker}${r.length}: ${runCode(r)}.`,
    hint: `Keep “${r.head}”, then the code letter, then the count.`,
  };
};
const runCodeQuestion = mcq("cp.q.run-code", "The compressed field", "cp.repeated", "cp.obj.run-code", RUNS.map(codeRow));

/* ---------- front-end compression ---------- */

const FRONT = "In front-end compression every entry starts with the number of leading characters it shares with the entry immediately above it (commas and spaces count), followed by the rest of the entry. The first entry is kept whole.";

export const PAIRS: [string, string][] = [
  ["Smith, Betty", "Smith, Donald"],
  ["Jones, Mary", "Jones, Peter"],
  ["Brown, Anna", "Browne, Carl"],
  ["Lee, Tom", "Lee, Tim"],
];

const prefixCount = count(
  "cp.q.prefix",
  "Shared characters",
  "cp.front",
  "cp.obj.prefix",
  PAIRS.map(([above, entry]): Count => {
    const n = sharedPrefix(above, entry);
    return {
      prompt: `Front-end compression. The entry above is “${above}”. How many leading characters does “${entry}” share with it? Count commas and spaces.`,
      answer: n,
      rule: FRONT,
      apply: `“${entry.slice(0, n)}” is shared: ${n} characters, so the compressed entry is ${frontEnd(above, entry)}.`,
      hint: "Compare the two from the left, one character at a time, until they differ.",
      wrong: [{ id: "cp.prefix-punct", nudgeKey: "fm.prefix-punct", value: lettersOnly(above, entry) }],
    };
  }),
);

/** Three entries: an entry's count against the one above differs from its count against the first. */
export const THIRDS: [string, string, string][] = [
  ["Park, Al", "Parker, Bo", "Parker, Cy"],
  ["Adams, Carl", "Adamson, Dan", "Adamson, Eve"],
  ["Cole, Ann", "Colt, Bea", "Colton, Cal"],
];
const prefixThird = count(
  "cp.q.prefix-third",
  "Against the entry above",
  "cp.front",
  "cp.obj.prefix",
  THIRDS.map(([first, above, entry]): Count => {
    const n = sharedPrefix(above, entry);
    return {
      prompt: `A list is compressed by the front-end method. Its entries are “${first}”, “${above}” and “${entry}”. What count starts the compressed third entry?`,
      answer: n,
      rule: FRONT,
      apply: `The third entry is compared with the second only: “${entry.slice(0, n)}” is shared, so the count is ${n}.`,
      hint: "Which entry is directly above the third one?",
      wrong: [{ id: "cp.prefix-first", nudgeKey: "fm.prefix-first", value: sharedPrefix(first, entry) }],
    };
  }),
);

const frontRow = ([above, entry]: [string, string]): Row => {
  const n = sharedPrefix(above, entry);
  return {
    prompt: `The entry above is “${above}”. What is “${entry}” after front-end compression?`,
    correct: frontEnd(above, entry),
    wrong: [`${n - 1}${entry.slice(n - 1)}`, `${n + 1}${entry.slice(n + 1)}`, entry],
    rule: FRONT,
    apply: `${n} leading characters are shared, so ${entry} becomes ${frontEnd(above, entry)}.`,
    hint: "Find the shared characters first, then write their count before what is left.",
  };
};
const frontCode = mcq("cp.q.front-code", "The compressed entry", "cp.front", "cp.obj.front-code", PAIRS.slice(0, 3).map(frontRow));

const METHODS = ["Repeated characters", "Repeated terms", "Front-end"];
const METHOD_RULE =
  "Repeated characters: a run is replaced by a code and a count. Repeated terms: a frequent word is replaced by one symbol. Front-end: the leading characters shared with the entry above are replaced by their count.";
const methodRow = (prompt: string, correct: string, apply: string): Row => ({
  prompt,
  correct,
  wrong: METHODS.filter((m) => m !== correct),
  rule: METHOD_RULE,
  apply,
  hint: "What is being replaced: a run, a word or a prefix?",
});
const method = mcq("cp.q.method", "Which method", "cp.methods", "cp.obj.method", [
  methodRow("A run of blanks becomes b and a count; a run of zeros becomes # and a count. Which compression method?", "Repeated characters", "A run replaced by a code and a count is the repeated-character method."),
  methodRow("Frequent words such as student, course, grade and department each become one symbol. Which compression method?", "Repeated terms", "A frequent word replaced by a symbol is the repeated-terms method."),
  methodRow("Each entry starts with the number of leading characters it shares with the entry above. Which compression method?", "Front-end", "A count of the characters shared with the entry above is front-end compression."),
]);

export const compressionTopic: TopicInput = {
  id: "compression",
  title: "Data compression",
  summary: "Replace a run of blanks or zeros with a code and a count, and replace the start of an entry with the count it shares with the entry above.",
  concepts: [
    { id: "cp.repeated", title: "Repeated characters", summary: "A run of blanks becomes b and its count; a run of zeros becomes # and its count." },
    { id: "cp.front", title: "Front-end compression", summary: "Each entry starts with the count of leading characters shared with the entry above, then the rest." },
    { id: "cp.methods", title: "The three methods", summary: "Repeated characters, repeated terms and front-end compression tell apart by what they replace." },
  ],
  objectives: [
    { id: "cp.obj.run-count", conceptId: "cp.repeated", text: "Count the length of a run of blanks or zeros." },
    { id: "cp.obj.run-code", conceptId: "cp.repeated", text: "Write a field with a run replaced by its code and count." },
    { id: "cp.obj.prefix", conceptId: "cp.front", text: "Count the leading characters an entry shares with the entry above." },
    { id: "cp.obj.front-code", conceptId: "cp.front", text: "Write an entry in front-end compressed form." },
    { id: "cp.obj.method", conceptId: "cp.methods", text: "Say which compression method a description fits." },
  ],
  activities: [
    { id: "repeated-characters", title: "Repeated characters", summary: "Count a run and write its code.", authority: "DEMO", minutes: 8, questions: [runCount, runCodeQuestion] },
    { id: "front-end", title: "Front-end compression", summary: "Count the shared start and write the entry.", authority: "DEMO", minutes: 10, questions: [prefixCount, prefixThird, frontCode] },
    { id: "methods", title: "Which method", summary: "Tell the three methods apart.", authority: "DEMO", minutes: 4, questions: [method] },
  ],
};
