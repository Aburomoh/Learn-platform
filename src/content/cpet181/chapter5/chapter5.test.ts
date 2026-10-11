import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const COURSE = "cpet181";
const ACTIVITIES: [string, string][] = [
  ["deadlock-basics", "deadlock-or-starvation"],
  ["deadlock-basics", "cases"],
  ["deadlock-basics", "races"],
  ["deadlock-sketches", "arrows"],
  ["deadlock-sketches", "circle"],
  ["four-conditions", "name-the-condition"],
  ["four-conditions", "all-four"],
  ["recovery-starvation", "recovery"],
  ["recovery-starvation", "starvation"],
];
const questions = (topic: string, activity: string) => getActivity(COURSE, topic, activity)!.activity.questions;
const choice = (v: ReturnType<typeof questions>[number]["variants"][number]) => {
  if (v.spec.kind !== "multiple-choice") throw new Error(`${v.id}: multiple-choice expected`);
  const { options, correctOptionId } = v.spec;
  return { correct: options.find((o) => o.id === correctOptionId)!.text, texts: options.map((o) => o.text) };
};

describe("CPET 181 Chapter 5 deadlock content (#614)", () => {
  it("every question has three or four variants, one correct and distinct options, and the answer only at the last rung", () => {
    for (const [topic, activity] of ACTIVITIES) {
      for (const q of questions(topic, activity)) {
        expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
        for (const v of q.variants) {
          const { correct, texts } = choice(v);
          expect(new Set(texts).size, `${q.id}/${v.id}`).toBe(texts.length);
          expect(texts.filter((t) => t === correct)).toHaveLength(1);
          const early = v.hints.slice(0, -1).map((h) => h.text).join(" ");
          expect(early, `${q.id}/${v.id} hint gives the answer away`).not.toContain(correct);
        }
      }
    }
  });

  it("the circle sketches: the answer is the graph's own, found by following the waiting", () => {
    // wait-for: process → process that holds the resource it requests; a cycle means deadlock
    const q = questions("deadlock-sketches", "circle").find((x) => x.id === "dl.q.circular")!;
    const answers = q.variants.map((v) => {
      if (v.figure?.type !== "resource-graph") throw new Error(`${v.id}: resource-graph figure expected`);
      const holder = new Map(v.figure.edges.filter((e) => e.kind === "holds").map((e) => [e.resource, e.process]));
      const waits = new Map<string, string>();
      for (const e of v.figure.edges) if (e.kind === "requests" && holder.has(e.resource)) waits.set(e.process, holder.get(e.resource)!);
      const inCycle = v.figure.processes.some((start) => {
        const seen = new Set<string>();
        for (let p: string | undefined = start; p !== undefined; p = waits.get(p)) {
          if (seen.has(p)) return true;
          seen.add(p);
        }
        return false;
      });
      return inCycle;
    });
    expect(answers).toEqual(q.variants.map((v) => choice(v).correct.startsWith("Deadlock")));
    expect(answers.filter(Boolean).length).toBe(2);
  });

  it("the arrow questions name the solid and dashed arrows as the pack does", () => {
    const q = questions("deadlock-sketches", "arrows").find((x) => x.id === "dl.q.arrows")!;
    const texts = q.variants.map((v) => choice(v).correct);
    expect(texts).toContain("R1 is allocated to P1");
    expect(texts).toContain("P2 is requesting R1");
    for (const v of q.variants.slice(0, 3)) expect(v.figure?.type).toBe("resource-graph");
  });

  it("the four condition names are exactly the pack's and recovery has no faster-CPU answer", () => {
    const names = questions("four-conditions", "name-the-condition")[0].variants.map((v) => choice(v).correct);
    expect(names.sort()).toEqual(["Circular wait", "Hold and wait", "Mutual exclusion", "No preemption"]);
    for (const v of questions("recovery-starvation", "recovery")[0].variants) expect(choice(v).correct).not.toMatch(/clock|faster/i);
  });
});
