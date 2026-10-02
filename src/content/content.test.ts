import { describe, expect, it } from "vitest";
import { courses, getActivity, listActivityParams } from "./index";
import { evaluateCircuit, grade, valueToBits, bitsToValue } from "./grade";
import { fill } from "./template";
import type { Variant } from "./schema";

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

describe("content registry", () => {
  it("parses every course against the schema (parse happens at import)", () => {
    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((c) => c.authority === "DEMO" || c.authority === "APPROVED")).toBe(true);
  });

  it("marks all current content as DEMO", () => {
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
    const ref = getActivity("digital-logic-demo", "number-systems", "decimal-to-binary");
    expect(ref?.activity.questions.length).toBeGreaterThanOrEqual(2);
    expect(getActivity("nope", "x", "y")).toBeUndefined();
  });
});

describe("authored truth is internally consistent", () => {
  it("place-value answers equal the value and slot count", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "place-value") continue;
      expect(variant.spec.answer.length, path).toBe(variant.spec.slots);
      expect(bitsToValue(variant.spec.answer), path).toBe(variant.spec.value);
      expect(valueToBits(variant.spec.value, variant.spec.slots), path).toEqual(variant.spec.answer);
    }
  });

  it("circuit answers equal the evaluated circuit", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "circuit-predict") continue;
      const values = evaluateCircuit(variant.spec);
      expect(values[variant.spec.outputGateId], path).toBe(variant.spec.answer);
    }
  });

  it("multiple-choice correct option exists and misconception ids resolve", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "multiple-choice") continue;
      const ids = variant.spec.options.map((o) => o.id);
      expect(ids, path).toContain(variant.spec.correctOptionId);
      const known = new Set(variant.misconceptions.map((m) => m.id));
      for (const o of variant.spec.options) if (o.misconceptionId) expect(known.has(o.misconceptionId), `${path}:${o.id}`).toBe(true);
    }
  });

  it("hints follow the ladder in ascending rung order and every template slot resolves", () => {
    for (const { path, variant } of allVariants()) {
      const rungs = variant.hints.map((h) => h.rung);
      expect([...rungs].sort((a, b) => a - b), path).toEqual(rungs);
      const texts = [variant.prompt, ...variant.hints.map((h) => h.text), ...variant.explanation.flatMap((s) => [s.say, s.ask?.prompt ?? "", s.ask?.afterCorrect ?? "", s.ask?.afterWrong ?? ""])];
      for (const t of texts) expect(fill(t, variant.vars), `${path}: ${t}`).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
    }
  });

  it("prediction questions have a valid correctIndex", () => {
    for (const { path, variant } of allVariants())
      for (const s of variant.explanation)
        if (s.ask) expect(s.ask.correctIndex, `${path}/${s.id}`).toBeLessThan(s.ask.options.length);
  });
});

describe("grade()", () => {
  const pv = getActivity("digital-logic-demo", "number-systems", "decimal-to-binary")!.activity.questions[0].variants[0];
  const hex = getActivity("digital-logic-demo", "number-systems", "decimal-to-binary")!.activity.questions[1].variants[0];
  const circuit = getActivity("digital-logic-demo", "logic-gates", "predict-gate-output")!.activity.questions[0].variants[0];
  const mc = getActivity("digital-logic-demo", "logic-gates", "predict-gate-output")!.activity.questions[1].variants[0];

  it("grades place-value answers and detects misconceptions", () => {
    expect(grade(pv, { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] }).correct).toBe(true);
    expect(grade(pv, { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] }).misconceptionId).toBeUndefined();
    const pv29 = getActivity("digital-logic-demo", "number-systems", "decimal-to-binary")!.activity.questions[0].variants[1];
    expect(grade(pv29, { kind: "place-value", digits: [1, 0, 1, 1, 1, 0] })).toMatchObject({ correct: false, misconceptionId: "ns.reversed" });
    expect(grade(pv, { kind: "place-value", digits: [0, 0, 1, 1, 0, 1] })).toMatchObject({ correct: false, misconceptionId: "ns.skip-largest" });
    expect(grade(pv, { kind: "place-value", digits: [1, 1, 1, 1, 0, 1] })).toMatchObject({ correct: false, misconceptionId: "ns.extra-16" });
    expect(grade(pv, { kind: "place-value", digits: [null, null, null, null, null, null] }).correct).toBe(false);
  });

  it("grades numeric answers case- and zero-insensitively", () => {
    expect(grade(hex, { kind: "numeric", text: "2d" }).correct).toBe(true);
    expect(grade(hex, { kind: "numeric", text: " 02D " }).correct).toBe(true);
    expect(grade(hex, { kind: "numeric", text: "213" })).toMatchObject({ correct: false, misconceptionId: "ns.hex-digit-decimal" });
    expect(grade(hex, { kind: "numeric", text: "45" })).toMatchObject({ correct: false, misconceptionId: "ns.copied-decimal" });
  });

  it("grades circuit predictions", () => {
    expect(grade(circuit, { kind: "circuit-predict", output: 1 }).correct).toBe(true);
    expect(grade(circuit, { kind: "circuit-predict", output: 0 })).toMatchObject({ correct: false, misconceptionId: "lg.forgot-not" });
  });

  it("grades multiple choice with option-level misconceptions", () => {
    expect(grade(mc, { kind: "multiple-choice", optionId: "and" }).correct).toBe(true);
    expect(grade(mc, { kind: "multiple-choice", optionId: "or" })).toMatchObject({ correct: false, misconceptionId: "lg.or-vs-and" });
  });

  it("rejects mismatched answer kinds", () => {
    expect(() => grade(mc, { kind: "numeric", text: "1" })).toThrow();
  });
});
