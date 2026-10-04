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
import { equivalent, isPOS, isSOP, parseBool } from "./boolean";
import { gateCount } from "./ecet111/chapter2/simplification";
import { isCanonical } from "./ecet111/chapter2/minterms";
import { columnTruth } from "@/kinds/truth-table/logic";
import { gatedLatch, nandLatch } from "./ecet111/chapter5/latches";
import { computedAnswer } from "@/kinds/bit-grouping/logic";
import { lawChips, lineOptions } from "@/kinds/derivation/logic";
import type { DerivationSpec } from "@/kinds/derivation/spec";
import { exactValue } from "@/kinds/base-to-decimal/logic";

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

  it("keeps demo notices out of student-facing summaries; the authority field carries DEMO (#175, owner item 11)", () => {
    for (const c of courses) {
      expect(c.summary, c.id).not.toMatch(/demo/i);
      for (const m of c.modules)
        for (const t of m.topics) {
          expect(t.summary, t.id).not.toMatch(/demo/i);
          for (const a of t.activities) expect(a.summary, a.id).not.toMatch(/demo/i);
        }
    }
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

  it("moves derivation choices from set to set: the right line and law are not in one place every time (QA on #344)", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions) {
              const specs = q.variants.map((v) => v.spec).filter((s): s is DerivationSpec => s.kind === "derivation");
              if (specs.length < 2) continue;
              const pattern = (s: DerivationSpec) =>
                s.lines.map((l, i) => `${lawChips(s, i).indexOf(l.law)}/${lineOptions(s, i).findIndex((o) => o.id === "right")}`).join(" ");
              expect(new Set(specs.map(pattern)).size, `${q.id} positions repeat in every set`).toBeGreaterThan(1);
              expect(specs.every((s) => lineOptions(s, 0).findIndex((o) => o.id === "right") === 0), `${q.id} right line first in every set`).toBe(false);
            }
  });

  it("never shows the same option twice, in a multiple-choice question or an Explain Slowly prediction (Reviewer on #338)", () => {
    for (const { path, variant } of allVariants()) {
      if (variant.spec.kind === "multiple-choice") {
        const texts = variant.spec.options.map((o) => o.text);
        expect(new Set(texts).size, `${path} options`).toBe(texts.length);
      }
      for (const step of variant.explanation)
        if (step.ask) expect(new Set(step.ask.options).size, `${path} ${step.id} prediction`).toBe(step.ask.options.length);
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
          // The page renders a preview as tiles split on "→" (PreviewBoard): it must be a chain.
          if (t.preview) expect(t.preview.split("→").length, `${t.id} preview is a chain`).toBeGreaterThanOrEqual(2);
          // Base markers (53_10) are notation, not numbers the practice uses (#55).
          const numbers = t.preview?.replace(/_\d+/g, "").toUpperCase().match(/[0-9A-F]+/g) ?? [];
          for (const n of numbers) expect(values.has(n), `${t.id} preview uses ${n}`).toBe(false);
        }
    const ns = courses[0].modules.flatMap((m) => m.topics).find((t) => t.id === "number-systems")!;
    expect(ns.preview).toBe("53_10 → 110101_2 → 65_8 → 35_16");
    expect([(53).toString(2), (53).toString(8), (53).toString(16)]).toEqual(["110101", "65", "35"]);
  });

  it("walks the 88 and 73 exercise (#43) with the slide answers, plus a third set (108, #247)", () => {
    const x = getActivity(COURSE, "number-systems", "conversion-exercise")!.activity;
    expect(x.questions.map((q) => q.label)).toEqual(["Divide by 2", "Read off", "Octal", "Hex"]);
    for (const q of x.questions) expect(q.variants.map((v) => v.id), q.id).toEqual(["v88", "v73", "v108"]);
    const answers = x.questions.map((q) => q.variants.map((v) => ("answer" in v.spec ? v.spec.answer : v.spec.kind === "repeated-division" ? v.spec.steps.length : "")));
    expect(answers).toEqual([[7, 7, 7], ["1011000", "1001001", "1101100"], ["130", "111", "154"], ["58", "49", "6C"]]);
  });

  it("has activity ids unique within each course: local progress is keyed by activity id (#145)", () => {
    for (const c of courses) {
      const ids = c.modules.flatMap((m) => m.topics.flatMap((t) => t.activities.map((a) => a.id)));
      expect(ids.filter((x, i) => ids.indexOf(x) !== i), c.id).toEqual([]);
    }
  });

  it("a variant id shared by questions of one practice means the same numbers (#141)", () => {
    // The numbers a variant works on: its decimal value, or the two operands of an addition.
    const numbersOf = (v: Variant): string | undefined => {
      if (v.vars.value !== undefined) return `value:${v.vars.value}`;
      if (v.spec.kind === "column-addition") return `add:${v.spec.a}+${v.spec.b}`;
      if (v.spec.kind === "numeric" && v.spec.context?.type === "addition") return `add:${v.spec.context.operands.a}+${v.spec.context.operands.b}`;
      return undefined;
    };
    let shared = 0;
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities) {
            const seen = new Map<string, string | undefined>();
            for (const q of a.questions)
              for (const v of q.variants) {
                const n = numbersOf(v);
                if (seen.has(v.id)) {
                  expect(n, `${a.id}/${q.id}/${v.id}`).toBe(seen.get(v.id));
                  shared++;
                } else seen.set(v.id, n);
              }
          }
    expect(shared).toBeGreaterThan(0);
  });

  it("walks 1's and 2's complement on the slide examples (#39): flip, rule, then + 1", () => {
    const x = getActivity(COURSE, "binary-arithmetic", "complements")!.activity;
    expect(x.questions.map((q) => q.variants.map((v) => v.id))).toEqual([["v100101", "v110010", "v101100"], ["v100101", "v110010", "v101100"], ["v100101", "v110010", "v101100"]]);
    const [ones, , plus] = x.questions;
    expect(ones.variants.map((v) => (v.spec.kind === "numeric" ? v.spec.answer : ""))).toEqual(["011010", "001101", "010011"]);
    expect(plus.variants.map((v) => (v.spec.kind === "column-addition" ? `${v.spec.a}+${v.spec.b}=${v.spec.answer}` : ""))).toEqual(["011010+000001=011011", "001101+000001=001110", "010011+000001=010100"]);
    // Fixed width: no end-carry step, and the last column completes the question (Pedagogy on #150).
    const v = plus.variants[0];
    expect(stepCount(v.spec)).toBe(6);
    expect(stepTag(v.spec, 5)).toBe("column");
    expect(grade(v, { kind: "column-addition", step: 4, sum: 1, carry: 0 })).toMatchObject({ correct: true, partial: true });
    expect(grade(v, { kind: "column-addition", step: 5, sum: 0, carry: 0 })).toMatchObject({ correct: true, partial: false });
  });

  it("walks subtraction by 2's complement on 13 − 9 and 12 − 6 (#40), one checked step each", () => {
    const x = getActivity(COURSE, "binary-arithmetic", "subtraction-positive")!.activity;
    for (const q of x.questions) expect(q.variants.map((v) => v.id), q.id).toEqual(["v13-9", "v12-6", "v11-3"]);
    const answer = (qi: number, vi: number) => {
      const spec = x.questions[qi].variants[vi].spec;
      return "answer" in spec ? spec.answer : spec.kind === "repeated-division" ? spec.value : spec.kind === "multiple-choice" ? spec.correctOptionId : "";
    };
    // B in binary → 1's → 2's → A + 2's (end carry 1) → positive, discard → result
    expect(x.questions.map((_, i) => answer(i, 0))).toEqual([9, "1001", "0110", "0111", "10100", "positive", "4"]);
    expect(x.questions.map((_, i) => answer(i, 1))).toEqual([6, "110", "1001", "1010", "10110", "positive", "6"]);
    expect(x.questions.map((_, i) => answer(i, 2))).toEqual([3, "11", "1100", "1101", "11000", "positive", "8"]); // 11 − 3 (#247)
  });

  it("pins the subtraction exercises (#41): 15 − 4 positive, 10 − 14 negative with a re-complement", () => {
    const chain = (activity: string, vi: number) =>
      getActivity(COURSE, "binary-arithmetic", activity)!.activity.questions.map((q) => {
        const spec = q.variants[vi].spec;
        return "answer" in spec ? spec.answer : spec.kind === "multiple-choice" ? spec.correctOptionId : "";
      });
    // B = 0100 → 1011 → 1100; 1111 + 1100 = 1 1011 → positive → 11
    expect(chain("subtraction-exercise-positive", 0)).toEqual(["1011", "1100", "11011", "positive", "11"]);
    // B = 1110 → 0001 → 0010; 1010 + 0010 = 0 1100 → negative → 0011 → 0100 → 4 (so −4)
    expect(chain("subtraction-exercise-negative", 0)).toEqual(["0001", "0010", "01100", "negative", "0011", "0100", "4"]);
    expect(chain("subtraction-exercise-negative", 1)).toEqual(["0011", "0100", "01011", "negative", "0100", "0101", "5"]);
    // third sets (#247): 13 − 6 = 7 and 5 − 11 = −6
    expect(chain("subtraction-exercise-positive", 2)).toEqual(["1001", "1010", "10111", "positive", "7"]);
    expect(chain("subtraction-exercise-negative", 2)).toEqual(["0100", "0101", "01010", "negative", "0101", "0110", "6"]);
    // The size step shows the finished re-complement at four bits, with no end-carry column (QA on #161).
    const size = getActivity(COURSE, "binary-arithmetic", "subtraction-exercise-negative")!.activity.questions.at(-1)!.variants[0].spec;
    if (size.kind !== "numeric" || size.context?.type !== "addition") throw new Error("expected an addition context");
    const shown = { kind: "column-addition" as const, ...size.context.operands };
    expect(stepCount(shown)).toBe(4);
    expect(additionResult(shown.a, shown.b, shown.endCarry !== "drop")).toBe("0100");
  });

  it("checks octal and hex back in decimal, and drills the 0–15 table (#215)", () => {
    const main = getActivity(COURSE, "number-systems", "decimal-to-binary")!.activity;
    expect(main.questions.map((q) => q.label)).toEqual(["Divide by 2", "Read off", "Octal", "Octal check", "Hex", "Hex check"]);
    for (const id of ["ns.q.octal-check", "ns.q.hex-check"]) {
      const q = main.questions.find((x) => x.id === id)!;
      // the check-back answer is always the starting number, on the same number set (#141)
      expect(q.variants.map((v) => [v.id, v.spec.kind === "numeric" ? v.spec.answer : ""])).toEqual([["v26", "26"], ["v37", "37"], ["v75", "75"]]);
    }
    const table = getActivity(COURSE, "number-systems", "hex-digits")!.activity;
    const correct = table.questions.map((q) =>
      q.variants.map((v) => {
        const spec = v.spec;
        return spec.kind === "multiple-choice" ? spec.options.find((o) => o.id === spec.correctOptionId)!.text : "";
      }),
    );
    expect(correct).toEqual([["B", "E", "A"], ["1101", "0011", "1011"], ["C", "7", "A"]]);
    // Pedagogy on #271: no palindromic patterns, so the reversed-bits distractor always exists
    for (const q of table.questions.slice(1)) for (const v of q.variants) if (v.spec.kind === "multiple-choice") expect(v.spec.options.length, `${q.id}/${v.id}`).toBeGreaterThanOrEqual(3);
    for (const q of table.questions) for (const v of q.variants) if (v.spec.kind === "multiple-choice") expect(v.spec.options.length, `${q.id}/${v.id}`).toBeGreaterThanOrEqual(2);
  });

  it("laws and rules (#228): every example is a true identity, every simplification checks, every wrong option is wrong", () => {
    const x = getActivity(COURSE, "laws-and-rules", "laws-and-rules")!.activity;
    const law = x.questions[0];
    const ruleQs = x.questions.filter((q) => q.id.startsWith("br.q.rule-"));
    const simplify = x.questions.find((q) => q.id === "br.q.simplify")!;
    // Pedagogy on #273: every one of the 11 rules is the answer somewhere, by slide column
    const answered = ruleQs.flatMap((q) => q.variants.map((v) => (v.spec.kind === "multiple-choice" ? v.spec.correctOptionId : "")));
    expect(new Set(answered).size).toBe(11);
    const sides = (text: string) => text.split(" = ").map((t) => parseBool(t));
    for (const v of law.variants) {
      const [l, r] = [String(v.vars.left), String(v.vars.right)].map((t) => parseBool(t));
      expect(equivalent(l, r), v.id).toBe(true);
    }
    for (const v of ruleQs.flatMap((q) => q.variants)) {
      const [l, r] = sides(String(v.vars.example));
      expect(equivalent(l, r), v.id).toBe(true);
      if (v.spec.kind !== "multiple-choice") throw new Error("expected multiple choice");
      // every option is a true rule, so only the pattern decides; the right one must match the example's shape
      for (const o of v.spec.options) {
        const [ol, or] = sides(o.text);
        expect(equivalent(ol, or), o.text).toBe(true);
      }
    }
    for (const v of simplify.variants) {
      const spec = v.spec;
      if (spec.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const expr = parseBool(String(v.vars.expr));
      for (const o of spec.options) expect(equivalent(expr, parseBool(o.text)), `${v.id}: ${o.text}`).toBe(o.id === spec.correctOptionId);
    }
  });

  it("no multiple-choice question has its right answer first in every set (QA on #273)", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions) {
              const firsts = q.variants.map((v) => (v.spec.kind === "multiple-choice" ? v.spec.options[0].id === v.spec.correctOptionId : null));
              if (firsts.includes(null) || firsts.length < 2) continue;
              expect(firsts.every(Boolean), `${a.id}/${q.id}: right answer is always first`).toBe(false);
            }
  });

  it("every bit-grouping answer equals the digits computed from its bits, point included (#210)", () => {
    let n = 0;
    for (const { path, variant } of allVariants())
      if (variant.spec.kind === "bit-grouping") {
        expect(variant.spec.answer, path).toBe(computedAnswer(variant.spec));
        n++;
      }
    expect(n).toBeGreaterThan(0);
  });

  it("derived gates (#225): outputs match the pack (NAND 1110, NOR 1000, XOR 0110, XNOR 1001)", () => {
    const x = getActivity(COURSE, "derived-gates", "derived-gates")!.activity;
    const last = (qi: number) =>
      x.questions[qi].variants.map((v) => {
        if (v.spec.kind !== "truth-table") throw new Error("expected a truth table");
        return columnTruth(v.spec, v.spec.columns.at(-1)!).join("");
      });
    expect([0, 1, 2, 3].map(last)).toEqual([["1110", "1110", "1110"], ["1000", "1000", "1000"], ["0110", "0110", "0110"], ["1001", "1001", "1001"]]);
  });

  it("gate tables (#224): each table's stated answer is the column computed from its gate", () => {
    const tables = getActivity(COURSE, "logic-gates", "gate-tables")!.activity;
    const columns = tables.questions.map((q) =>
      q.variants.map((v) => {
        if (v.spec.kind !== "truth-table") throw new Error("expected a truth table");
        const col = columnTruth(v.spec, v.spec.columns[0]).join(" ");
        expect(col, v.id).toBe(v.vars.answerColumn);
        return col;
      }),
    );
    expect(columns).toEqual([
      ["0 0 0 1", "0 0 0 0 0 0 0 1", "0 0 0 1"],
      ["0 1 1 1", "0 1 1 1 1 1 1 1", "0 1 1 1"],
      ["1 0"],
    ]);
  });

  it("place value (#213): every sum matches the content pack (ch1 §1–3, §7), and only fitting nudges are offered", () => {
    const x = getActivity(COURSE, "place-value", "place-value")!.activity;
    const [weight, place, ...walks] = x.questions;
    // decimal is a concept check (Pedagogy on #353): the weight of a digit, the digit in a place
    const picked = (q: typeof weight) => q.variants.map(({ spec }) => (spec.kind === "multiple-choice" ? spec.options.find((o) => o.id === spec.correctOptionId)?.text : ""));
    expect(picked(weight)).toEqual(["10^1", "10^−2", "10^2"]);
    expect(picked(place)).toEqual(["3", "2", "3"]);
    const sums = walks.map((q) => q.variants.map((v) => (v.spec.kind === "base-to-decimal" ? exactValue(v.spec) : "")));
    expect(sums).toEqual([
      ["6.375", "7.125", "4.75", "6.625"],
      ["179.6875", "207.53125", "70.40625"],
      ["709", "993", "439"],
    ]);
    for (const q of walks)
      for (const v of q.variants) {
        if (v.spec.kind !== "base-to-decimal") throw new Error("expected base-to-decimal");
        const types = v.misconceptions.map((m) => m.detect.type);
        expect(types.includes("negative-powers-wrong"), v.id).toBe(v.spec.number.includes("."));
        expect(types.includes("hex-letter-as-digit"), v.id).toBe(v.spec.base === 16);
      }
  });

  it("SOP and POS (#227): forms, tables and SOPs are computed and consistent", () => {
    const x = getActivity(COURSE, "sop-and-pos", "sop-and-pos")!.activity;
    const [form, toTable, pick, toSop] = x.questions;
    // every set shows one SOP and one POS (neither expression is both), the asked form varies (Pedagogy on #342)
    for (const v of form.variants) {
      if (v.spec.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const kinds = v.spec.options.map((o) => {
        const e = parseBool(o.text.replace(/′/g, "'"));
        expect(isSOP(e) && isPOS(e), `${v.id}: ${o.text} is both forms`).toBe(false);
        return isSOP(e) ? "sop" : isPOS(e) ? "pos" : "none";
      });
      expect(kinds.sort(), v.id).toEqual(["pos", "sop"]);
    }
    expect(new Set(form.variants.map((v) => (v.spec.kind === "multiple-choice" ? v.spec.correctOptionId : ""))).size).toBe(2);
    // F's column has its 1s exactly on the product rows
    for (const v of toTable.variants) {
      if (v.spec.kind !== "truth-table") throw new Error("expected a truth table");
      const f = columnTruth(v.spec, v.spec.columns.at(-1)!);
      expect(f.filter((c) => c === 1).length, v.id).toBe(v.spec.columns.length - 1);
    }
    // the SOP question asks for the same rows the pick question showed (same id = same function, #141)
    pick.variants.forEach((v, i) => {
      const w = toSop.variants[i];
      if (v.spec.kind !== "truth-table" || w.spec.kind !== "expression") throw new Error("shape");
      const ones = columnTruth(v.spec, v.spec.columns[0]).flatMap((c, r) => (c === 1 ? [r] : []));
      expect(w.id).toBe(v.id);
      expect(w.spec.minterms).toEqual(ones);
    });
  });

  it("simplification (#229): wrong lines are not equivalent; gate counts match the pack (F2: 6 → 5)", () => {
    const x = getActivity(COURSE, "simplification", "simplification")!.activity;
    const [derive, gates] = x.questions;
    for (const v of derive.variants) {
      if (v.spec.kind !== "derivation") throw new Error("expected a derivation");
      const spec = v.spec;
      spec.lines.forEach((l, i) => {
        const prev = parseBool(i === 0 ? spec.start : spec.lines[i - 1].expr, { vars: spec.vars });
        for (const w of l.wrongLines) expect(equivalent(prev, parseBool(w.expr, { vars: spec.vars }), spec.vars), `${v.id} line ${i + 1} ${w.expr}`).toBe(false);
      });
    }
    expect(gateCount(parseBool("x'y'z + x'yz + xy'")).total).toBe(6);
    expect(gateCount(parseBool("x'z + xy'")).total).toBe(5);
    expect(gates.variants.map((v) => (v.spec.kind === "multiple-choice" ? v.spec.correctOptionId : ""))).toEqual(["g5", "g1", "g1"]);
  });

  it("De Morgan (#230): identities and every complement step check; wrong lines are not equivalent", () => {
    const x = getActivity(COURSE, "de-morgan", "de-morgan")!.activity;
    const [rule, steps] = x.questions;
    const p = (t: string, vars?: string[]) => parseBool(t.replace(/″/g, "''").replace(/′/g, "'"), vars ? { vars } : undefined);
    for (const v of rule.variants) {
      if (v.spec.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const expr = p(v.prompt.replace(/^By De Morgan, /, "").replace(/ = \?$/, ""));
      for (const o of v.spec.options) expect(equivalent(expr, p(o.text)), `${v.id}: ${o.text}`).toBe(o.id === v.spec.correctOptionId);
    }
    for (const v of steps.variants) {
      if (v.spec.kind !== "derivation") throw new Error("expected a derivation");
      const spec = v.spec;
      spec.lines.forEach((l, i) => {
        const prev = p(i === 0 ? spec.start : spec.lines[i - 1].expr, spec.vars);
        for (const w of l.wrongLines) expect(equivalent(prev, p(w.expr, spec.vars), spec.vars), `${v.id} line ${i + 1}: ${w.expr}`).toBe(false);
      });
    }
    // the slide's answer (Example 2.2): (x′yz′ + x′y′z)′ = (x + y′ + z)(x + y + z′)
    const f1 = steps.variants[0].spec;
    if (f1.kind !== "derivation") throw new Error("shape");
    expect(f1.lines.at(-1)!.expr).toBe("(x + y' + z)(x + y + z')");
  });

  it("minterms (#231): the slide's Σ lists, wrong expansion lines are not equivalent", () => {
    const x = getActivity(COURSE, "minterms", "minterms")!.activity;
    const [, canonical, expand, sig, table] = x.questions;
    // "which one is canonical?": exactly the right option is canonical (Pedagogy on #346)
    for (const v of canonical.variants) {
      if (v.spec.kind !== "multiple-choice") throw new Error("expected multiple choice");
      for (const o of v.spec.options) expect(isCanonical(o.text.replace(/′/g, "'"), ["A", "B", "C", "x", "y", "z"].filter((c) => o.text.includes(c))), `${v.id}: ${o.text}`).toBe(o.id === "yes");
    }
    // a table set must not repeat a Σ list already given in the expansion sets
    const given = new Set(sig.variants.map((v) => (v.spec.kind === "multiple-choice" ? v.spec.options.find((o) => o.id === "right")!.text : "")));
    for (const v of table.variants) {
      if (v.spec.kind !== "truth-table") throw new Error("expected a truth table");
      const ones = columnTruth(v.spec, v.spec.columns[0]).flatMap((c, r) => (c === 1 ? [r] : []));
      expect(given.has(`Σ(${ones.join(", ")})`), v.id).toBe(false);
    }
    for (const v of expand.variants) {
      if (v.spec.kind !== "derivation") throw new Error("expected a derivation");
      const spec = v.spec;
      spec.lines.forEach((l, i) => {
        const prev = parseBool(i === 0 ? spec.start : spec.lines[i - 1].expr, { vars: spec.vars });
        for (const w of l.wrongLines) expect(equivalent(prev, parseBool(w.expr, { vars: spec.vars }), spec.vars), `${v.id} line ${i + 1}: ${w.expr}`).toBe(false);
      });
    }
    // A′ + AB′ = Σ(0, 1, 2) and xy + x′yz = Σ(3, 6, 7), as on p.71–74
    const right = sig.variants.map((v) => (v.spec.kind === "multiple-choice" ? v.spec.options.find((o) => o.id === "right")!.text : ""));
    expect(right).toEqual(["Σ(0, 1, 2)", "Σ(3, 6, 7)", "Σ(0, 2, 3)"]);
  });

  it("latches (#295): outputs from the latch equations match the pack's tables (ch5-parti §2)", () => {
    const x = getActivity(COURSE, "latches", "latches")!.activity;
    const pick = (q: (typeof x.questions)[number]) => q.variants.map(({ spec }) => (spec.kind === "multiple-choice" ? spec.options.find((o) => o.id === spec.correctOptionId)!.text : ""));
    // NAND: 0 1 sets, 1 0 resets, 1 1 holds, 0 0 invalid; gated: En = 0 holds, then set and reset
    expect(pick(x.questions[0])).toEqual(["Q = 1", "Q = 0", "Q = 0", "Invalid"]);
    expect(pick(x.questions[1])).toEqual(["Q = 0", "Q = 1", "Q = 0"]);
    expect([nandLatch(1, 1, 1), gatedLatch(1, 0, 0, 1), gatedLatch(1, 1, 1, 0)]).toEqual(["q1", "q1", "invalid"]);
  });

  it("flip-flop tables (#296): each table is its equation, as verified in the pack (JK = Σ(1,4,5,6), T = Σ(1,2))", () => {
    const x = getActivity(COURSE, "flip-flops", "flip-flop-tables")!.activity;
    const [row, ...tables] = x.questions;
    const column = (q: (typeof tables)[number]) => {
      const spec = q.variants[0].spec;
      if (spec.kind !== "truth-table") throw new Error("expected a truth table");
      return columnTruth(spec, spec.columns[0]).join("");
    };
    expect(tables.map(column)).toEqual(["010011XX", "01001110", "0011", "0110"]); // SR, JK, D, T
    const picked = row.variants.map(({ spec }) => (spec.kind === "multiple-choice" ? spec.options.find((o) => o.id === spec.correctOptionId)!.text : ""));
    expect(picked).toEqual(["Q(t+1) = 1", "Q(t+1) = 0", "Q(t+1) = 1", "Q(t+1) = 0"]);
  });

  it("flip-flop equations (#297): each question's minterms are its table's 1-rows; next states by the equation", () => {
    const x = getActivity(COURSE, "flip-flops", "flip-flop-equations")!.activity;
    const mts = x.questions.slice(0, 3).map((q) => (q.variants[0].spec.kind === "expression" ? q.variants[0].spec.minterms : []));
    expect(mts).toEqual([[1, 4, 5, 6], [1, 2], [2, 3]]); // JK, T, D (pack ch5-parti §3)
    const picked = x.questions[3].variants.map(({ spec }) => (spec.kind === "multiple-choice" ? spec.options.find((o) => o.id === spec.correctOptionId)!.text : ""));
    expect(picked).toEqual(["1", "1", "0"]);
  });

  it("resolves an activity by path", () => {
    expect(getActivity(COURSE, "number-systems", "decimal-to-binary")?.activity.questions.length).toBe(6);
    expect(getActivity("nope", "x", "y")).toBeUndefined();
  });
});

describe("pedagogy guard", () => {
  it("never asks for a decimal-to-binary conversion in a single step", () => {
    // Owner feedback (issue #20): the conversion must be walked through the divide-by-2 rule.
    for (const { path, variant } of allVariants()) {
      expect(variant.spec.kind, path).not.toBe("place-value");
      // A binary answer is read off a finished chain, or written bit by bit under a source row (1's complement).
      if (variant.spec.kind === "numeric" && variant.spec.base === 2) expect(["division-chain", "bit-row"], path).toContain(variant.spec.context?.type);
      if (variant.spec.kind === "numeric" && (variant.spec.base === 8 || variant.spec.base === 16)) expect(variant.spec.context?.type, path).toBe("bits");
    }
  });

  it("gives every question at least three number sets (owner, #192), apart from fixed-fact checks", () => {
    // Fixed facts (a single addition rule, the 2's-complement rule) have no third set of numbers.
    // bg.q.not: NOT is the fixed fact 1 0; relabelled copies would add nothing (Pedagogy on #337).
    const EXEMPT = new Set(["ba.q.zero", "ba.q.one", "ba.q.two", "ba.q.twos-rule", "bg.q.not", "ff.q.sr", "ff.q.jk", "ff.q.d", "ff.q.t", "ff.q.eq-jk", "ff.q.eq-t", "ff.q.eq-d"]);
    // Written before the rule; each entry leaves this list when its third set lands. Do not add to it.
    const PENDING = new Set<string>(); // empty since #224: keep it so a future backfill can use it
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions) {
              const path = `${c.id}/${t.id}/${a.id}/${q.id}`;
              if (EXEMPT.has(q.id)) continue;
              if (PENDING.has(q.id)) expect(q.variants.length, `${path} has three sets now: remove it from PENDING`).toBeLessThan(3);
              else expect(q.variants.length, `${path} needs at least three number sets`).toBeGreaterThanOrEqual(3);
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
      const keep = spec.endCarry !== "drop";
      expect(spec.answer, path).toBe(additionResult(spec.a, spec.b, keep));
      // A dropped end carry keeps the operand width: the sum modulo 2^width.
      expect(parseInt(spec.answer, 2), path).toBe((parseInt(spec.a, 2) + parseInt(spec.b, 2)) % (keep ? Infinity : 2 ** spec.a.length));
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
    expect([...MULTI_STEP_KINDS].sort()).toEqual(["base-to-decimal", "bit-grouping", "circuit-predict", "column-addition", "derivation", "repeated-division", "truth-table"]);
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
        // `wrongBitNumber` comes with the wrong answer itself (first-wrong-bit), not from the variant.
        for (const vars of varSets(variant)) expect(resolveMessage(m.nudgeKey, { ...vars, wrongBitNumber: 1 }), `${path}: ${m.id}`).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
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
