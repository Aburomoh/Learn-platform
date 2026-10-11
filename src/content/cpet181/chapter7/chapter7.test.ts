import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { tapeBlocks } from "@/kinds/shared/figures/TapeFigure";
import { IBG_SETS, IRG_RECORDS, gapsOf } from "./devices";

const COURSE = "cpet181";
const ACTIVITIES: [string, string][] = [
  ["device-manager", "deallocation"],
  ["device-manager", "device-types"],
  ["device-manager", "media"],
  ["magnetic-tape", "gap-kinds"],
  ["magnetic-tape", "count-gaps"],
  ["magnetic-tape", "blocking"],
  ["magnetic-tape", "tape-vs-disk"],
  ["magnetic-disks", "heads"],
  ["magnetic-disks", "tracks"],
  ["magnetic-disks", "address"],
  ["magnetic-disks", "disk-pros-cons"],
  ["optical-solid-state", "discs"],
  ["optical-solid-state", "cd-types"],
  ["optical-solid-state", "ssd-flash"],
  ["optical-solid-state", "hdd-ssd"],
];
const questions = (topic: string, activity: string) => getActivity(COURSE, topic, activity)!.activity.questions;
const find = (id: string) => ACTIVITIES.flatMap(([t, a]) => questions(t, a)).find((q) => q.id === id)!;
const numeric = (id: string) =>
  find(id).variants.map((v) => {
    if (v.spec.kind !== "numeric") throw new Error(`${id}/${v.id}: numeric expected`);
    return v.spec.answer;
  });
const correct = (v: ReturnType<typeof find>["variants"][number]) => {
  if (v.spec.kind !== "multiple-choice") throw new Error(`${v.id}: multiple-choice expected`);
  const { options, correctOptionId } = v.spec;
  return options.find((o) => o.id === correctOptionId)!.text;
};

describe("CPET 181 Chapter 7 device management content (#630)", () => {
  it("the gap counts follow the pack's rule and the figure's own tapeBlocks: 10 records give 9 IRGs", () => {
    expect(IRG_RECORDS[0]).toBe(10);
    expect(numeric("tp.q.irg")).toEqual(IRG_RECORDS.map((n) => String(tapeBlocks(n).length - 1)));
    expect(numeric("tp.q.irg")[0]).toBe("9");
    expect(numeric("tp.q.ibg")).toEqual(IBG_SETS.map(([n, b]) => String(tapeBlocks(n, b).length - 1)));
    for (const [n, b] of IBG_SETS) {
      expect(n % b, `${n}/${b}`).toBe(0); // whole blocks only: the prompt says exactly what the figure draws
      expect(gapsOf(n, b)).toBe(n / b - 1);
    }
  });

  it("the tape figure matches the prompt and shows no count (the gap numbers are the result state's)", () => {
    for (const [id, sets] of [["tp.q.irg", IRG_RECORDS.map((n) => [n] as [number, number?])], ["tp.q.ibg", IBG_SETS as [number, number?][]]] as const) {
      find(id).variants.forEach((v, i) => {
        if (v.figure?.type !== "tape") throw new Error(`${id}/${v.id}: tape figure expected`);
        expect(v.figure.records, `${id}/${v.id}`).toBe(sets[i][0]);
        expect(v.figure.block, `${id}/${v.id}`).toBe(sets[i][1]);
        expect(v.prompt, `${id}/${v.id}`).toContain(`${sets[i][0]} records`);
      });
    }
  });

  it("the tracks figure matches the answer: concentric is a magnetic disk, spiral an optical disc", () => {
    const q = find("dk.q.tracks");
    for (const v of q.variants) {
      if (v.figure?.type === "tracks") expect(correct(v), v.id).toBe(v.figure.tracks === "concentric" ? "Magnetic disk" : "Optical disc");
    }
    expect(q.variants.filter((v) => v.figure?.type === "tracks")).toHaveLength(2);
  });

  it("every question has three or four variants, distinct options, and no answer before the last rung", () => {
    for (const [topic, activity] of ACTIVITIES) {
      for (const q of questions(topic, activity)) {
        expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
        for (const v of q.variants) {
          if (v.spec.kind !== "multiple-choice") continue;
          const texts = v.spec.options.map((o) => o.text);
          expect(new Set(texts).size, `${q.id}/${v.id}`).toBe(texts.length);
          const early = v.hints.slice(0, -1).map((h) => h.text).join(" ");
          expect(early, `${q.id}/${v.id}`).not.toContain(correct(v));
        }
      }
    }
  });

  it("the cost cells the pack leaves open are not assessed: no DVD cost, no 15 times a CD", () => {
    const all = ACTIVITIES.flatMap(([t, a]) => questions(t, a)).flatMap((q) => q.variants).map((v) => [v.prompt, ...v.hints.map((h) => h.text), ...v.explanation.map((e) => e.say)].join(" "));
    for (const t of all) expect(t).not.toMatch(/15 times|fifteen times|cost of a DVD/i);
  });
});
