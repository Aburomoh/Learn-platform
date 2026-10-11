import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { PAIRS, RUNS, THIRDS, runCode, runText, frontEnd, sharedPrefix } from "./compression";
import { INDEXED_SETS, SEQUENTIAL_SETS } from "./counting";

const COURSE = "cpet181";
const questions = (topic: string, activity: string) => getActivity(COURSE, topic, activity)!.activity.questions;
const question = (topic: string, activity: string, id: string) => questions(topic, activity).find((q) => q.id === id)!;

const numericAnswers = (topic: string, activity: string, id: string) =>
  question(topic, activity, id).variants.map((v) => {
    if (v.spec.kind !== "numeric") throw new Error(`${id}/${v.id}: numeric expected`);
    return v.spec.answer;
  });
const choice = (v: ReturnType<typeof question>["variants"][number]) => {
  if (v.spec.kind !== "multiple-choice") throw new Error(`${v.id}: multiple-choice expected`);
  const { options, correctOptionId } = v.spec;
  return { correct: options.find((o) => o.id === correctOptionId)!.text, texts: options.map((o) => o.text) };
};

describe("CPET 181 Chapter 8 file management content (#571)", () => {
  it("has four topics and every question has three or four variants", () => {
    const ch = getActivity(COURSE, "file-basics", "file-manager");
    expect(ch).toBeTruthy();
    for (const [topic, activity] of [
      ["file-basics", "file-manager"],
      ["file-basics", "hierarchy"],
      ["file-basics", "record-types"],
      ["record-organization", "organizations"],
      ["record-organization", "choosing"],
      ["record-organization", "searching"],
      ["compression", "repeated-characters"],
      ["compression", "front-end"],
      ["compression", "methods"],
      ["fat-ntfs", "facts"],
      ["fat-ntfs", "choose"],
    ]) {
      for (const q of questions(topic, activity)) {
        expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
      }
    }
  });

  it("run counts and codes are the data's own: ADAMS + 10 blanks, 3 + 8 zeros", () => {
    expect(numericAnswers("compression", "repeated-characters", "cp.q.run-count")).toEqual(RUNS.map((r) => String(r.length)));
    const codes = question("compression", "repeated-characters", "cp.q.run-code").variants.map((v) => choice(v).correct);
    expect(codes).toEqual(RUNS.map(runCode));
    // the two slide examples (Ch8 s.10)
    expect(runCode({ head: "ADAMS", symbol: "blank", length: 10 })).toBe("ADAMSb10");
    expect(runCode({ head: "3", symbol: "zero", length: 8 })).toBe("3#8");
    for (const r of RUNS) expect(runText(r).length).toBe(r.head.length + r.length);
  });

  it("front-end counts reproduce the slide table (7, 7, 5) and compare only with the entry above", () => {
    expect(frontEnd("Smith, Betty", "Smith, Donald")).toBe("7Donald");
    expect(frontEnd("Smith, Donald", "Smith, Gino")).toBe("7Gino");
    expect(frontEnd("Smith, Gino", "Smithberger, Gino")).toBe("5berger, Gino");
    expect(numericAnswers("compression", "front-end", "cp.q.prefix")).toEqual(PAIRS.map(([a, e]) => String(sharedPrefix(a, e))));
    expect(numericAnswers("compression", "front-end", "cp.q.prefix-third")).toEqual(THIRDS.map(([, a, e]) => String(sharedPrefix(a, e))));
    for (const [first, above, entry] of THIRDS) expect(sharedPrefix(above, entry), entry).not.toBe(sharedPrefix(first, entry));
  });

  it("a front-end answer is not a lucky prefix: the next characters differ", () => {
    for (const [a, e] of [...PAIRS, ...THIRDS.map(([, a, e]) => [a, e] as [string, string])]) {
      const n = sharedPrefix(a, e);
      expect(n, e).toBeGreaterThan(0);
      expect(a[n] === e[n], `${a} / ${e}`).toBe(false);
    }
  });

  it("finding a record: records read from the start, block from the index", () => {
    expect(numericAnswers("record-organization", "searching", "ro.q.read")).toEqual(SEQUENTIAL_SETS.map((s) => String(s.records.indexOf(s.key) + 1)));
    expect(numericAnswers("record-organization", "searching", "ro.q.block")).toEqual(
      INDEXED_SETS.map((s) => {
        const blocks: string[][] = [];
        for (let i = 0; i < s.records.length; i += 3) blocks.push(s.records.slice(i, i + 3));
        return String(blocks.findIndex((b) => Number(b[b.length - 1]) >= Number(s.key)));
      }),
    );
  });

  it("the layout figures do not show the answer: no search key is drawn", () => {
    for (const [activity, id] of [
      ["organizations", "ro.q.identify"],
      ["searching", "ro.q.read"],
      ["searching", "ro.q.block"],
    ]) {
      for (const v of question("record-organization", activity, id).variants) {
        expect(v.figure?.type, `${id}/${v.id}`).toBe("file-layout");
        if (v.figure?.type === "file-layout") expect(v.figure.key, `${id}/${v.id}`).toBeUndefined();
      }
    }
  });

  it("identify-the-organization shows each layout once", () => {
    const layouts = question("record-organization", "organizations", "ro.q.identify").variants.map((v) => (v.figure?.type === "file-layout" ? v.figure.layout : ""));
    expect([...layouts].sort()).toEqual(["direct", "indexed", "sequential"]);
    const answers = question("record-organization", "organizations", "ro.q.identify").variants.map((v) => choice(v).correct);
    expect(answers).toEqual(layouts.map((l) => (l === "direct" ? "Direct" : l === "indexed" ? "Indexed sequential" : "Sequential")));
  });

  it("hints before the last rung never contain the answer", () => {
    for (const [topic, activity] of [
      ["file-basics", "file-manager"],
      ["file-basics", "hierarchy"],
      ["file-basics", "record-types"],
      ["record-organization", "organizations"],
      ["record-organization", "choosing"],
      ["compression", "repeated-characters"],
      ["compression", "front-end"],
      ["compression", "methods"],
      ["fat-ntfs", "facts"],
      ["fat-ntfs", "choose"],
    ]) {
      for (const q of questions(topic, activity)) {
        for (const v of q.variants) {
          if (v.spec.kind !== "multiple-choice") continue;
          const { correct } = choice(v);
          const early = v.hints.slice(0, -1).map((h) => h.text).join(" ");
          expect(early, `${q.id}/${v.id}`).not.toContain(correct);
        }
      }
    }
  });
});
