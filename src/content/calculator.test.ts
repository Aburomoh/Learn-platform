import { describe, expect, it } from "vitest";
import { courses, getActivity } from "./index";
import { stepCount, stepTag, stepVars } from "./steps";
import { fill } from "./template";
import { evaluateExpression } from "@/kinds/shared/calc";
import { exactValue } from "@/kinds/base-to-decimal/logic";
import { goals as scheduleGoals } from "@/kinds/cpu-schedule/logic";

/**
 * Calculator call sites (#578): each pre-loaded expression must evaluate to the step's answer, so the
 * student only presses = and then types the result.
 */
describe("calculator expressions", () => {
  it("every expression is arithmetic and equals the answer of the step it is attached to", () => {
    let checked = 0;
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions)
              for (const v of q.variants) {
                if (!v.calculator) continue;
                const where = `${c.id}/${t.id}/${a.id}/${q.id}/${v.id}`;
                for (const [tag, template] of Object.entries(v.calculator)) {
                  let vars: Record<string, string | number> = v.vars;
                  let answer: string | undefined;
                  if (tag === "*") {
                    answer = v.spec.kind === "numeric" ? String(v.spec.answer) : undefined;
                  } else {
                    const i = Array.from({ length: stepCount(v.spec) }, (_, k) => k).find((k) => stepTag(v.spec, k) === tag);
                    expect(i, `${where}: no step tagged ${tag}`).toBeDefined();
                    vars = { ...v.vars, ...stepVars(v.spec, i!) };
                    if (v.spec.kind === "base-to-decimal" && tag === "sum") answer = exactValue(v.spec);
                    if (v.spec.kind === "cpu-schedule" && tag === "average") {
                      const g = scheduleGoals(v.spec).find((x) => x.tag === "average");
                      answer = g && g.tag === "average" ? String(g.value) : undefined;
                    }
                  }
                  const got = evaluateExpression(fill(template, vars));
                  expect(answer, `${where}: ${tag} has no single numeric answer to compare`).toBeDefined();
                  // the average is asked to two decimals; the expression gives the unrounded value
                  expect(got, `${where}: ${tag}`).toBeCloseTo(Number(answer), v.spec.kind === "cpu-schedule" ? 2 : 9);
                  checked++;
                }
              }
    expect(checked).toBeGreaterThan(20);
  });

  it("8-bit subtraction results and sizes have the calculator; the 4-bit ones do not (#578 skill line)", () => {
    const has = (activity: string, question: string) =>
      getActivity("ecet111", "binary-arithmetic", activity)!.activity.questions.find((q) => q.id === question)!.variants.map((v) => v.calculator !== undefined);
    expect(has("subtraction-8bit-positive", "sb8p.q.result")).toEqual([true, true, true]);
    expect(has("subtraction-8bit-negative", "sb8n.q.size")).toEqual([true, true, true]);
    expect(has("subtraction-positive", "sub.q.result").every((x) => !x)).toBe(true);
    expect(has("subtraction-exercise-negative", "subn.q.size").every((x) => !x)).toBe(true);
  });
});
