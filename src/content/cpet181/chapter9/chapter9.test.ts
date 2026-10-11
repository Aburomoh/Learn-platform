import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

const COURSE = "cpet181";
const ACTIVITIES: [string, string][] = [
  ["network-basics", "terms"],
  ["network-basics", "client-server"],
  ["topologies", "shape"],
  ["topologies", "traits"],
  ["topologies", "factors"],
  ["topologies", "hybrid"],
  ["network-types", "types"],
  ["network-types", "bridge-gateway"],
  ["network-types", "wireless"],
  ["switching-security", "switching"],
  ["switching-security", "protection"],
  ["switching-security", "ethics"],
];
const questions = (topic: string, activity: string) => getActivity(COURSE, topic, activity)!.activity.questions;
const find = (id: string) => ACTIVITIES.flatMap(([t, a]) => questions(t, a)).find((q) => q.id === id)!;
const correct = (v: ReturnType<typeof find>["variants"][number]) => {
  if (v.spec.kind !== "multiple-choice") throw new Error(`${v.id}: multiple-choice expected`);
  const { options, correctOptionId } = v.spec;
  return options.find((o) => o.id === correctOptionId)!.text;
};

describe("CPET 181 Chapter 9 networks and security content (#635)", () => {
  it("the topology figures match the answers: star, ring, bus, tree and hybrid", () => {
    const named = [...find("tp.q.shape").variants, find("tp.q.hybrid").variants[0]];
    for (const v of named) {
      if (v.figure?.type !== "topology") throw new Error(`${v.id}: topology figure expected`);
      expect(correct(v).toLowerCase(), v.id).toBe(v.figure.topology);
    }
    expect(find("tp.q.shape").variants.map((v) => (v.figure?.type === "topology" ? v.figure.topology : ""))).toEqual(["star", "ring", "bus", "tree"]);
  });

  it("the sketches carry no name of the topology in the prompt or the caption", () => {
    for (const v of [...find("tp.q.shape").variants, find("tp.q.hybrid").variants[0]]) {
      const text = `${v.prompt} ${v.figure?.type === "topology" ? v.figure.caption : ""}`.toLowerCase();
      for (const name of ["star", "ring", "bus", "tree", "hybrid"]) expect(text, `${v.id}: ${name}`).not.toContain(name);
    }
  });

  it("every question has three or four variants, distinct options, and no answer before the last rung", () => {
    for (const [topic, activity] of ACTIVITIES) {
      for (const q of questions(topic, activity)) {
        expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
        for (const v of q.variants) {
          if (v.spec.kind !== "multiple-choice") throw new Error(`${q.id}/${v.id}: multiple-choice expected`);
          const texts = v.spec.options.map((o) => o.text);
          expect(new Set(texts).size, `${q.id}/${v.id}`).toBe(texts.length);
          const early = v.hints.slice(0, -1).map((h) => h.text).join(" ");
          expect(early, `${q.id}/${v.id}`).not.toContain(correct(v));
        }
      }
    }
  });

  it("only what the pack gives is asked: no NOS against D/OS, and no 802.11 compatibility", () => {
    const all = ACTIVITIES.flatMap(([t, a]) => questions(t, a)).flatMap((q) => q.variants).map((v) => [v.prompt, ...v.hints.map((h) => h.text), ...v.explanation.map((e) => e.say)].join(" "));
    for (const t of all) {
      expect(t).not.toMatch(/\bD\/OS\b|\bNOS\b|distributed operating system/i);
      expect(t).not.toMatch(/compatib/i);
    }
  });

  it("the wireless standards are the pack's: a 54 Mbps 5 GHz, b 11 Mbps 2.4 GHz, g 54 Mbps 2.4 GHz", () => {
    const answers = find("wl.q.standards").variants.map(correct);
    expect(answers).toEqual(["802.11b", "802.11a", "802.11g", "802.11a"]);
  });
});
