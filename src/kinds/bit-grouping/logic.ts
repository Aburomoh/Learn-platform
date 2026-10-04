import { groupBits } from "@/content/binary";
import type { KindLogic } from "../types";
import type { BitGroupingSpec } from "./spec";

/**
 * to-digits: step 0 `groups` as marked, padding included, left to right, with "." between the
 * whole and fraction groups when there is a point; steps 1…G `digit` of group G.
 * to-bits: step i `group`, the 3 or 4 bits of digit i (0-based), left to right.
 */
export type BitGroupingAnswer = { kind: "bit-grouping"; step: number; groups?: string[]; digit?: string; group?: string };

/**
 * Groups outward from the point: the whole part from the right (zeros on the far left), the
 * fraction from the left (zeros on the far right). Without a point this is `groupBits`.
 */
export function groupsAroundPoint(bits: string, size: number): { whole: string[]; frac: string[] } {
  const [w, f = ""] = bits.split(".");
  const whole = groupBits(w, size);
  const frac = f ? (f.padEnd(Math.ceil(f.length / size) * size, "0").match(new RegExp(`.{${size}}`, "g")) ?? []) : [];
  return { whole, frac };
}

/** Every group, left to right (the order of the digits). */
export const allGroups = (spec: BitGroupingSpec) => {
  const { whole, frac } = groupsAroundPoint(spec.bits, spec.groupSize);
  return [...whole, ...frac];
};

/** Step 0's expected marking: the groups, with "." between whole and fraction groups. */
export function markedGroups(spec: BitGroupingSpec): string[] {
  const { whole, frac } = groupsAroundPoint(spec.bits, spec.groupSize);
  return frac.length ? [...whole, ".", ...frac] : whole;
}

const digitOf = (group: string) => parseInt(group, 2).toString(16).toUpperCase();

/** The digits computed from the bits, with the point: what `answer` must equal (content test). */
export function computedAnswer(spec: BitGroupingSpec): string {
  const { whole, frac } = groupsAroundPoint(spec.bits, spec.groupSize);
  const w = whole.map(digitOf).join("").replace(/^0+(?=.)/, "");
  return frac.length ? `${w}.${frac.map(digitOf).join("")}` : w;
}

export const bitGrouping: KindLogic<BitGroupingSpec, BitGroupingAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const groups = allGroups(spec);
    const find = (type: string) => variant.misconceptions.find((m) => m.detect.type === type)?.id;

    if (spec.direction === "to-bits") {
      const want = groups[answer.step];
      if (want === undefined) throw new Error(`No grouping step ${answer.step}`);
      const got = (answer.group ?? "").trim();
      const normalized = `${digitOf(want)}=${got}`;
      const correct = got === want;
      if (correct) return { correct, normalized, partial: answer.step < groups.length - 1 };
      const kind =
        /^[01]+$/.test(got) && got.length < want.length && parseInt(got, 2) === parseInt(want, 2)
          ? "bits-unpadded"
          : [...got].reverse().join("") === want && got !== want
            ? "bits-reversed"
            : undefined;
      return { correct, normalized, misconceptionId: kind ? find(kind) : undefined };
    }

    if (answer.step < 0 || answer.step > groups.length) throw new Error(`No grouping step ${answer.step}`);
    if (answer.step === 0) {
      if (!answer.groups) throw new Error("Grouping step 0 needs groups");
      const normalized = answer.groups.join("|");
      const correct = normalized === markedGroups(spec).join("|");
      if (correct) return { correct, normalized, partial: true };
      const kind = groupingMistake(spec, answer.groups);
      return { correct, normalized, misconceptionId: kind ? find(kind) : undefined };
    }
    if (answer.digit === undefined) throw new Error(`Grouping step ${answer.step} needs a digit`);
    const group = groups[answer.step - 1];
    const value = parseInt(group, 2);
    const digit = answer.digit.trim().toUpperCase();
    const normalized = `${group}=${digit}`;
    const correct = digit === value.toString(16).toUpperCase();
    if (correct) return { correct, normalized, partial: answer.step < groups.length };
    const decimal = value >= 10 && digit === String(value);
    return { correct, normalized, misconceptionId: decimal ? find("digit-as-decimal") : undefined };
  },

  // to-digits: step 0 marks the groups, then one digit per group. to-bits: one group per digit.
  steps: {
    count: (spec) => (spec.direction === "to-bits" ? allGroups(spec).length : 1 + allGroups(spec).length),
    tag: (spec, i) => (spec.direction === "to-bits" ? "bits" : i === 0 ? "group" : "digit"),
    vars: (spec, i) => {
      const groups = allGroups(spec);
      const [whole, frac = ""] = spec.bits.split(".");
      const { whole: wg, frac: fg } = groupsAroundPoint(spec.bits, spec.groupSize);
      const common = { groupSize: spec.groupSize, bits: spec.bits, groupCount: groups.length, stepNumber: i + 1 };
      if (spec.direction === "to-bits") {
        const g = groups[i];
        return { ...common, groupIndex: i + 1, groupBits: g, groupValue: parseInt(g, 2), digit: digitOf(g) };
      }
      if (i === 0) return { ...common, padCount: wg.length * spec.groupSize - whole.length, fracPadCount: fg.length * spec.groupSize - frac.length };
      const g = groups[i - 1];
      return { ...common, groupIndex: i, groupBits: g, groupValue: parseInt(g, 2), digit: digitOf(g) };
    },
  },
};

/**
 * Names the grouping mistake in a wrong step-0 answer. The student only places separators and
 * adds zeros, so the bits are given; group lengths tell the mistake. With a point, a fraction
 * grouped from its right end (zeros on its left) is told apart first.
 */
function groupingMistake(spec: BitGroupingSpec, marked: string[]): string | undefined {
  const size = spec.groupSize;
  const dot = marked.indexOf(".");
  if (spec.bits.includes(".") && dot >= 0) {
    const { whole } = groupsAroundPoint(spec.bits, size);
    const frac = spec.bits.split(".")[1];
    const fromRightEnd = groupBits(frac, size); // padded on the left: the mistake
    if (marked.slice(0, dot).join("|") === whole.join("|") && marked.slice(dot + 1).join("|") === fromRightEnd.join("|")) return "fraction-from-right-end";
    marked = marked.slice(0, dot); // judge the whole part's grouping below
  }
  const lengths = marked.map((g) => g.length);
  const [first, ...rest] = lengths;
  const init = lengths.slice(0, -1);
  if (init.length && init.every((l) => l === size) && lengths[lengths.length - 1] < size) return "group-from-left";
  if (rest.every((l) => l === size) && first < size) return "group-no-padding";
  if (rest.length && rest.every((l) => l === rest[0]) && rest[0] !== size) return "group-wrong-size";
  return undefined;
}
