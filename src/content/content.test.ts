import { describe, expect, it } from "vitest";
import { courses, getActivity, listActivityParams } from "./index";
import { evaluateCircuit, grade, valueToBits, bitsToValue, divisionSteps, groupBits } from "./grade";
import { fill } from "./template";
import type { Variant } from "./schema";
import { placeValue45, placeValue29 } from "./fixtures/placeValue45";

const COURSE = "ecet111";

function allVariants(): { path: string; variant: Variant }[] {
  const out: { path: string; variant: Variant }[] = [];
  for (const c of courses)
    for (const m of c.modules)
      for (const t of m.topics)
        for (const a of t.activities)
          for (const q of a.questions)
            for (const v of q.variants) out.push({ path: `${c.id}/${t.id}/${a.id}/${q.id}/${v.id}`, variant: v });
  return out;
}

/** Every set of template variables a variant can be rendered with (one per step if multi-step). */
function varSets(v: Variant): Record<string, string | number>[] {
  if (v.spec.kind !== "repeated-division") return [v.vars];
  return v.spec.steps.map((s, i) => ({ ...v.vars, dividend: s.dividend, quotient: s.quotient, remainder: s.remainder, stepNumber: i + 1 }));
}

describe("content registry", () => {
  it("parses every course against the schema (parse happens at import)", () => {
    expect(courses.length).toBeGreaterThan(0);
  });

  it("marks all current content as DEMO until the instructor approves it", () => {
    for (const c of courses) {
      expect(c.authority).toBe("DEMO");
      for (const m of c.modules) for (const t of m.topics) for (const a of t.activities) expect(a.authority).toBe("DEMO");
    }
  });

  it("references only declared concepts and objectives", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics) {
          const concepts = new Set(t.concepts.map((x) => x.id));
          const objectives = new Set(t.objectives.map((x) => x.id));
          for (const o of t.objectives) expect(concepts.has(o.conceptId), o.id).toBe(true);
          for (const a of t.activities)
            for (const q of a.questions) {
              expect(concepts.has(q.conceptId), q.id).toBe(true);
              expect(objectives.has(q.objectiveId), q.id).toBe(true);
            }
        }
  });

  it("has unique ids within each scope", () => {
    const paths = listActivityParams().map((p) => `${p.course}/${p.topic}/${p.activity}`);
    expect(new Set(paths).size).toBe(paths.length);
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities) {
            const qids = a.questions.map((q) => q.id);
            expect(new Set(qids).size).toBe(qids.length);
            for (const q of a.questions) {
              const vids = q.variants.map((v) => v.id);
              expect(new Set(vids).size).toBe(vids.length);
            }
          }
  });

  it("resolves an activity by path", () => {
    expect(getActivity(COURSE, "number-systems", "decimal-to-binary")?.activity.questions.length).toBe(4);
    expect(getActivity("nope", "x", "y")).toBeUndefined();
  });
});

describe("pedagogy guard", () => {
  it("never asks for a decimal-to-binary conversion in a single step", () => {
    // Owner feedback (issue #20): the conversion must be walked through the divide-by-2 rule.
    for (const { path, variant } of allVariants()) {
      expect(variant.spec.kind, path).not.toBe("place-value");
      if (variant.spec.kind === "numeric" && variant.spec.base === 2) expect(variant.spec.context?.type, path).toBe("division-chain");
      if (variant.spec.kind === "numeric" && (variant.spec.base === 8 || variant.spec.base === 16)) expect(variant.spec.context?.type, path).toBe("bits");
    }
  });
});

describe("authored truth is internally consistent", () => {
  it("division chains equal the computed divide-by-2 steps and end at quotient 0", () => {
    let checked = 0;
    for (const { path, variant } of allVariants()) {
      const spec = variant.spec;
      const chain = spec.kind === "repeated-division" ? spec : spec.kind === "numeric" && spec.context?.type === "division-chain" ? spec.context : null;
      if (!chain) continue;
      expect(chain.steps, path).toEqual(divisionSteps(chain.value));
      expect(chain.steps.at(-1)?.quotient, path).toBe(0);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it("read-off answers are the remainders from MSB to LSB", () => {
    for (const { path, variant } of allVariants()) {
      const spec = variant.spec;
      if (spec.kind !== "numeric" || spec.context?.type !== "division-chain") continue;
      const bits = [...spec.context.steps].reverse().map((s) => s.remainder).join("");
      expect(spec.answer, path).toBe(bits);
      expect(parseInt(spec.answer, 2), path).toBe(spec.context.value);
    }
  });

  it("octal and hex answers match the grouped bits", () => {
    for (const { path, variant } of allVariants()) {
      const spec = variant.spec;
      if (spec.kind !== "numeric" || spec.context?.type !== "bits") continue;
      const value = parseInt(spec.context.bits, 2);
      expect(spec.answer, path).toBe(value.toString(spec.base).toUpperCase());
      const groups = groupBits(spec.context.bits, spec.context.groupSize);
      expect(groups.map((g) => parseInt(g, 2).toString(spec.base).toUpperCase()).join("").replace(/^0+(?=.)/, ""), path).toBe(spec.answer);
      // authored explanation groups, where present, must equal the computed groups
      for (const s of variant.explanation) if (Array.isArray(s.stage?.groups) && (s.stage.groups as string[]).length) expect(s.stage.groups, `${path}/${s.id}`).toEqual(groups);
    }
  });

  it("circuit answers equal the evaluated circuit", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "circuit-predict") continue;
      expect(evaluateCircuit(variant.spec)[variant.spec.outputGateId], path).toBe(variant.spec.answer);
    }
  });

  it("multiple-choice correct option exists and misconception ids resolve", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "multiple-choice") continue;
      expect(variant.spec.options.map((o) => o.id), path).toContain(variant.spec.correctOptionId);
      const known = new Set(variant.misconceptions.map((m) => m.id));
      for (const o of variant.spec.options) if (o.misconceptionId) expect(known.has(o.misconceptionId), `${path}:${o.id}`).toBe(true);
    }
  });

  it("hints follow the ladder in ascending rung order and every template slot resolves at every step", () => {
    for (const { path, variant } of allVariants()) {
      const rungs = variant.hints.map((h) => h.rung);
      expect([...rungs].sort((a, b) => a - b), path).toEqual(rungs);
      const texts = [variant.prompt, variant.reactions?.stepNext ?? "", ...variant.hints.map((h) => h.text), ...variant.explanation.flatMap((s) => [s.say, s.ask?.prompt ?? "", s.ask?.afterCorrect ?? "", s.ask?.afterWrong ?? ""])];
      for (const vars of varSets(variant)) for (const t of texts) expect(fill(t, vars), `${path}: ${t}`).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
    }
  });

  it("prediction questions have a valid correctIndex", () => {
    for (const { path, variant } of allVariants())
      for (const s of variant.explanation) if (s.ask) expect(s.ask.correctIndex, `${path}/${s.id}`).toBeLessThan(s.ask.options.length);
  });
});

describe("grade()", () => {
  const q = getActivity(COURSE, "number-systems", "decimal-to-binary")!.activity.questions;
  const chain = q[0].variants[0];
  const read = q[1].variants[0];
  const hex = q[3].variants[0];
  const circuit = getActivity(COURSE, "logic-gates", "predict-gate-output")!.activity.questions[0].variants[0];
  const mc = getActivity(COURSE, "logic-gates", "predict-gate-output")!.activity.questions[1].variants[0];

  it("grades one division step at a time: partial until the quotient reaches 0", () => {
    expect(grade(chain, { kind: "repeated-division", step: 0, quotient: 13, remainder: 0 })).toMatchObject({ correct: true, partial: true });
    expect(grade(chain, { kind: "repeated-division", step: 4, quotient: 0, remainder: 1 })).toMatchObject({ correct: true, partial: false });
  });

  it("recognises division-step misconceptions", () => {
    expect(grade(chain, { kind: "repeated-division", step: 1, quotient: 6, remainder: 0 })).toMatchObject({ correct: false, misconceptionId: "div.remainder" });
    expect(grade(chain, { kind: "repeated-division", step: 1, quotient: 7, remainder: 1 })).toMatchObject({ correct: false, misconceptionId: "div.quotient" });
    expect(grade(chain, { kind: "repeated-division", step: 0, quotient: 0, remainder: 13 })).toMatchObject({ correct: false, misconceptionId: "div.swapped" });
    expect(grade(chain, { kind: "repeated-division", step: 0, quotient: 12, remainder: 1 }).misconceptionId).toBeUndefined();
    expect(() => grade(chain, { kind: "repeated-division", step: 9, quotient: 0, remainder: 0 })).toThrow();
  });

  it("grades the read-off and detects LSB-first reading", () => {
    expect(grade(read, { kind: "numeric", text: "11010" }).correct).toBe(true);
    expect(grade(read, { kind: "numeric", text: "01011" })).toMatchObject({ correct: false, misconceptionId: "ns.read-reversed" });
  });

  it("grades numeric answers case- and zero-insensitively", () => {
    expect(grade(hex, { kind: "numeric", text: "1a" }).correct).toBe(true);
    expect(grade(hex, { kind: "numeric", text: " 01A " }).correct).toBe(true);
    expect(grade(hex, { kind: "numeric", text: "110" })).toMatchObject({ correct: false, misconceptionId: "ns.hex-digit-decimal" });
    expect(grade(hex, { kind: "numeric", text: "26" })).toMatchObject({ correct: false, misconceptionId: "ns.copied-decimal" });
  });

  it("grades place-value answers and detects misconceptions (fixture)", () => {
    expect(grade(placeValue45, { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] }).correct).toBe(true);
    expect(grade(placeValue29, { kind: "place-value", digits: [1, 0, 1, 1, 1, 0] })).toMatchObject({ correct: false, misconceptionId: "ns.reversed" });
    expect(grade(placeValue45, { kind: "place-value", digits: [0, 0, 1, 1, 0, 1] })).toMatchObject({ correct: false, misconceptionId: "ns.skip-largest" });
    expect(grade(placeValue45, { kind: "place-value", digits: [1, 1, 1, 1, 0, 1] })).toMatchObject({ correct: false, misconceptionId: "ns.extra-16" });
    expect(bitsToValue(valueToBits(45, 6))).toBe(45);
  });

  it("grades circuit predictions and multiple choice", () => {
    expect(grade(circuit, { kind: "circuit-predict", output: 1 }).correct).toBe(true);
    expect(grade(circuit, { kind: "circuit-predict", output: 0 })).toMatchObject({ correct: false, misconceptionId: "lg.forgot-not" });
    expect(grade(mc, { kind: "multiple-choice", optionId: "and" }).correct).toBe(true);
    expect(grade(mc, { kind: "multiple-choice", optionId: "or" })).toMatchObject({ correct: false, misconceptionId: "lg.or-vs-and" });
  });

  it("rejects mismatched answer kinds", () => {
    expect(() => grade(mc, { kind: "numeric", text: "1" })).toThrow();
  });
});
