import { describe, expect, it } from "vitest";
import { ModuleSchema } from "../../schema";
import { chapter1 } from "./index";

/**
 * CPET 181 Chapter 1 (#555). Until the chapter is registered in `courses` (needs #554), the shared
 * registry tests do not reach it, so the same rules are checked here.
 */
const mod = ModuleSchema.parse(chapter1);
type Variant = (typeof mod.topics)[number]["activities"][number]["questions"][number]["variants"][number];
/** The multiple-choice spec of a variant and its correct option's text. */
function choice(v: Variant) {
  if (v.spec.kind !== "multiple-choice") throw new Error(`${v.id} is not multiple-choice`);
  const spec = v.spec;
  return { spec, correctId: spec.correctOptionId, correct: spec.options.find((o) => o.id === spec.correctOptionId)!.text };
}
const questions = mod.topics.flatMap((t) => t.activities.flatMap((a) => a.questions.map((q) => ({ t, a, q }))));

describe("CPET181 chapter 1 content", () => {
  it("parses against the schema, DEMO authority, three topics and every CORE area", () => {
    expect(mod.topics.map((t) => t.id)).toEqual(["hardware-and-memory", "os-and-managers", "interfaces-and-types"]);
    for (const t of mod.topics) for (const a of t.activities) expect(a.authority).toBe("DEMO");
    expect(questions.length).toBeGreaterThanOrEqual(15);
  });

  it("uses only multiple-choice, three or four sets per question, ids unique and variant ids by position", () => {
    const ids = new Set<string>();
    for (const { q } of questions) {
      expect(ids.has(q.id), q.id).toBe(false);
      ids.add(q.id);
      expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
      q.variants.forEach((v, i) => {
        expect(v.spec.kind).toBe("multiple-choice");
        expect(v.id).toBe(`v${i + 1}`);
      });
      // a retry is a different item: another question or another correct answer
      const items = q.variants.map((v) => `${v.prompt}|${choice(v).correct}`);
      expect(new Set(items).size, `${q.id} retry must be a different item`).toBe(items.length);
    }
  });

  it("each question's concept and objective are declared in its topic", () => {
    for (const { t, q } of questions) {
      expect(t.concepts.map((c) => c.id), q.id).toContain(q.conceptId);
      const o = t.objectives.find((x) => x.id === q.objectiveId);
      expect(o?.conceptId, q.id).toBe(q.conceptId);
    }
  });

  it("options are distinct, the correct option exists, and it does not sit in one place in every set", () => {
    for (const { q } of questions) {
      const positions = new Set<number>();
      for (const v of q.variants) {
        const { spec, correctId } = choice(v);
        const texts = spec.options.map((o) => o.text);
        expect(new Set(texts).size, `${q.id}/${v.id}`).toBe(texts.length);
        const at = spec.options.findIndex((o) => o.id === correctId);
        expect(at, `${q.id}/${v.id}`).toBeGreaterThanOrEqual(0);
        positions.add(at);
      }
      expect(positions.size, `${q.id} correct option never moves`).toBeGreaterThan(1);
    }
  });

  it("hints ascend, the last rung names the answer, and no text carries a slot or a slide note", () => {
    for (const { q } of questions)
      for (const v of q.variants) {
        const { correct } = choice(v);
        const rungs = v.hints.map((h) => h.rung);
        expect(rungs, `${q.id}/${v.id}`).toEqual([...rungs].sort((a, b) => a - b));
        expect(v.hints.at(-1)!.text, `${q.id}/${v.id}`).toContain(correct);
        expect(v.hints.slice(0, -1).map((h) => h.text).join(" "), `${q.id}/${v.id} hint gives the answer away`).not.toContain(correct);
        const all = [v.prompt, ...v.hints.map((h) => h.text), ...v.explanation.map((e) => e.say)].join("\n");
        expect(all, q.id).not.toMatch(/[{}]/);
        expect(v.prompt, q.id).not.toMatch(/\bs\.\d/);
        expect(v.explanation.length).toBeGreaterThanOrEqual(2);
      }
  });

  it("pins the pack's facts: RAM vs ROM rows, the five managers, hard vs soft real-time", () => {
    const correctOf = (qid: string) =>
      questions
        .find((x) => x.q.id === qid)!
        .q.variants.map((v) => choice(v).correct);
    expect(correctOf("rr.q.stands")).toEqual(["Random Access Memory", "Read-Only Memory", "ROM: Read-Only Memory"]);
    expect(correctOf("rr.q.what")).toEqual(["ROM", "RAM", "ROM"]);
    expect(correctOf("rr.q.use")).toEqual(["RAM", "ROM", "RAM"]);
    expect(correctOf("rr.q.volatility")).toEqual(["RAM", "ROM", "It is lost"]);
    expect(correctOf("mg.q.charge")).toEqual(["Memory Manager", "Processor Manager", "Device Manager", "File Manager"]);
    expect(correctOf("mg.q.duty")).toEqual(["Memory Manager", "File Manager", "Processor Manager", "Network Manager"]);
    expect(correctOf("ty.q.deadline")).toEqual(["Hard real-time", "Soft real-time", "Total system failure"]);
    expect(correctOf("os.q.software")).toEqual(["The operating system", "An application such as the Microsoft Office package", "Windows, an operating system"]);
    expect(correctOf("ty.q.example")).toEqual(["Embedded", "Real-time", "Batch", "Interactive"]);
    // five managers, never four or six
    expect(choice(questions.find((x) => x.q.id === "mg.q.charge")!.q.variants[0]).spec.options).toHaveLength(5);
  });
});
