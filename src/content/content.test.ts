import { describe, expect, it } from "vitest";
import { courses, getActivity, listActivityParams } from "./index";
import { evaluateCircuit, gateOrder, grade, valueToBits, bitsToValue, divisionSteps, groupBits, additionSteps, additionResult, additionStepVars, complementBits } from "./grade";
import { MULTI_STEP_KINDS, hintsForStep, stepCount, stepTag, stepVars } from "./steps";
import { contextFromVariant } from "@/tutor";
import { InteractionSpec, MultipleChoiceSpec, NumericSpec, VariantSchema } from "./schema";
import { addition1101 } from "./fixtures/columnAddition";
import { complement100101, complement110010 } from "./fixtures/onesComplement";
import { hex26, octal88 } from "./fixtures/bitGrouping";
import { fill } from "./template";
import type { CircuitSpec, Variant } from "./schema";
import { placeValue45, placeValue29 } from "./fixtures/placeValue45";
import { resolveMessage } from "@/tutor/messages";

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
  return Array.from({ length: stepCount(v.spec) }, (_, i) => contextFromVariant(v, "en", stepVars(v.spec, i)).vars);
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

  it("labels every question, and topic previews never reuse the activity's numbers (#116, pedagogy #112)", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics) {
          // Every number a practice uses or expects: values, answer* vars and spec answers.
          const values = new Set<string>();
          const add = (x: unknown) => String(x).toUpperCase().match(/[0-9A-F]+/g)?.forEach((n) => values.add(n));
          for (const a of t.activities)
            for (const q of a.questions) {
              expect(q.label, q.id).toBeTruthy();
              expect(q.label!.length, q.id).toBeLessThanOrEqual(24);
              for (const v of q.variants) {
                for (const [k, x] of Object.entries(v.vars)) if (k === "value" || k.startsWith("answer")) add(x);
                if ("answer" in v.spec && typeof v.spec.answer === "string") add(v.spec.answer);
              }
            }
          const numbers = t.preview?.toUpperCase().match(/[0-9A-F]+/g) ?? [];
          for (const n of numbers) expect(values.has(n), `${t.id} preview uses ${n}`).toBe(false);
        }
    const ns = courses[0].modules.flatMap((m) => m.topics).find((t) => t.id === "number-systems")!;
    expect(ns.preview).toBe("53₁₀ → 110101₂ → 65₈ → 35₁₆");
    expect([(53).toString(2), (53).toString(8), (53).toString(16)]).toEqual(["110101", "65", "35"]);
  });

  it("walks the 88 and 73 exercise (#43) with the slide answers, two variants per question", () => {
    const x = getActivity(COURSE, "number-systems", "conversion-exercise")!.activity;
    expect(x.questions.map((q) => q.label)).toEqual(["Divide by 2", "Read off", "Octal", "Hex"]);
    for (const q of x.questions) expect(q.variants.map((v) => v.id), q.id).toEqual(["v88", "v73"]);
    const answers = x.questions.map((q) => q.variants.map((v) => ("answer" in v.spec ? v.spec.answer : v.spec.kind === "repeated-division" ? v.spec.steps.length : "")));
    expect(answers).toEqual([[7, 7], ["1011000", "1001001"], ["130", "111"], ["58", "49"]]);
  });

  it("has activity ids unique within each course: local progress is keyed by activity id (#145)", () => {
    for (const c of courses) {
      const ids = c.modules.flatMap((m) => m.topics.flatMap((t) => t.activities.map((a) => a.id)));
      expect(ids.filter((x, i) => ids.indexOf(x) !== i), c.id).toEqual([]);
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
  it("#141: a variant id shared by questions of one activity sits at the same index in each", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities) {
            const at = new Map<string, number>();
            for (const q of a.questions)
              q.variants.forEach((v, i) => {
                if (!at.has(v.id)) at.set(v.id, i);
                expect(at.get(v.id), `${a.id}:${q.id}:${v.id}`).toBe(i);
              });
          }
  });

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

  it("column-addition answers, where authored, equal the computed sum", () => {
    for (const { path, variant } of [...allVariants(), { path: "fixture/v1101", variant: addition1101 }]) {
      const spec = variant.spec;
      if (spec.kind !== "column-addition" || !spec.answer) continue;
      expect(spec.answer, path).toBe(additionResult(spec.a, spec.b));
      expect(parseInt(spec.answer, 2), path).toBe(parseInt(spec.a, 2) + parseInt(spec.b, 2));
    }
  });

  it("circuit answers equal the evaluated circuit", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "circuit-predict") continue;
      expect(evaluateCircuit(variant.spec)[variant.spec.outputGateId], path).toBe(variant.spec.answer);
    }
  });

  it("circuit walks go gate by gate in signal-flow order with computed values", () => {
    const [v101, v000] = getActivity(COURSE, "logic-gates", "predict-gate-output")!.activity.questions[0].variants;
    for (const v of [v101, v000]) {
      if (v.spec.kind !== "circuit-predict") throw new Error("expected a circuit");
      expect(gateOrder(v.spec)).toEqual(["n1", "g1", "g2"]);
      expect(stepCount(v.spec)).toBe(3);
      expect([0, 1, 2].map((i) => [stepTag(v.spec, i), stepVars(v.spec, i).gateId])).toEqual([["gate", "n1"], ["gate", "g1"], ["gate", "g2"]]);
    }
    const outs = (v: Variant) => [0, 1, 2].map((i) => stepVars(v.spec, i).gateOut);
    expect(outs(v101)).toEqual([1, 1, 1]);
    expect(outs(v000)).toEqual([1, 0, 0]);
    // structural values only: wording is added by the tutor from its catalog
    expect(stepVars(v101.spec, 1)).toEqual({ stepNumber: 2, gateCount: 3, gateId: "g1", gateName: "AND", gateOut: 1, in1: 1, in1Label: "A", in2: 1, in2Gate: "NOT" });
    expect(contextFromVariant(v101, "en", stepVars(v101.spec, 1)).vars.gateInputs).toBe("A = 1 and the NOT output = 1");
    // A gate declared before its sources is still asked after them; the output gate is last.
    if (v101.spec.kind !== "circuit-predict") throw new Error("expected a circuit");
    const shuffled: CircuitSpec = { ...v101.spec, gates: [...v101.spec.gates].reverse() };
    expect(gateOrder(shuffled)).toEqual(["n1", "g1", "g2"]);
  });

  it("every multi-step kind follows the step contract: partial until the last step (ADR-0007)", () => {
    expect([...MULTI_STEP_KINDS].sort()).toEqual(["bit-grouping", "circuit-predict", "column-addition", "repeated-division"]);
    for (const { path, variant } of allVariants()) {
      const spec = variant.spec;
      const n = stepCount(spec);
      for (let i = 0; i < n; i++) {
        const v = stepVars(spec, i);
        const answer =
          spec.kind === "circuit-predict"
            ? ({ kind: spec.kind, step: i, output: v.gateOut as 0 | 1 } as const)
            : spec.kind === "repeated-division"
              ? ({ kind: spec.kind, step: i, quotient: v.quotient as number, remainder: v.remainder as number } as const)
              : undefined;
        if (!answer) continue;
        expect(grade(variant, answer), `${path} step ${i}`).toMatchObject({ correct: true, partial: i < n - 1 });
      }
    }
    const add = addition1101.spec;
    if (add.kind !== "column-addition") throw new Error("expected column addition");
    expect(stepCount(add)).toBe(additionSteps(add.a, add.b).length);
    expect(stepTag(add, 0)).toBe("column");
    expect(stepTag(add, stepCount(add) - 1)).toBe("carry");
    expect(stepVars(add, 2)).toEqual(additionStepVars(additionSteps(add.a, add.b)[2]));
  });

  it("circuit explanations ask for every gate's output before showing it", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "circuit-predict") continue;
      const asked = new Set<string>();
      for (const step of variant.explanation) {
        const stage = (step.stage ?? {}) as { lit?: string[]; active?: string };
        // a gate may only be lit (value shown) after a step that asked about it
        for (const id of stage.lit ?? []) expect(asked.has(id), `${path}/${step.id}: ${id} shown before it was asked`).toBe(true);
        if (stage.active) {
          expect(step.ask, `${path}/${step.id}: active gate without a prediction`).toBeDefined();
          const options = step.ask!.options;
          expect(options[step.ask!.correctIndex], `${path}/${step.id}`).toBe(String(evaluateCircuit(variant.spec)[stage.active]));
          asked.add(stage.active);
        }
      }
      expect([...asked].sort(), path).toEqual(variant.spec.gates.map((g) => g.id).sort());
    }
  });

  it("every circuit walk has a nudge for each gate type it contains", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind !== "circuit-predict") continue;
      for (const g of variant.spec.gates)
        expect(variant.misconceptions.some((m) => m.detect.type === "gate-output" && m.detect.gate === g.type), `${path}:${g.type}`).toBe(true);
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
    const fixtures = [hex26, octal88].map((variant) => ({ path: `fixture/${variant.id}`, variant }));
    for (const { path, variant } of [...allVariants(), ...fixtures]) {
      for (const ladder of [variant.hints, ...Object.values(variant.hintsByStep ?? {})]) {
        const rungs = ladder.map((h) => h.rung);
        expect([...rungs].sort((a, b) => a - b), path).toEqual(rungs);
      }
      const texts = [variant.prompt, variant.reactions?.stepNext ?? "", ...variant.explanation.flatMap((s) => [s.say, s.ask?.prompt ?? "", s.ask?.afterCorrect ?? "", s.ask?.afterWrong ?? ""])];
      varSets(variant).forEach((vars, i) => {
        // A step's own ladder (ADR-0007 §3) only has to resolve with that step's vars.
        for (const t of [...texts, ...hintsForStep(variant, i).map((h) => h.text)]) expect(fill(t, vars), `${path} step ${i}: ${t}`).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
      });
    }
  });

  it("every misconception nudge resolves all its slots in the variant it fires in", () => {
    // Pedagogy #45: a nudge must be right for its question (e.g. octal vs hex group size).
    for (const { path, variant } of allVariants())
      for (const m of variant.misconceptions)
        for (const vars of varSets(variant)) expect(resolveMessage(m.nudgeKey, vars), `${path}: ${m.id}`).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
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
  // Typed hex answer (numeric kind); course Q4 is now walked by grouping (#44), so this is a local fixture.
  const hex = VariantSchema.parse({
    id: "vhex",
    prompt: "26 in hex?",
    spec: { kind: "numeric", base: 16, answer: "1A" },
    hints: [{ rung: 2, text: "Group the bits in fours." }],
    explanation: [{ id: "s1", say: "Group in fours." }, { id: "s2", say: "1010 is A." }],
    misconceptions: [
      { id: "ns.hex-digit-decimal", title: "10 for A", nudgeKey: "ns.hex-letter", detect: { type: "equals", value: "110" } },
      { id: "ns.copied-decimal", title: "Copied decimal", nudgeKey: "ns.copied-decimal", detect: { type: "equals", value: "26" } },
      { id: "ns.group-from-left", title: "From the left", nudgeKey: "ns.group-from-left", detect: { type: "equals", value: "D0" } },
    ],
  });
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
    expect(grade(hex, { kind: "numeric", text: "0x1A" }).correct).toBe(true);
    expect(grade(hex, { kind: "numeric", text: "0X001a" }).correct).toBe(true);
    expect(grade(read, { kind: "numeric", text: "0b11010" }).correct).toBe(true);
    expect(grade(read, { kind: "numeric", text: "0B011010" }).correct).toBe(true);
    expect(grade(read, { kind: "numeric", text: "0x11010" }).correct).toBe(false); // wrong-base prefix is not stripped
    expect(grade(hex, { kind: "numeric", text: "110" })).toMatchObject({ correct: false, misconceptionId: "ns.hex-digit-decimal" });
    expect(grade(hex, { kind: "numeric", text: "26" })).toMatchObject({ correct: false, misconceptionId: "ns.copied-decimal" });
    expect(grade(hex, { kind: "numeric", text: "d0" })).toMatchObject({ correct: false, misconceptionId: "ns.group-from-left" });
  });

  it("grades place-value answers and detects misconceptions (fixture)", () => {
    expect(grade(placeValue45, { kind: "place-value", digits: [1, 0, 1, 1, 0, 1] }).correct).toBe(true);
    expect(grade(placeValue29, { kind: "place-value", digits: [1, 0, 1, 1, 1, 0] })).toMatchObject({ correct: false, misconceptionId: "ns.reversed" });
    expect(grade(placeValue45, { kind: "place-value", digits: [0, 0, 1, 1, 0, 1] })).toMatchObject({ correct: false, misconceptionId: "ns.skip-largest" });
    expect(grade(placeValue45, { kind: "place-value", digits: [1, 1, 1, 1, 0, 1] })).toMatchObject({ correct: false, misconceptionId: "ns.extra-16" });
    expect(bitsToValue(valueToBits(45, 6))).toBe(45);
  });

  it("grades circuit predictions and multiple choice", () => {
    expect(grade(circuit, { kind: "circuit-predict", output: 1 })).toMatchObject({ correct: true, partial: false });
    expect(grade(circuit, { kind: "circuit-predict", step: 0, output: 1 })).toMatchObject({ correct: true, partial: true, normalized: "n1=1" });
    expect(grade(circuit, { kind: "circuit-predict", step: 0, output: 0 })).toMatchObject({ correct: false, misconceptionId: "lg.rule-not" });
    expect(grade(circuit, { kind: "circuit-predict", step: 1, output: 0 })).toMatchObject({ correct: false, misconceptionId: "lg.rule-and" });
    expect(grade(circuit, { kind: "circuit-predict", step: 2, output: 0 })).toMatchObject({ correct: false, misconceptionId: "lg.rule-or" });
    expect(() => grade(circuit, { kind: "circuit-predict", step: 3, output: 0 })).toThrow();
    expect(grade(mc, { kind: "multiple-choice", optionId: "and" }).correct).toBe(true);
    expect(grade(mc, { kind: "multiple-choice", optionId: "or" })).toMatchObject({ correct: false, misconceptionId: "lg.or-vs-and" });
  });

  it("rejects mismatched answer kinds", () => {
    expect(() => grade(addition1101, { kind: "numeric", text: "10100" })).toThrow();
    expect(() => grade(mc, { kind: "numeric", text: "1" })).toThrow();
  });
});

describe("column addition (#33)", () => {
  const add = (step: number, sum: number, carry?: number) => grade(addition1101, { kind: "column-addition", step, sum, carry });

  it("computes the columns LSB first, with the end carry as a final step", () => {
    const steps = additionSteps("1101", "0111");
    expect(steps.map((s) => [s.sum, s.carryOut])).toEqual([[0, 1], [0, 1], [1, 1], [0, 1], [1, 0]]);
    expect(steps.at(-1)).toMatchObject({ final: true, carryIn: 1, sum: 1 });
    expect(additionResult("1101", "0111")).toBe("10100");
    expect(additionResult("0101", "0010")).toBe("00111"); // no end carry: still a final step, bit 0
    expect(additionStepVars(steps[2])).toMatchObject({ place: 4, aBit: 1, bBit: 1, carryIn: 1, stepNumber: 3 });
  });

  it("grades one column at a time: partial until the final carry step", () => {
    expect(add(0, 0, 1)).toMatchObject({ correct: true, partial: true, normalized: "1+1+0=0c1" });
    expect(add(3, 0, 1)).toMatchObject({ correct: true, partial: true });
    expect(add(4, 1)).toMatchObject({ correct: true, partial: false, normalized: "final=1" });
  });

  it("recognises addition misconceptions", () => {
    expect(add(0, 2, 0)).toMatchObject({ correct: false, misconceptionId: "add.wrote-two" });
    expect(add(2, 3, 0)).toMatchObject({ correct: false, misconceptionId: "add.wrote-two" });
    expect(add(0, 1, 0)).toMatchObject({ correct: false, misconceptionId: "add.swapped" });
    expect(add(1, 1, 0)).toMatchObject({ correct: false, misconceptionId: "add.carry-ignored" }); // 0+1 without the carry
    expect(add(2, 0, 1)).toMatchObject({ correct: false, misconceptionId: "add.carry-ignored" });
    expect(add(4, 0)).toMatchObject({ correct: false, misconceptionId: "add.carry-ignored" }); // end carry not brought down
    expect(add(0, 0, 0).misconceptionId).toBeUndefined();
  });

  it("rejects malformed answers and specs", () => {
    expect(() => add(5, 0, 0)).toThrow();
    expect(() => add(1, 0)).toThrow(); // a column needs a carry
    expect(InteractionSpec.safeParse({ kind: "column-addition", a: "101", b: "0111" }).success).toBe(false);
    expect(InteractionSpec.safeParse({ kind: "column-addition", a: "1", b: "1" }).success).toBe(false);
    expect(InteractionSpec.safeParse({ kind: "column-addition", a: "102", b: "011" }).success).toBe(false);
  });

  it("numeric and multiple-choice questions can show a completed addition as context", () => {
    const context = { type: "addition", operands: { a: "1101", b: "0111" } };
    expect(NumericSpec.safeParse({ kind: "numeric", base: 10, answer: "20", context }).success).toBe(true);
    expect(MultipleChoiceSpec.safeParse({ kind: "multiple-choice", options: [{ id: "a", text: "20" }, { id: "b", text: "13" }], correctOptionId: "a", context }).success).toBe(true);
    expect(NumericSpec.safeParse({ kind: "numeric", base: 10, answer: "20", context: { ...context, operands: { a: "1101", b: "111" } } }).success).toBe(false);
  });
});

describe("1's complement on numeric + bit-row (#35)", () => {
  const ans = (v: Variant, text: string) => grade(v, { kind: "numeric", text });

  it("fixtures match the slide examples and the computed complement", () => {
    for (const v of [complement100101, complement110010]) {
      if (v.spec.kind !== "numeric" || v.spec.context?.type !== "bit-row") throw new Error("fixture shape");
      expect(v.spec.answer).toBe(complementBits(v.spec.context.bits));
    }
    expect(complementBits("100101")).toBe("011010");
    expect(complementBits("110010")).toBe("001101");
  });

  it("accepts the complement, with or without its leading zero", () => {
    expect(ans(complement100101, "011010").correct).toBe(true);
    expect(ans(complement110010, " 001101 ").correct).toBe(true);
    expect(ans(complement110010, "1101").correct).toBe(true);
  });

  it("detects a copied source and the 2's complement before the first wrong bit", () => {
    expect(ans(complement100101, "100101")).toMatchObject({ correct: false, misconceptionId: "c1.copied" });
    expect(ans(complement100101, "011011")).toMatchObject({ correct: false, misconceptionId: "c1.gave-twos" });
    expect(ans(complement100101, "100101").wrongBit).toBeUndefined();
  });

  it("reports the leftmost wrong bit, counting a dropped leading zero as 0", () => {
    expect(ans(complement100101, "010010")).toMatchObject({ correct: false, misconceptionId: "c1.first-wrong-bit", wrongBit: 2 });
    expect(ans(complement110010, "000001")).toMatchObject({ misconceptionId: "c1.first-wrong-bit", wrongBit: 2 });
    expect(ans(complement110010, "1111")).toMatchObject({ misconceptionId: "c1.first-wrong-bit", wrongBit: 4 });
    expect(ans(complement100101, "0b010010")).toMatchObject({ misconceptionId: "c1.first-wrong-bit", wrongBit: 2 }); // #74: prefix stripped
  });

  it("does not guess a position for non-bit or over-long answers", () => {
    expect(ans(complement100101, "0110102")).toEqual({ correct: false, normalized: "110102" });
    expect(ans(complement100101, "1011010")).toEqual({ correct: false, normalized: "1011010" });
  });

  it("validates the bit-row context: 2–8 bits of 0/1", () => {
    const spec = (bits: string) => NumericSpec.safeParse({ kind: "numeric", base: 2, answer: "1", context: { type: "bit-row", bits } }).success;
    expect(spec("10")).toBe(true);
    expect(spec("10101010")).toBe(true);
    expect(spec("1")).toBe(false);
    expect(spec("101010101")).toBe(false);
    expect(spec("1021")).toBe(false);
  });
});

describe("octal/hex by grouping, one goal at a time (#44)", () => {
  const at = (v: Variant, step: number, input: { groups?: string[]; digit?: string }) => grade(v, { kind: "bit-grouping", step, ...input });

  it("has 1 + G steps: mark the groups, then one digit per group, left to right", () => {
    expect(stepCount(hex26.spec)).toBe(3);
    expect([0, 1, 2].map((i) => stepTag(hex26.spec, i))).toEqual(["group", "digit", "digit"]);
    expect(stepVars(hex26.spec, 0)).toMatchObject({ groupSize: 4, bits: "11010", padCount: 3, groupCount: 2, stepNumber: 1 });
    expect(stepVars(hex26.spec, 2)).toMatchObject({ groupIndex: 2, groupBits: "1010", groupValue: 10, digit: "A", stepNumber: 3 });
    expect(stepVars(octal88.spec, 0)).toMatchObject({ padCount: 2, groupCount: 3 });
  });

  it("authored answers equal the computed digits", () => {
    for (const v of [hex26, octal88]) {
      if (v.spec.kind !== "bit-grouping") throw new Error("fixture shape");
      const digits = groupBits(v.spec.bits, v.spec.groupSize).map((g) => parseInt(g, 2).toString(16).toUpperCase());
      expect(v.spec.answer).toBe(digits.join(""));
      expect(v.spec.answer).toBe(parseInt(v.spec.bits, 2).toString(v.spec.groupSize === 3 ? 8 : 16).toUpperCase());
    }
  });

  it("grades a full walk: partial until the last digit", () => {
    expect(at(hex26, 0, { groups: ["0001", "1010"] })).toMatchObject({ correct: true, partial: true, normalized: "0001|1010" });
    expect(at(hex26, 1, { digit: "1" })).toMatchObject({ correct: true, partial: true });
    expect(at(hex26, 2, { digit: " a " })).toMatchObject({ correct: true, partial: false, normalized: "1010=A" });
    expect(at(octal88, 3, { digit: "0" })).toMatchObject({ correct: true, partial: false });
  });

  it("names the grouping mistake from the marked group lengths", () => {
    expect(at(octal88, 0, { groups: ["101", "100", "0"] })).toMatchObject({ correct: false, misconceptionId: "ns.group-from-left" });
    expect(at(octal88, 0, { groups: ["1", "011", "000"] })).toMatchObject({ correct: false, misconceptionId: "ns.group-no-padding" });
    expect(at(hex26, 0, { groups: ["011", "010"] })).toMatchObject({ correct: false, misconceptionId: "ns.wrong-group-size" });
    expect(at(hex26, 0, { groups: ["11", "010"] })).toMatchObject({ correct: false, misconceptionId: "ns.wrong-group-size" });
    expect(at(hex26, 0, { groups: ["1101", "0"] })).toMatchObject({ correct: false, misconceptionId: "ns.group-from-left" });
    expect(at(hex26, 0, { groups: ["0000", "0001", "1010"] })).toEqual({ correct: false, normalized: "0000|0001|1010" });
  });

  it("detects a decimal value typed for a hex digit, only where the value is 10 or more", () => {
    expect(at(hex26, 2, { digit: "10" })).toMatchObject({ correct: false, misconceptionId: "ns.hex-digit-decimal" });
    expect(at(hex26, 1, { digit: "2" }).misconceptionId).toBeUndefined();
  });

  it("chooses the step's own hint ladder, falling back to hints", () => {
    expect(hintsForStep(hex26, 0)[0].text).toContain("{padCount}");
    expect(hintsForStep(hex26, 1)[0].text).toContain("{groupIndex}");
    expect(hintsForStep(addition1101, 0)).toBe(addition1101.hints);
  });

  it("rejects malformed answers and specs", () => {
    expect(() => at(hex26, 3, { digit: "1" })).toThrow();
    expect(() => at(hex26, 0, { digit: "1" })).toThrow();
    expect(() => at(hex26, 1, { groups: ["0001"] })).toThrow();
    expect(InteractionSpec.safeParse({ kind: "bit-grouping", bits: "1", groupSize: 3, answer: "1" }).success).toBe(false);
    expect(InteractionSpec.safeParse({ kind: "bit-grouping", bits: "1010", groupSize: 2, answer: "22" }).success).toBe(false);
    expect(InteractionSpec.safeParse({ kind: "bit-grouping", bits: "11010", groupSize: 4, answer: "1a" }).success).toBe(false);
  });
});
