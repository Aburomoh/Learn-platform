import { describe, expect, it } from "vitest";
import { getActivity } from "@/content";
import { hasMessage } from "@/tutor/messages";

/** The Hex digits practice (#726): every wrong pick is named, and the first hint is not the answer. */
const act = getActivity("ecet111", "number-systems", "hex-digits")!.activity;

describe("Hex digits practice (#726)", () => {
  it("every distractor of every variant maps to a misconception with a catalogue nudge", () => {
    const bare: string[] = [];
    for (const q of act.questions)
      for (const v of q.variants) {
        if (v.spec.kind !== "multiple-choice") continue;
        for (const o of v.spec.options) {
          if (o.id === v.spec.correctOptionId) continue;
          const m = v.misconceptions.find((x) => x.detect.type === "option" && x.detect.optionId === o.id);
          if (!m || !hasMessage(m.nudgeKey)) bare.push(`${q.id}/${v.id}: ${o.text}`);
        }
      }
    expect(bare).toEqual([]);
  });

  it("reading 0111 as 8 names the bits, not a letter", () => {
    const v = act.questions[2].variants.find((x) => x.id === "vbits7")!;
    const eight = v.spec.kind === "multiple-choice" ? v.spec.options.find((o) => o.text === "8")! : undefined;
    const m = v.misconceptions.find((x) => x.detect.type === "option" && x.detect.optionId === eight!.id)!;
    expect(m.nudgeKey).toBe("ns.bits-neighbour");
  });

  it("the first hint points and does not contain the answer", () => {
    for (const q of act.questions)
      for (const v of q.variants) {
        const first = v.hints.find((h) => h.rung === 2)!;
        expect(first.text).not.toMatch(/B = 11|{fact}/);
      }
  });
});
