import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { statesAfterEdges } from "@/kinds/timing/logic";
import { SETS } from "./timing";

const questions = () => getActivity("ecet111", "timing", "timing-diagrams")!.activity.questions;
const trace = (v: ReturnType<typeof questions>[number]["variants"][number]) => {
  if (v.spec.kind !== "timing") throw new Error(`${v.id}: timing expected`);
  return statesAfterEdges(v.spec).map((s) => s.join(""));
};

describe("Chapter 5 timing diagrams practise all four flip-flops (#622)", () => {
  it("has one question per flip-flop in the objective's order, each with three waveforms of that flip-flop", () => {
    expect(questions().map((q) => q.id)).toEqual(["tm.q.sr", "tm.q.d", "tm.q.jk", "tm.q.t"]);
    const ff = ["SR", "D", "JK", "T"];
    questions().forEach((q, i) => {
      expect(q.variants.length, q.id).toBe(3);
      for (const v of q.variants) {
        if (v.spec.kind !== "timing") throw new Error(`${v.id}: timing expected`);
        expect(v.spec.flipFlop, `${q.id}/${v.id}`).toBe(ff[i]);
        expect(v.prompt, `${q.id}/${v.id}`).toContain(`Q = ${v.spec.initialQ}`);
      }
    });
  });

  it("a first-try student sees both edge types and all four types: the first sets mix rising and falling", () => {
    const first = Object.values(SETS).map((s) => s[0].edge);
    expect(first).toEqual(["rising", "rising", "falling", "falling"]);
    for (const [ff, sets] of Object.entries(SETS)) expect(new Set(sets.map((s) => s.edge)).size, ff).toBe(2);
  });

  it("the retry waveforms of one flip-flop differ from each other", () => {
    for (const q of questions()) {
      const traces = q.variants.map((v) => trace(v).join(" "));
      expect(new Set(traces).size, q.id).toBe(traces.length);
    }
  });

  it("every waveform is a real exercise: Q changes at least twice and also holds at least once", () => {
    for (const q of questions()) {
      for (const v of q.variants) {
        const states = trace(v);
        const initial = v.spec.kind === "timing" ? String(v.spec.initialQ) : "";
        const seq = [initial, ...states];
        const changes = seq.slice(1).filter((x, i) => x !== seq[i]).length;
        expect(changes, `${q.id}/${v.id}`).toBeGreaterThanOrEqual(2);
        expect(seq.length - 1 - changes, `${q.id}/${v.id}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("SR never has S = R = 1; JK sets contain a 1 1 toggle; T sets contain a T = 1 toggle", () => {
    for (const s of SETS.SR) expect(s.perEdge[0].some((x, i) => x === 1 && s.perEdge[1][i] === 1), s.id).toBe(false);
    for (const s of SETS.JK) expect(s.perEdge[0].some((x, i) => x === 1 && s.perEdge[1][i] === 1), s.id).toBe(true);
    for (const s of SETS.T) expect(s.perEdge[0].includes(1), s.id).toBe(true);
  });
});
