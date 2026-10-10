import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { goals, type Goal, type PlaceGoal, type ReleaseGoal, type MoveGoal, type RegisterGoal } from "@/kinds/memory-map/logic";
import type { MemoryMapSpec } from "@/kinds/memory-map/spec";

const COURSE = "cpet181";

function specs(topic: string, activity: string, question: string) {
  const q = getActivity(COURSE, topic, activity)!.activity.questions.find((x) => x.id === question)!;
  return q.variants.map((v) => {
    if (v.spec.kind !== "memory-map") throw new Error(`${v.id}: memory-map expected`);
    return { id: v.id, spec: v.spec as MemoryMapSpec };
  });
}
const placeGoals = (g: Goal[]) => g.filter((x): x is PlaceGoal => x.tag === "place");

describe("CPET 181 Chapter 2 content (#582)", () => {
  it("every question has three or four variants, and the map kinds use the memory-map kind", () => {
    for (const [topic, activity, questions] of [
      ["fixed-partitions", "fixed-partitions", ["fx.q.first", "fx.q.best"]],
      ["dynamic-partitions", "dynamic-placement", ["dy.q.first", "dy.q.best"]],
      ["dynamic-partitions", "release", ["dy.q.case1", "dy.q.case2", "dy.q.case3"]],
      ["relocatable-partitions", "compaction", ["rl.q.compact"]],
    ] as const)
      for (const question of questions) {
        const v = specs(topic, activity, question);
        expect(v.length, question).toBeGreaterThanOrEqual(3);
        expect(v.length, question).toBeLessThanOrEqual(4);
      }
  });

  it("tie conventions: first-fit takes the first block from the top that is large enough; best-fit the smallest, a tie going to the first from the top", () => {
    let checked = 0;
    for (const [topic, activity, question] of [
      ["fixed-partitions", "fixed-partitions", "fx.q.first"],
      ["fixed-partitions", "fixed-partitions", "fx.q.best"],
      ["dynamic-partitions", "dynamic-placement", "dy.q.first"],
      ["dynamic-partitions", "dynamic-placement", "dy.q.best"],
    ] as const)
      for (const { id, spec } of specs(topic, activity, question))
        for (const g of placeGoals(goals(spec))) {
          const fits = g.before.map((r, i) => ({ r, i })).filter(({ r }) => r.job === null && r.size >= g.job.size);
          let expected: number | null = null;
          if (fits.length) {
            if (spec.fit === "first") expected = fits[0].i;
            else {
              const smallest = Math.min(...fits.map(({ r }) => r.size));
              expected = fits.find(({ r }) => r.size === smallest)!.i;
            }
          }
          expect(g.blockIndex, `${question}/${id}/${g.job.id}`).toBe(expected);
          checked++;
        }
    expect(checked).toBeGreaterThanOrEqual(20);
  });

  it("the deck's worked sets come out as the pack records them (s.12, s.21, s.22)", () => {
    const waiting = (topic: string, activity: string, question: string, id: string) => {
      const v = specs(topic, activity, question).find((x) => x.id === id)!;
      return placeGoals(goals(v.spec)).filter((g) => g.blockIndex === null).map((g) => g.job.id);
    };
    expect(waiting("fixed-partitions", "fixed-partitions", "fx.q.first", "f12")).toEqual(["J3"]); // s.12: J3 waits
    expect(waiting("fixed-partitions", "fixed-partitions", "fx.q.first", "f21")).toEqual(["J3"]); // s.21 first-fit: P3 waits
    expect(waiting("fixed-partitions", "fixed-partitions", "fx.q.best", "b21")).toEqual([]); // s.21 best-fit: none waits
    expect(waiting("fixed-partitions", "fixed-partitions", "fx.q.best", "b22")).toEqual([]); // s.22 best-fit: none waits
    expect(waiting("fixed-partitions", "fixed-partitions", "fx.q.first", "f-all")).toEqual([]); // first-fit does as well as best-fit
    expect(waiting("fixed-partitions", "fixed-partitions", "fx.q.best", "b-new")).toEqual([]);
  });

  it("s.21 best-fit leaves 0, 5, 35 and 5 K wasted in partitions 35, 20, 55, 30", () => {
    const v = specs("fixed-partitions", "fixed-partitions", "fx.q.best").find((x) => x.id === "b21")!;
    const waste = goals(v.spec).find((g) => g.tag === "waste")!;
    expect(waste.tag === "waste" && waste.values).toEqual([0, 5, 35, 5]); // P3 in 35, P1 in 20, P4 in 55, P2 in 30
  });

  it("dynamic s.15 (e): J7 takes the 20 K hole, J8 waits, and 35 K is free in three pieces", () => {
    const v = specs("dynamic-partitions", "dynamic-placement", "dy.q.first").find((x) => x.id === "d15e")!;
    const all = goals(v.spec);
    const [j7, j8] = placeGoals(all);
    expect(j7.blockIndex).not.toBeNull();
    expect(j7.before[j7.blockIndex!].size).toBe(20);
    expect(j8.blockIndex).toBeNull();
    const holes = all.find((g) => g.tag === "holes")!;
    expect(holes.tag === "holes" && holes.value).toBe(35);
  });

  it("release cases 1–3 give the free block the pack's rule gives", () => {
    const expected: Record<string, [number, number]> = {
      "r1-after": [30, 15],
      "r1-before": [10, 40],
      "r1-mid": [40, 20],
      "r2-a": [30, 50],
      "r2-b": [10, 38],
      "r2-c": [26, 29],
      "r3-a": [30, 15],
      "r3-b": [22, 18],
      "r3-c": [35, 10],
    };
    const cases: [string, string][] = [["dy.q.case1", "case 1"], ["dy.q.case2", "case 2"], ["dy.q.case3", "case 3"]];
    let n = 0;
    for (const [question] of cases)
      for (const { id, spec } of specs("dynamic-partitions", "release", question)) {
        const g = goals(spec).find((x): x is ReleaseGoal => x.tag === "release")!;
        expect([g.result.start, g.result.size], id).toEqual(expected[id]);
        n++;
      }
    expect(n).toBe(9);
    // case 1 joins one neighbour, case 2 two, case 3 none
    const sides = (id: string, q: string) => {
      const g = goals(specs("dynamic-partitions", "release", q).find((x) => x.id === id)!.spec).find((x): x is ReleaseGoal => x.tag === "release")!;
      return Number(g.below !== null) + Number(g.above !== null);
    };
    expect(["r1-after", "r1-before", "r1-mid"].map((id) => sides(id, "dy.q.case1"))).toEqual([1, 1, 1]);
    expect(["r2-a", "r2-b", "r2-c"].map((id) => sides(id, "dy.q.case2"))).toEqual([2, 2, 2]);
    expect(["r3-a", "r3-b", "r3-c"].map((id) => sides(id, "dy.q.case3"))).toEqual([0, 0, 0]);
  });

  it("compaction: new starts and relocation registers match the pack (s.36: −15 and −30 K, s.37: −12 and −47 K)", () => {
    const expected: Record<string, { moves: [string, number][]; registers: [string, number][] }> = {
      c36: { moves: [["J3", 30], ["J2", 55]], registers: [["J3", -15], ["J2", -30]] },
      c37: { moves: [["J2", 40], ["J3", 68]], registers: [["J2", -12], ["J3", -47]] },
      "c-new": { moves: [["J2", 32], ["J3", 48]], registers: [["J2", -8], ["J3", -22]] },
    };
    for (const { id, spec } of specs("relocatable-partitions", "compaction", "rl.q.compact")) {
      const all = goals(spec);
      const moves = all.filter((g): g is MoveGoal => g.tag === "move" && g.relocation.delta !== 0).map((g) => [g.job.id, g.relocation.newStart]);
      const registers = all.filter((g): g is RegisterGoal => g.tag === "register").map((g) => [g.job.id, g.relocation.delta]);
      expect(moves, id).toEqual(expected[id].moves);
      expect(registers, id).toEqual(expected[id].registers);
    }
  });
});
