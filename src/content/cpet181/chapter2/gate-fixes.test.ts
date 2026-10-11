import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { efficiency } from "./maps";

const COURSE = "cpet181";
const find = (topic: string, activity: string, id: string) => getActivity(COURSE, topic, activity)!.activity.questions.find((q) => q.id === id)!;
const correct = (v: ReturnType<typeof find>["variants"][number]) => {
  if (v.spec.kind !== "multiple-choice") throw new Error(`${v.id}: multiple-choice expected`);
  const { options, correctOptionId } = v.spec;
  return { text: options.find((o) => o.id === correctOptionId)!.text, texts: options.map((o) => o.text) };
};

describe("CPET 181 Chapter 2 Pedagogy gate fixes (#637)", () => {
  it("tell-apart items for fixed against dynamic partitions and their deallocation exist, before the maps", () => {
    const topic = getActivity(COURSE, "memory-schemes", "partition-kinds");
    expect(topic).toBeTruthy();
    for (const [id, expected] of [
      ["mt.q.partitions", ["Fixed partitions", "Dynamic partitions", "Fixed partitions", "Dynamic partitions"]],
      ["mt.q.deallocation", ["Fixed partitions", "Dynamic partitions", "Fixed partitions", "Dynamic partitions"]],
    ] as const) {
      expect(find("memory-schemes", "partition-kinds", id).variants.map((v) => correct(v).text), id).toEqual(expected);
    }
  });

  it("C2-2: the four schemes are told apart in one item, in the pack's order (#642)", () => {
    const q = find("memory-schemes", "memory-schemes", "mt.q.four-schemes");
    expect(q.variants.map((v) => correct(v).text)).toEqual(["Single-user contiguous", "Fixed partitions", "Dynamic partitions", "Relocatable dynamic partitions"]);
    for (const v of q.variants) expect(correct(v).texts, v.id).toHaveLength(4);
  });

  it("the s.34 item says what the slide shows: the instruction text is unchanged, the register is added (53248 − 12288 = 40960)", () => {
    expect(53248 - 12288).toBe(40960);
    const v = find("relocatable-partitions", "compaction-terms", "rl.q.addresses").variants[3];
    expect(v.prompt).toContain("Load 4, 53248");
    expect(v.explanation.map((e) => e.say).join(" ")).toContain("The instruction still reads Load 4, 53248");
    expect(v.explanation.map((e) => e.say).join(" ")).toContain("40960");
  });

  it("bounds against relocation register, and addresses against data values, have their own items next to compaction", () => {
    expect(find("relocatable-partitions", "compaction-terms", "rl.q.registers").variants.map((v) => correct(v).text)).toEqual(["Bounds register", "Relocation register", "Relocation register", "Bounds register"]);
    expect(find("relocatable-partitions", "compaction-terms", "rl.q.addresses").variants.map((v) => correct(v).text)).toEqual([
      "The addresses in the program",
      "The data values",
      "It stays 37",
      "The address it refers to, through the relocation register (53248 becomes 40960)",
    ]);
  });

  it("the efficiency step is computed: best-fit wins on s.21, s.22 and the new set, and the answer says why", () => {
    const q = find("fixed-partitions", "fixed-partitions", "fx.q.efficient");
    const best = find("fixed-partitions", "fixed-partitions", "fx.q.best");
    expect(q.variants.map((v) => v.id)).toEqual(best.variants.map((v) => v.id)); // the same number sets, same positions (#141)
    const sets = [
      { partitions: [35, 20, 55, 30], jobs: [15, 25, 35, 20] },
      { partitions: [30, 40, 15, 20], jobs: [12, 24, 15, 32] },
      { partitions: [60, 25, 40, 30], jobs: [20, 35, 28, 55] },
    ];
    q.variants.forEach((v, i) => {
      const { text } = correct(v);
      expect(text, v.id).toMatch(/^Best-fit: it places 4 of the 4 jobs, while first-fit leaves J\d waiting$/);
      expect(v.prompt, v.id).toContain(sets[i].partitions.join(", "));
      expect(v.prompt, v.id).toContain(sets[i].jobs.join(", "));
    });
  });

  it("the efficiency verdict is recomputed by hand-rolled first-fit and best-fit, and a tie reads as Neither", () => {
    // independent simulation of fixed partitions (leftover not reused)
    const run = (parts: number[], jobs: number[], fit: "first" | "best") => {
      const free = parts.map((size) => ({ size, used: false }));
      let placed = 0;
      let waste = 0;
      for (const j of jobs) {
        const cands = free.filter((b) => !b.used && b.size >= j);
        if (!cands.length) continue;
        const pick = fit === "first" ? cands[0] : cands.reduce((a, b) => (b.size < a.size ? b : a));
        pick.used = true;
        placed++;
        waste += pick.size - j;
      }
      return { placed, waste };
    };
    for (const s of [
      { partitions: [35, 20, 55, 30], jobs: [15, 25, 35, 20] },
      { partitions: [30, 40, 15, 20], jobs: [12, 24, 15, 32] },
      { partitions: [60, 25, 40, 30], jobs: [20, 35, 28, 55] },
      { partitions: [20, 30, 40, 50], jobs: [15, 25, 35, 45] }, // first-fit does as well as best-fit
    ]) {
      const f = run(s.partitions, s.jobs, "first");
      const b = run(s.partitions, s.jobs, "best");
      const winner = f.placed !== b.placed ? (f.placed > b.placed ? "first" : "best") : f.waste !== b.waste ? (f.waste < b.waste ? "first" : "best") : "same";
      expect(efficiency({ partitions: s.partitions, jobs: s.jobs.map((size, i) => ({ id: `J${i + 1}`, size })) }).winner).toBe(winner);
    }
  });

  it("every new question has three or four variants, distinct options, and no answer before the last rung", () => {
    for (const [topic, activity, id] of [
      ["memory-schemes", "partition-kinds", "mt.q.partitions"],
      ["memory-schemes", "partition-kinds", "mt.q.deallocation"],
      ["relocatable-partitions", "compaction-terms", "rl.q.registers"],
      ["relocatable-partitions", "compaction-terms", "rl.q.addresses"],
      ["memory-schemes", "memory-schemes", "mt.q.four-schemes"],
      ["fixed-partitions", "fixed-partitions", "fx.q.efficient"],
    ]) {
      const q = find(topic, activity, id);
      expect(q.variants.length, id).toBeGreaterThanOrEqual(3);
      expect(q.variants.length, id).toBeLessThanOrEqual(4);
      for (const v of q.variants) {
        const { text, texts } = correct(v);
        expect(new Set(texts).size, `${id}/${v.id}`).toBe(texts.length);
        expect(v.hints.slice(0, -1).map((h) => h.text).join(" "), `${id}/${v.id}`).not.toContain(text);
      }
    }
  });
});
